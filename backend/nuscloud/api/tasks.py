import asyncio
import dropbox
from dropbox.files import CommitInfo, UploadSessionCursor, UploadSessionFinishArg
import requests
from multiprocessing.pool import ThreadPool
from celery import shared_task
from boxsdk import Client, OAuth2
from boxsdk.network.default_network import DefaultNetwork
from helpers.utils import (
    IVLE_DOWNLOAD_URL, get_logger, BOX_CLIENT_ID, BOX_CLIENT_SECRET,
    GDRIVE_CLIENT_SECRET, GDRIVE_CLIENT_ID, ONEDRIVE_CLIENT_ID,
    ONEDRIVE_CLIENT_SECRET, ONEDRIVE_SCOPES
)
from api.models import User
from api.periodic_tasks.refresh_ivle_token import refresh_ivle_token
from api.periodic_tasks.utils import (
    get_ivle_file_structure, get_ivle_modules, get_onedrive_client,
    attach_onedrive_session
)
from api.periodic_tasks.box import sync_box
from api.periodic_tasks.gdrive import sync_gdrive
from api.periodic_tasks.onedrive import sync_onedrive
from pydrive.auth import GoogleAuth
from pydrive.drive import GoogleDrive
from django.db import transaction
import datetime

import json
import onedrivesdk
from django.utils import timezone
import tempfile

logger = get_logger()


def is_dropbox_folder(entry):
    return type(entry) is dropbox.files.FolderMetadata


def is_dropbox_file(entry):
    return type(entry) is dropbox.files.FileMetadata


def update_dropbox(user, dbx, dropbox_path, expected_folders, expected_files, files_to_batch_upload):
    dropbox_dir = dbx.files_list_folder(dropbox_path).entries
    dropbox_folders = set(f.name for f in dropbox_dir if is_dropbox_folder(f))
    dropbox_files = set(f.name for f in dropbox_dir if is_dropbox_file(f))

    for expected_file in expected_files:
        # TODO: Better way of handling / in name.
        expected_file_name = expected_file['FileName'].replace('/', '')
        expected_file_id = expected_file['ID']
        if expected_file_name in dropbox_files:
            continue

        r = requests.get(
            IVLE_DOWNLOAD_URL.format(
                AUTH_TOKEN=user.ivle_token,
                FILE_ID=expected_file_id),
            allow_redirects=True
        )
        file_path = dropbox_path + '/' + expected_file_name
        dbx.files_upload(r.content, file_path, autorename=True)
        # upload_session_start_result = dbx.files_upload_session_start(
        #     r.content, close=True)
        # cursor = UploadSessionCursor(
        #     session_id=upload_session_start_result.session_id,
        #     offset=len(r.content))
        # commit_info = CommitInfo(path=file_path)
        # files_to_batch_upload.append(UploadSessionFinishArg(
        #     cursor=cursor,
        #     commit=commit_info
        # ))

    for folder in expected_folders:
        if folder['AllowUpload']:
            continue

        # TODO: Better way of handling / in name.
        expected_folder_name = folder['FolderName'].replace('/', '')
        folder_path = dropbox_path + '/' + expected_folder_name
        if expected_folder_name not in dropbox_folders:
            dbx.files_create_folder_v2(folder_path)
        update_dropbox(user, dbx, folder_path, folder['Folders'], folder['Files'], files_to_batch_upload)


