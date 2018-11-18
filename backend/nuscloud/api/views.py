import requests
from django.contrib.auth import (
    authenticate, login, logout, get_user_model
)
from django.utils.translation import ugettext as _
from rest_framework import (
    exceptions, permissions, serializers, status
)
from rest_framework.views import APIView, Response
from rest_framework_jwt.settings import api_settings

from helpers.utils import (
    IVLE_PROFILE_URL, IVLE_MODULES_URL, IVLE_TOKEN_INFO_URL,
    BOX_CLIENT_SECRET, BOX_CLIENT_ID, ONEDRIVE_CLIENT_ID,
    ONEDRIVE_CLIENT_SECRET, ONEDRIVE_SCOPES
)
from .models import User, Module
from .tasks import check_for_update_fast
from .periodic_tasks.utils import get_onedrive_client
import datetime

import asyncio
import dropbox
import onedrivesdk
from dropbox.exceptions import BadInputError
from boxsdk import Client, OAuth2
from boxsdk.network.default_network import DefaultNetwork
from dateutil import parser as dateparser
import pytz

jwt_payload_handler = api_settings.JWT_PAYLOAD_HANDLER
jwt_encode_handler = api_settings.JWT_ENCODE_HANDLER
jwt_response_payload_handler = api_settings.JWT_RESPONSE_PAYLOAD_HANDLER


def get_user(request):
    return request.user


class LoginSerializer(serializers.Serializer):
    def __init__(self, *args, **kwargs):
        super(LoginSerializer, self).__init__(*args, **kwargs)
        self.fields['ivle_token'] = serializers.CharField()

    @property
    def user_name_field(self):
        return get_user_model().USERNAME_FIELD

    @property
    def object(self):
        return self.validated_data

    def validate(self, attrs):
        ivle_token = attrs.get('ivle_token')

        if not ivle_token:
            msg = _('Must include "ivle_token".')
            raise serializers.ValidationError(msg)

        res = requests.get(IVLE_PROFILE_URL.format(AUTH_TOKEN=ivle_token))

        res_json = res.json()
        if res_json['Comments'] != "Valid login!":
            msg = _('Invalid ivle_token provided. Token provided: ' + ivle_token)
            raise exceptions.AuthenticationFailed(msg)

        ivle_user_id = res_json['Results'][0]['UserID']

        user = User.objects.filter(ivle_user_id=ivle_user_id).first()

        if not user:
            # New user!
            # Get all modules, sync all by default
            name = res_json['Results'][0]['Name']
            email = res_json['Results'][0]['Email']

            res = requests.get(
                IVLE_MODULES_URL.format(AUTH_TOKEN=ivle_token)
            )
            user = User.objects.create_user(
                ivle_user_id,
                name,
                email,
                ivle_token,
                [m['CourseCode'] for m in res.json()['Results']]
            )

            # TODO: I think this won't be necessary if we just do regular
            # refresh anyway.
            # res_json = requests.get(
            #     IVLE_TOKEN_INFO_URL.format(AUTH_TOKEN=ivle_token)
            # ).json()
            # user.ivle_expiry = dateparser.parse(res_json['ValidTill_js'])
            user.save()

        # refresh the ivle token if we got a new one
        user.ivle_token = ivle_token
        user.save()

        payload = jwt_payload_handler(user)

        return {
            'user': user,
            'token': jwt_encode_handler(payload)
        }


class ObtainJwtToken(APIView):

    permission_classes = (permissions.AllowAny,)

    def get_serializer_context(self):
        return {
            'request': self.request,
            'view': self,
        }

    def get_serializer(self, *args, **kwargs):
        kwargs['context'] = self.get_serializer_context()
        return LoginSerializer(*args, **kwargs)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)

        if serializer.is_valid():
            user = serializer.object.get('user') or request.user
            token = serializer.object.get('token')
            response_data = jwt_response_payload_handler(token, user, request)
            response = Response(response_data)
            if api_settings.JWT_AUTH_COOKIE:
                expiration = (datetime.utcnow() +
                              api_settings.JWT_EXPIRATION_DELTA)
                response.set_cookie(api_settings.JWT_AUTH_COOKIE,
                                    token,
                                    expires=expiration,
                                    httponly=True)
            return response

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class GetProfile(APIView):

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = get_user(request)

        # Get user profile from IVLE
        profile = {
            'ivle_id': user.ivle_user_id,
            'name': user.name
        }

        # Get all modules taking and sync status
        # TODO: What if the module is dropped but the synced module still exist?
        modules = [{
            'code': m.module_code,
            'sync': user.synced_modules.filter(module_code=m.module_code).exists()
        } for m in user.taking_modules.all()]

        # Cloud storage status
        storages = {
            'dropbox': bool(user.dropbox_token),
            'box': bool(user.box_access_token) and bool(user.box_refresh_token),
            'gdrive': bool(user.gdrive_token),
            'onedrive': bool(user.onedrive_access_token) and bool(user.onedrive_refresh_token)
        }

        # Update status
        sg_tz = pytz.timezone('Asia/Singapore')
        local_time = user.last_synced.astimezone(sg_tz)

        status = {
            'sync_status': user.sync_status,
            'last_updated': local_time
        }

        return Response({
            'profile': profile,
            'modules': modules,
            'storages': storages,
            'status': status
        })


