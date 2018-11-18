import boxsdk
import requests
import io

from helpers.utils import IVLE_DOWNLOAD_URL


def is_box_folder(entry):
    return type(entry) is boxsdk.object.folder.Folder


def is_box_file(entry):
    return type(entry) is boxsdk.object.file.File


def update_box(user, box, current_folder, expected_folders, expected_files):
    box_folders = {f.name: f for f in current_folder.get().get_items(limit=1000) if is_box_folder(f)}
    box_files = {f.name: f for f in current_folder.get().get_items(limit=1000) if is_box_file(f)}

    for expected_file in expected_files:
        expected_file_name = expected_file['FileName'].replace('/', '')
        expected_file_id = expected_file['ID']
        if expected_file_name in box_files:
            continue

        r = requests.get(
            IVLE_DOWNLOAD_URL.format(
                AUTH_TOKEN=user.ivle_token,
                FILE_ID=expected_file_id),
            allow_redirects=True
        )
        f = io.BytesIO(r.content)
        f.seek(0)
        current_folder.upload_stream(f, expected_file_name)

    for folder in expected_folders:
        if folder['AllowUpload']:
            continue

        expected_folder_name = folder['FolderName'].replace('/', '')
        if expected_folder_name not in box_folders:
            subfolder = current_folder.create_subfolder(expected_folder_name)
        else:
            subfolder = box_folders[expected_folder_name]
        update_box(user, box, subfolder, folder['Folders'], folder['Files'])


def sync_box(user, box, modules, ivle_file_structure):
    # Realistically speaking its unlikely that any IVLE workbin folder
    # contains > 1000 items.
    true_root_dir = box.folder(folder_id='0')
    true_root_folders = {f.name: f for f in true_root_dir.get().get_items(limit=1000)
                    if is_box_folder(f)}

    if 'NUSCloud' not in true_root_folders:
        root_dir = true_root_dir.create_subfolder('NUSCloud')
    else:
        root_dir = true_root_folders['NUSCloud']

    # root_folders = {f.name: f for f in root_dir.get().get_items(limit=1000)
    #                 if is_box_folder(f)}

    for module in modules:
        module_year, module_sem = module['CourseAcadYear'], module['CourseSemester']
        module_code, module_id = module['CourseCode'], module['ID']

        if not user.synced_modules.filter(module_code=module_code).exists():
            continue

        # Some module codes have / in them, but Dropbox hates this.
        # Consistency with Dropbox.
        module_code = module_code.replace('/', '_')

        root_folders = {f.name: f for f in root_dir.get().get_items(limit=1000)
                        if is_box_folder(f)}

        semester_root_folder = f'AY{module_year} {module_sem}'.replace('/', '')
        if semester_root_folder not in root_folders:
            semester_dir = root_dir.create_subfolder(semester_root_folder)
        else:
            semester_dir = root_folders[semester_root_folder]

        semester_folders = {f.name: f for f in semester_dir.get().get_items(limit=1000)
                    if is_box_folder(f)}

        # Create the root directory for the module if not already exist
        if module_code not in semester_folders:
            module_dir = semester_dir.create_subfolder(module_code)
        else:
            module_dir = semester_folders[module_code]

        if module_id not in ivle_file_structure:
            continue

        module_folders = {f.name: f for f in module_dir.get().get_items(limit=1000)
                    if is_box_folder(f)}
        for workbin in ivle_file_structure[module_id]:
            workbin_name = workbin['Title'].replace('/', '')
            if workbin_name not in module_folders:
                workbin_dir = module_dir.create_subfolder(workbin_name)
            else:
                workbin_dir = module_folders[workbin_name]
            update_box(user, box, workbin_dir, iter(workbin['Folders']), [])

