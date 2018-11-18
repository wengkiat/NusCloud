import configparser
import os
import sys
import logging

# Initialize constants from tokens.ini
config = configparser.ConfigParser()
config.read(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'tokens.ini'))

API_SECRET_KEY = config['NUSCloud']['Secret']

BOX_CLIENT_ID = config['Box']['Client_ID']
BOX_CLIENT_SECRET = config['Box']['Client_Secret']

GDRIVE_CLIENT_ID = config['GDrive']['Client_ID']
GDRIVE_CLIENT_SECRET = config['GDrive']['Client_Secret']

ONEDRIVE_CLIENT_ID = config['OneDrive']['Client_ID']
ONEDRIVE_CLIENT_SECRET = config['OneDrive']['Client_Secret']
ONEDRIVE_SCOPES = config['OneDrive']['Scopes']

DEBUG_SETTING = config['NUSCloud']['Debug'] == 'true'

allowed_hosts = config['Settings']['Allowed_hosts'].split()

db_user = config['Settings']['USER']
db_name = config['Settings']['NAME']
db_password = config['Settings']['PASSWORD']
db_host = config['Settings']['HOST']
db_port = config['Settings']['PORT']

IVLE_TOKEN_INFO_URL = (
    'https://ivle.nus.edu.sg/api/Lapi.svc/Validate?'
    'APIKey={API_KEY}&Token={{AUTH_TOKEN}}'
    .format(API_KEY=config['IVLE']['LAPI_Key'])
)
IVLE_PROFILE_URL = (
    'https://ivle.nus.edu.sg/api/Lapi.svc/Profile_View?'
    'APIKey={API_KEY}&AuthToken={{AUTH_TOKEN}}'
    .format(API_KEY=config['IVLE']['LAPI_Key'])
)
IVLE_MODULES_URL = (
    'https://ivle.nus.edu.sg/api/Lapi.svc/Modules?'
    'APIKey={API_KEY}'
    '&AuthToken={{AUTH_TOKEN}}'
    '&IncludeAllInfo=false'
    .format(API_KEY=config['IVLE']['LAPI_Key'])
)
IVLE_WORKBIN_URL = (
    'https://ivle.nus.edu.sg/api/Lapi.svc/Workbins?'
    'APIKey={API_KEY}'
    '&AuthToken={{AUTH_TOKEN}}'
    '&CourseID={{COURSE_ID}}'
    '&TitleOnly=false'
    .format(API_KEY=config['IVLE']['LAPI_Key'])
)
IVLE_DOWNLOAD_URL = (
    'https://ivle.nus.edu.sg/api/downloadfile.ashx?'
    'APIKey={API_KEY}'
    '&AuthToken={{AUTH_TOKEN}}'
    '&ID={{FILE_ID}}'
    '&target=workbin'
    .format(API_KEY=config['IVLE']['LAPI_Key'])
)


def get_logger():
    logger = logging.getLogger(__name__)
    logger.setLevel(logging.INFO)
    logger.addHandler(logging.StreamHandler(sys.stdout))
    return logger