class StorageSerializerValidator:

    types = ('add', 'remove')
    storages = ('dropbox', 'gdrive', 'box', 'onedrive')

    @staticmethod
    def validate_type(value):
        if value in StorageSerializerValidator.types:
            return
        raise serializers.ValidationError(
            'This field must be in ' + str(StorageSerializerValidator.types))

    @staticmethod
    def validate_storages(value):
        if value in StorageSerializerValidator.storages:
            return
        raise serializers.ValidationError(
            'This field must be in ' + str(StorageSerializerValidator.storages)
        )


class StorageSerializer(serializers.Serializer):

    type = serializers.CharField(
        max_length=10, validators=[StorageSerializerValidator.validate_type])
    token = serializers.CharField(max_length=2000)
    refresh_token = serializers.CharField(max_length=2000, required=False)
    storage = serializers.CharField(
        max_length=20, validators=[StorageSerializerValidator.validate_storages])

    def validate(self, attrs):
        if attrs.get('type') == 'remove':
            return {
                'type': attrs.get('type'),
                'storage': attrs.get('storage')
            }

        storage = attrs.get('storage')

        # check if valid token and get expiry date
        if storage == 'dropbox':
            self.validate_dropbox(attrs.get('token'))
        elif storage == 'gdrive':
            self.validate_gdrive()
        elif storage == 'box':
            self.validate_box(attrs)
        elif storage == 'onedrive':
            self.validate_onedrive(attrs)
        else:
            raise serializers.ValidationError('This storage is not supported.')

        return attrs

    def validate_dropbox(self, dropbox_token):
        dbx = dropbox.Dropbox(dropbox_token)
        try:
            dbx.files_list_folder('', limit=1)
        except BadInputError:
            raise serializers.ValidationError('The dropbox token is not valid.')

    def validate_gdrive(self):
        # todo
        pass

    def validate_box(self, attrs):
        if 'refresh_token' not in attrs:
            raise serializers.ValidationError('No refresh token received for Box.')
        try:
            oauth = OAuth2(
                client_id=BOX_CLIENT_ID,
                client_secret=BOX_CLIENT_SECRET,
                access_token=attrs.get('token', ''),
                refresh_token=attrs.get('refresh_token', '')
            )

            # Should also be able to test our token through this.
            # Regenerate new tokens and replace it in attrs
            # so that we can still use it later
            access, refresh = oauth.refresh(access_token_to_refresh=attrs.get('token', ''))
            attrs['token'] = access
            attrs['refresh_token'] = refresh

        except:
            raise serializers.ValidationError('The Box access and/or refresh '
                                              'token are invalid.')

    def validate_onedrive(self, attrs):
        if 'refresh_token' not in attrs:
            # redirect_uri
            raise serializers.ValidationError('No refresh token received for OneDrive.')

        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            onedrive = get_onedrive_client(loop)
            auth_code, redirect_uri = attrs['token'], attrs['refresh_token']
            onedrive.auth_provider.authenticate(
                auth_code, redirect_uri, ONEDRIVE_CLIENT_SECRET)

            # This helps us identify if we are allowed to proceed.
            # Usually NUS OneDrive accounts can't do this.
            onedrive.drive.special['approot'].get()

            # Immediately refresh the tokens for next round
            onedrive.auth_provider.refresh_token()
            attrs['token'] = onedrive.auth_provider._session.access_token
            attrs['refresh_token'] = onedrive.auth_provider._session.refresh_token
            loop.close()

        except:
            raise serializers.ValidationError('The OneDrive access and/or refresh '
                                              'token are invalid.')


