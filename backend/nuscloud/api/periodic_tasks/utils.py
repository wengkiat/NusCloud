import onedrivesdk
import requests

from helpers.utils import (
    IVLE_MODULES_URL, IVLE_WORKBIN_URL, ONEDRIVE_CLIENT_ID, ONEDRIVE_SCOPES,
    ONEDRIVE_CLIENT_SECRET
)


def get_ivle_modules(user):
    modules_res = requests.get(
        IVLE_MODULES_URL.format(AUTH_TOKEN=user.ivle_token)
    )
    modules_json = modules_res.json()
    return [mod for mod in modules_json['Results']]


def get_ivle_file_structure(user, modules):
    ivle_file_stucture = {}
    for module in modules:
        module_id = module['ID']
        workbin_res = requests.get(
            IVLE_WORKBIN_URL.format(
                AUTH_TOKEN=user.ivle_token,
                COURSE_ID=module_id)
        )
        workbin_json = workbin_res.json()
        # No workbin for this module
        if not workbin_json['Results']:
            continue
        ivle_file_stucture[module_id] = workbin_json['Results']
    return ivle_file_stucture


def get_onedrive_client(loop):
    http_provider = onedrivesdk.HttpProvider()
    auth_provider = onedrivesdk.AuthProvider(
        http_provider=http_provider,
        auth_server_url='https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
        auth_token_url='https://login.microsoftonline.com/common/oauth2/v2.0/token',
        client_id=ONEDRIVE_CLIENT_ID,
        scopes=ONEDRIVE_SCOPES.split(),
        loop=loop
    )
    client = onedrivesdk.OneDriveClient(
        'https://graph.microsoft.com/v1.0/me/',
        auth_provider,
        http_provider
    )
    return client


def attach_onedrive_session(client, user):
    client.auth_provider._session = onedrivesdk.session.Session(
        'bearer',
        0,
        ONEDRIVE_SCOPES,
        user.onedrive_access_token,
        ONEDRIVE_CLIENT_ID,
        'https://login.microsoftonline.com/common/oauth2/v2.0/token',
        'http://localhost:8080/',
        user.onedrive_refresh_token,
        ONEDRIVE_CLIENT_SECRET
    )
