import tempfile
import requests
from pydrive.drive import GoogleDrive
from helpers.utils import IVLE_DOWNLOAD_URL, get_logger

logger = get_logger()


def create_folder(drive, name, parent_id=None):
    folder = drive.CreateFile({
        'title': name,
        'mimeType': 'application/vnd.google-apps.folder',
    })
    if parent_id:
        folder['parents'] = [{'kind': 'drive#fileLink', "id": parent_id}]
    folder.Upload()
    return folder


def create_file(drive, name, content, parent_id=None):
    file = drive.CreateFile({"title": name})
    tf = tempfile.NamedTemporaryFile('rb+')
    tf.write(content)
    tf.seek(0)
    file.SetContentFile(tf.name)
    if parent_id:
        file['parents'] = [{'kind': 'drive#fileLink', "id": parent_id}]
    file.Upload()
    return file


def check_file_existence(file_name, file_list):
    drive_file_name = file_name
    google_drive_file = None

    for drive_file in file_list:
        if drive_file["title"] == drive_file_name:
            google_drive_file = drive_file

    return google_drive_file


def make_root_folder(drive, folder, folder_name, parent_id=None):

    if not folder:
        new_root_folder = create_folder(drive, folder_name, parent_id)
        root_folder_id = new_root_folder["id"]
    else:
        root_folder_id = folder["id"]

    return root_folder_id


def sync_gdrive(user, drive, modules, ivle_file_structure):
    logger.info('Start Sync for google cloud')
    # Check for "NUS Cloud" root folder and create it if it does not exist
    root_folders = drive.ListFile({'q': "'root' in parents and trashed=false"}).GetList()
    root_folder_name = "NUSCloud"
    root_folder_id = make_root_folder(drive, check_file_existence(root_folder_name, root_folders), root_folder_name)

    # make folder for semester
    module_year, module_sem = modules[0]['CourseAcadYear'], modules[0]['CourseSemester']
    nuscloud_folders = drive.ListFile({'q': "'" + root_folder_id + "'" + " in parents and trashed=false"}).GetList()
    semester_root_folder_name = f'AY{module_year} {module_sem}'.replace('/', '')
    semester_root_folder_id = make_root_folder(drive, check_file_existence(semester_root_folder_name, nuscloud_folders),
                                               semester_root_folder_name, root_folder_id)

    # Create the root directory for modules if not already exist
    for module in modules:
        module_code, module_id = module['CourseCode'], module['ID']
        if not user.synced_modules.filter(module_code=module_code).exists():
            continue

        # Some module codes have / in them, but Dropbox hates this.
        # Consistency with Dropbox.
        module_code = module_code.replace('/', '_')

        logger.info('Start Sync for google cloud for module' + module['CourseCode'])
        semester_folders = drive.ListFile(
            {'q': "'" + semester_root_folder_id + "'" + " in parents and trashed=false"}).GetList()
        module_root_folder_id = make_root_folder(drive, check_file_existence(module_code, semester_folders),
                                                 module_code, semester_root_folder_id)
        # get all workbin files and create them if they do not exist

        files_to_batch_upload = []
        module_folders = drive.ListFile(
            {'q': "'" + module_root_folder_id + "'" + " in parents and trashed=false"}).GetList()

        if module_id not in ivle_file_structure:
            continue
        for workbin in ivle_file_structure[module_id]:
            workbin_name = workbin['Title'].replace('/', '')
            # create workbin folders
            workbin_folder_id = make_root_folder(drive, check_file_existence(workbin_name, module_folders),
                                                 workbin_name, module_root_folder_id)
            update_gdrive(user, drive, workbin_folder_id, iter(workbin['Folders']), [])


def update_gdrive(user, drive, current_folder_id, expected_folders, expected_files):
    logger.info('Updating google drive')
    gdrive_files = drive.ListFile({'q': "'" + current_folder_id + "'" + " in parents and trashed=false"}).GetList()

    for expected_file in expected_files:
        expected_file_name = expected_file['FileName'].replace('/', '')
        expected_file_id = expected_file['ID']
        # file exist in google drive
        if check_file_existence(expected_file_name, gdrive_files):
            continue

        r = requests.get(
            IVLE_DOWNLOAD_URL.format(
                AUTH_TOKEN=user.ivle_token,
                FILE_ID=expected_file_id),
            allow_redirects=True
        )
        create_file(drive, expected_file_name, r.content, current_folder_id)

    for folder in expected_folders:
        if folder['AllowUpload']:
            continue

        logger.info('Start Sync for google cloud for folder ' + folder['FolderName'])
        expected_folder_name = folder['FolderName'].replace('/', '')
        subfolder_id = make_root_folder(drive, check_file_existence(expected_folder_name, gdrive_files),expected_folder_name, current_folder_id)
        update_gdrive(user, drive, subfolder_id, folder['Folders'], folder['Files'])