def sync_dropbox_module(user, dbx, module, ivle_file_structure):
    root_dir = dbx.files_list_folder('')
    root_folders = {f.name for f in root_dir.entries if
                    is_dropbox_folder(f)}

    module_year, module_sem = module['CourseAcadYear'], module['CourseSemester']
    module_code, module_id = module['CourseCode'], module['ID']

    # Some module codes have / in them, but Dropbox hates this.
    module_code = module_code.replace('/', '_')

    # TODO: Tidy this up.
    semester_root_folder = f'AY{module_year} {module_sem}'.replace('/', '')
    semester_root = f'/{semester_root_folder}'
    if semester_root_folder not in root_folders:
        try:
            dbx.files_create_folder_v2(semester_root)
        except:
            # TODO: hacky but i'm lazy for now.
            # Race condition here so just ignore if fail
            pass
    semester_dir = dbx.files_list_folder(semester_root)
    semester_folders = {f.name for f in semester_dir.entries if
                        is_dropbox_folder(f)}

    # Create the root directory for the module if not already exist
    module_root = f'{semester_root}/{module_code}'
    if module_code not in semester_folders:
        dbx.files_create_folder_v2(module_root)
    # This module probably does not have a workbin
    # TODO: Refactor this to read from ivle_file_structure directly
    if module_id not in ivle_file_structure:
        return

    module_dir = dbx.files_list_folder(module_root)
    module_folders = {f.name for f in module_dir.entries if
                      is_dropbox_folder(f)}
    files_to_batch_upload = []
    for workbin in ivle_file_structure[module_id]:
        # check if workbin exists
        # TODO: Now we assume multiple workbins do not have same name.
        # TODO: Better way of handling / in name.
        workbin_name = workbin['Title'].replace('/', '')
        workbin_root = f'{module_root}/{workbin_name}'
        if workbin_name not in module_folders:
            dbx.files_create_folder_v2(workbin_root)
        update_dropbox(
            user,
            dbx,
            workbin_root,
            iter(workbin['Folders']),
            [],
            files_to_batch_upload
        )
    # dbx.files_upload_session_finish_batch(files_to_batch_upload)


def sync_dropbox(user, dbx, modules, ivle_file_structure):
    # Don't set this too high because I think IVLE does rate limits,
    # so some threads may fail to get any downloads
    with ThreadPool(processes=3) as pool:
        pool.starmap(
            sync_dropbox_module,
            ((user, dbx, mod, ivle_file_structure)
             for mod in modules if user.synced_modules.filter(module_code=mod['CourseCode']).exists())
        )


def check_update_for_user(user):
    logger.info('Updating user')

    # Get modules info from IVLE
    logger.info('Getting IVLE modules')
    modules = get_ivle_modules(user)

    # Get all module workbins
    logger.info('Getting IVLE file structure')
    ivle_file_structure = get_ivle_file_structure(user, modules)

    if user.dropbox_token:
        # Get Dropbox info
        logger.info('Updating dropbox')
        dbx = dropbox.Dropbox(user.dropbox_token)

        # Update Dropbox using IVLE file structure
        sync_dropbox(user, dbx, modules, ivle_file_structure)

    if user.box_access_token and user.box_refresh_token:
        # TODO: I'm sure this will work 99% of the time. But need to confirm.
        oauth = OAuth2(
            client_id=BOX_CLIENT_ID,
            client_secret=BOX_CLIENT_SECRET,
            access_token=user.box_access_token,
            refresh_token=user.box_refresh_token
        )

        # Immediately regenerate a new token for the next use
        new_access_token, new_refresh_token = oauth.refresh(
            access_token_to_refresh=user.box_access_token)
        user.box_access_token = new_access_token
        user.box_refresh_token = new_refresh_token
        user.save()

        # This consumes our old tokens
        box = Client(oauth, DefaultNetwork())
        sync_box(user, box, modules, ivle_file_structure)

    if user.gdrive_token:

        logger.info('Updating google drive for ' + user.ivle_user_id)
        # configure sdk
        gauth = GoogleAuth('api/client_secrets.yaml')

        # To replace refresh token with actual value, NEED TRY CATCH HERE
        tf = tempfile.NamedTemporaryFile('r+')
        with open("api/credentials.json", "r+") as jsonFile:
            data = json.load(jsonFile)
            data["refresh_token"] = user.gdrive_token
            data["client_secret"] = GDRIVE_CLIENT_SECRET
            data["client_id"] = GDRIVE_CLIENT_ID
            json.dump(data, tf)

        tf.seek(0)

        # Try to load saved client credentials
        gauth.LoadCredentialsFile(tf.name)
        if gauth.credentials is None:
            # Authenticate if they're not there
            logger.error('Authentication failed for user for google drive')
            # gauth.LocalWebserverAuth()

        else:
            # Refresh them
            logger.info('Refreshing Gdrive token')
            gauth.Refresh()

        drive = GoogleDrive(gauth)
        sync_gdrive(user, drive, modules, ivle_file_structure)
        logger.info('Sync done for Gdrive')

    if user.onedrive_access_token:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

        client = get_onedrive_client(loop)
        attach_onedrive_session(client, user)
        client.auth_provider.refresh_token()

        # Save the new tokens after refreshing
        user.onedrive_access_token = client.auth_provider._session.access_token
        user.onedrive_refresh_token = client.auth_provider._session.refresh_token
        user.save()

        sync_onedrive(user, client, modules, ivle_file_structure)
        loop.close()