class Storages(APIView):

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        """
        Expects a request like
        {
            'type': 'add' / 'remove',
            'token': '...',
            'storage': '...',
        }
        """
        serializer = StorageSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        req_type = serializer.validated_data.get('type')
        user = get_user(request)

        if req_type == 'add':
            return Response(self.add_storage(user, serializer.validated_data))
        else:
            return Response(self.remove_storage(user, serializer.validated_data))

    def add_storage(self, user, validated_data):
        if validated_data['storage'] == 'dropbox':
            user.dropbox_token = validated_data['token']
        elif validated_data['storage'] == 'gdrive':
            user.gdrive_token = validated_data['token']
        elif validated_data['storage'] == 'box':
            # Do not need to refresh again since we have done it
            # immediately after validating. This is already a fresh one.
            user.box_access_token = validated_data['token']
            user.box_refresh_token = validated_data['refresh_token']
        elif validated_data['storage'] == 'onedrive':
            user.onedrive_access_token = validated_data['token']
            user.onedrive_refresh_token = validated_data['refresh_token']

        user.save()

        # Do this asynchronously in celery
        check_for_update_fast.delay(user.ivle_user_id)

        return {
            'status': 'Successfully added {storage} token'.format(
                storage=validated_data['storage']
            )
        }

    def remove_storage(self, user, validated_data):
        if validated_data['storage'] == 'dropbox':
            user.dropbox_token = None
        elif validated_data['storage'] == 'gdrive':
            user.gdrive_token = None
        elif validated_data['storage'] == 'box':
            user.box_access_token = None
            user.box_refresh_token = None
        elif validated_data['storage'] == 'onedrive':
            user.onedrive_access_token = None
            user.onedrive_refresh_token = None
        user.save()

        return {
            'status': 'Successfully removed {storage} token'.format(
                storage=validated_data['storage']
            )
        }


class ModuleSerializerValidator:

    types = ('add', 'remove')

    @staticmethod
    def validate_type(value):
        if value in ModuleSerializerValidator.types:
            return
        raise serializers.ValidationError(
            'This field must be in ' + str(ModuleSerializerValidator.types)
        )


class ModuleSerializer(serializers.Serializer):
    """
    Ensures that the module is a valid module the user is taking
    (according to IVLE).
    """
    type = serializers.CharField(
        max_length=10, validators=[ModuleSerializerValidator.validate_type]
    )
    module_code = serializers.CharField(max_length=20)

    def validate(self, attrs):
        user = get_user(self.context['request'])
        module_code = attrs.get('module_code')
        if attrs.get('type') == 'remove':
            if not user.synced_modules.filter(module_code=module_code).exists():
                raise serializers.ValidationError(
                    'No such synced module exists for the current user')
            return attrs

        # Add new module to sync
        # TODO: Refactor all the module getters using a helper!!
        ivle_token = user.ivle_token
        res = requests.get(
            IVLE_MODULES_URL.format(AUTH_TOKEN=ivle_token)
        )
        valid_modules = set(m['CourseCode'] for m in res.json()['Results'])
        if module_code not in valid_modules:
            raise serializers.ValidationError(
                'This module code is invalid for the current user')
        return attrs


class Modules(APIView):

    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        """
        Expects a request like
        {
            'type': 'add' / 'remove',
            'module_code': '...'
        }
        """
        serializer = ModuleSerializer(data=request.data, context={'request': request})

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        req_type = serializer.validated_data.get('type')
        user = get_user(request)

        if req_type == 'add':
            return Response(self.add_sync_module(user, serializer.validated_data))
        else:
            return Response(self.remove_sync_module(user, serializer.validated_data))

    def add_sync_module(self, user, validated_data):
        module = Module.objects.create_if_not_exist(validated_data['module_code'])
        user.synced_modules.add(module)
        user.save()
        return {
            'status': 'Successfully added {module_code} to be synced for user'
            .format(module_code=validated_data['module_code'])
        }


    def remove_sync_module(self, user, validated_data):
        module = Module.objects.filter(module_code=validated_data['module_code']).first()
        user.synced_modules.remove(module)
        user.save()
        return {
            'status': 'Successfully removed {module_code} from synced modules '
                      'for user'.format(module_code=validated_data['module_code'])
        }


class RefreshModules(APIView):

    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = get_user(request)

        user.taking_modules.clear()

        res = requests.get(
            IVLE_MODULES_URL.format(AUTH_TOKEN=user.ivle_token)
        )
        modules = [m['CourseCode'] for m in res.json()['Results']]

        for module in modules:
            module_obj = Module.objects.create_if_not_exist(module)
            user.taking_modules.add(module_obj)

        user.save()

        modules_to_return = [{
            'code': m.module_code,
            'sync': user.synced_modules.filter(module_code=m.module_code).exists()
        } for m in user.taking_modules.all()]

        return Response({
            'modules': modules_to_return
        })

