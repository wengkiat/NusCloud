import requests
import onedrivesdk

from helpers.utils import IVLE_DOWNLOAD_URL
import json


class CustomUploadRequest(onedrivesdk.request.item_content_request.ItemContentRequest):
    """
    This is a very hacky patch to get upload sessions to work while
    still using this outdated sdk.
    """

    def __init__(self, original, filename):
        self.__dict__ = original.__dict__.copy()
        self.filename = filename

    def upload(self, content):
        self.method = 'POST'
        # Create a session
        self._request_url = self.request_url + ("/children('%s')" % self.filename) + '/createUploadSession'
        entity_response = self.send()
        new_session_json = json.loads(entity_response.content)
        upload_url = new_session_json['uploadUrl']

        # Upload bytes to session
        self.method = 'PUT'
        self._request_url = upload_url
        total_len = len(content)
        batch_start = 0
        # Each upload request to the session is limited to max 60mb.
        batch_size = 52428800
        while batch_start < total_len:
            batch_content = content[batch_start:batch_start + batch_size]
            batch_end = batch_start + len(batch_content) - 1
            self._headers['Content-Range'] = (
                'bytes ' + str(batch_start) + '-' + str(batch_end) + '/' + str(
                    total_len)
            )
            entity_response = self.send(data=batch_content)
            batch_start = batch_end+1

        assert entity_response.status in (200, 201)


def is_onedrive_folder(entry):
    return bool(entry.folder)


def is_onedrive_file(entry):
    return bool(entry.file)


def update_onedrive(user, onedrive, current_folder, expected_folders, expected_files):
    onedrive_folders = {f.name: f for f in get_children(onedrive, current_folder.id) if is_onedrive_folder(f)}
    onedrive_files = {f.name: f for f in get_children(onedrive, current_folder.id) if is_onedrive_file(f)}

    for expected_file in expected_files:
        expected_file_name = expected_file['FileName'].replace('/', '')
        expected_file_id = expected_file['ID']
        if expected_file_name in onedrive_files:
            continue

        r = requests.get(
            IVLE_DOWNLOAD_URL.format(
                AUTH_TOKEN=user.ivle_token,
                FILE_ID=expected_file_id),
            allow_redirects=True
        )

        upload_request = CustomUploadRequest(
            onedrive.item(id=current_folder.id).children[expected_file_name].request(),
            expected_file_name
        )
        upload_request.upload(r.content)

    for folder in expected_folders:
        if folder['AllowUpload']:
            continue

        expected_folder_name = folder['FolderName'].replace('/', '')
        if expected_folder_name not in onedrive_folders:
            subfolder = create_folder(onedrive, current_folder, expected_folder_name)
        else:
            subfolder = onedrive_folders[expected_folder_name]
        update_onedrive(user, onedrive, subfolder, folder['Folders'], folder['Files'])


def create_folder(onedrive, parent_folder, folder_name):
    f = onedrivesdk.Folder()
    i = onedrivesdk.Item()
    i.name = folder_name
    i.folder = f
    return onedrive.item(id=parent_folder.id).children.add(i)


def get_children(onedrive, item_id):
    return onedrive.item(id=item_id).children.get()


def sync_onedrive(user, onedrive, modules, ivle_file_structure):
    root_item = onedrive.drive.special['approot'].get()
    for module in modules:
        module_year, module_sem = module['CourseAcadYear'], module['CourseSemester']
        module_code, module_id = module['CourseCode'], module['ID']

        if not user.synced_modules.filter(module_code=module_code).exists():
            continue

        # Some module codes have / in them, but Dropbox hates this.
        # Consistency with Dropbox.
        module_code = module_code.replace('/', '_')

        root_folders = {f.name: f for f in get_children(onedrive, root_item.id)
                        if is_onedrive_folder(f)}
        semester_root_folder = f'AY{module_year} {module_sem}'.replace('/', '')
        if semester_root_folder not in root_folders:
            semester_item = create_folder(onedrive, root_item, semester_root_folder)
        else:
            semester_item = root_folders[semester_root_folder]

        semester_folders = {f.name: f for f in get_children(onedrive, semester_item.id)
                            if is_onedrive_folder(f)}

        # Create the root directory for the module if not already exist
        if module_code not in semester_folders:
            module_item = create_folder(onedrive, semester_item, module_code)
        else:
            module_item = semester_folders[module_code]

        if module_id not in ivle_file_structure:
            continue

        module_folders = {f.name: f for f in get_children(onedrive, semester_item.id)
                          if is_onedrive_folder(f)}
        for workbin in ivle_file_structure[module_id]:
            workbin_name = workbin['Title'].replace('/', '')
            if workbin_name not in module_folders:
                workbin_item = create_folder(onedrive, module_item, workbin_name)
            else:
                workbin_item = module_folders[workbin_name]
            update_onedrive(user, onedrive, workbin_item, iter(workbin['Folders']), [])
