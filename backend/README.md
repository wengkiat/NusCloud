# NUSCloud Backend

## Requirements
* python3
* redis
* mysql

## Setup
Clone the repo and run these steps:
```
virtualenv venv -p python3
source venv/bin/activate
source ppath.sh
pip install -r requirements.txt
```

## Setup development MySQL
```
mysql -u root
CREATE DATABASE nuscloud;
CREATE USER nuscloud;
GRANT ALL PRIVILEGES ON nuscloud.* TO nuscloud;
```

## Add config files
You need to add `tokens.ini` under `nuscloud/helpers/`.
Do check the wiki for a template to get started.

## Run development server
```
sh rundevserver.sh
```

## Run celery
`cd` inside `nuscloud` first then:
```
celery -A nuscloud worker -l DEBUG -E
celery -A nuscloud beat -l info
```

## For Gdrive
`cd` inside `nuscloud\api` first then:
```
Create a file named client_secrets.yaml following the template in the wiki, configure the client secret and client id only
Create a file named credentials.json and JUST COPY AND PASTE the template in the wiki
```


## API Reference
### Headers
After you login, you need to get the CSRF token (`x-csrftoken`) and the JWT
token (`JWT token`) and send them on every request.

### Get JWT token
`POST: api-token-auth/`

Request example:
```json
{
  "ivle_token": "Your IVLE token here"
}
```

Response example:
```json
{
    "token": "Your JWT token here"
}
```


### Profile
`GET: profile/`

Response example:
```json
{
    "profile": {
        "ivle_id": "e0001234",
        "name": "JOHN SMITH",
    },
    "modules": [
        {
            "name": "PROGRAMMING IN EXCEL",
            "code": "CS1234",
            "sync": true
        },
        {
            "name": "SOFTWARE PRODUCT ENGINEERING FOR DIGITAL MARKETS",
            "code": "CS3216",
            "sync": true
        }
    ],
    "storages": {
        "dropbox": false,
        "gdrive": false
    },
    "status": {
        "sync_status": true,
        "last_updated": "2018-10-21 03:39:59.114118"
    }
}
```

### Add / Remove cloud storage
`POST: storages/`

Fields
- `type` must be either `add` or `remove`
- `storage` must be `dropbox` or `gdrive` or `box` or `onedrive`
- `token` is only required when `add`ing
- `refresh_token` is required only when `add`ing for: `box`, `onedrive`

Request example:
```json
{
  "type": "add",
  "token": "Your cloud storage token",
  "refresh_token": "Your cloud storage refresh token",
  "storage": "dropbox"
}
```

Response example:
```json
{
    "status": "Successfully added dropbox token"
}
```


### Add / Remove sync modules
`POST: modules/`

Fields:
- `type` must be either `add` or `remove`

Request example:
```json
{
  "type": "add",
  "module_code": "CS3216"
}
```

Response example:
```json
{
    "status": "Successfully added CS3216 to be synced for user"
}
```