@shared_task
def check_for_updates():
    users = User.objects.all()
    for user in users:
        check_for_update_fast.delay(user.ivle_user_id)


@shared_task
def refresh_ivle_token_fast(ivle_user_id):
    refresh_ivle_token(ivle_user_id)


@shared_task
def refresh_ivle_tokens():
    users = User.objects.all()
    for user in users:
        refresh_ivle_token_fast.delay(user.ivle_user_id)


@shared_task
def check_for_update_fast(ivle_user_id):
    """
    This is separate from `check_update_for_user` because this is a
    direct task for celery. (wrapper)
    """
    try:
        should_sync = False

        # This thing is like a lock. Only need to lock user.sync_status though.
        with transaction.atomic():
            # We have multiple workers trying to sync for the same person
            # possibly
            user = User.objects.select_for_update().get(ivle_user_id=ivle_user_id)
            if not user.sync_status:
                user.sync_status = True
                should_sync = True
            user.save()

        if not should_sync:
            logger.info('Some other worker already syncing, returning')
            return

        with transaction.atomic():
            user = User.objects.select_for_update().get(ivle_user_id=ivle_user_id)
            user.last_synced = datetime.datetime.now()
            user.save()

        check_update_for_user(user)

    except Exception as e:
        logger.error('check_for_update_fast failed user %s' % ivle_user_id)
        logger.error(e)

    finally:

        # Unlock this row if this worker did sync
        if should_sync:
            with transaction.atomic():
                user = User.objects.select_for_update().get(ivle_user_id=ivle_user_id)
                user.sync_status = False
                user.save()


@shared_task
def refresh_box_tokens():
    users = User.objects.all()
    for user in users:
        if not user.box_access_token:
            continue
        try:
            oauth = OAuth2(
                client_id=BOX_CLIENT_ID,
                client_secret=BOX_CLIENT_SECRET,
                access_token=user.box_access_token,
                refresh_token=user.box_refresh_token
            )

            # Regenerate a new token for the next use
            new_access_token, new_refresh_token = oauth.refresh(
                access_token_to_refresh=user.box_access_token)
            user.box_access_token = new_access_token
            user.box_refresh_token = new_refresh_token
            user.save()
        except Exception as e:
            logger.error(e)


@shared_task
def refresh_onedrive_tokens():
    users = User.objects.all()
    for user in users:
        if not user.onedrive_access_token:
            continue
        try:
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            client = get_onedrive_client(loop)
            attach_onedrive_session(client, user)
            client.auth_provider.refresh_token()

            # Save the new tokens after refreshing
            user.onedrive_access_token = client.auth_provider._session.access_token
            user.onedrive_refresh_token = client.auth_provider._session.refresh_token
            user.save()

            loop.close()
        except Exception as e:
            logger.error(e)
