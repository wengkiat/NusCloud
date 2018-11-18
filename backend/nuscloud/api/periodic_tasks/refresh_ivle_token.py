from helpers.utils import IVLE_TOKEN_INFO_URL, get_logger
from dateutil import parser as dateparser
from ..models import User


import requests


logger = get_logger()


def refresh_ivle_token(ivle_user_id):
    # Naively refresh ALL tokens by taking the returned token always
    # and replacing it in DB
    user = User.objects.get(ivle_user_id=ivle_user_id)
    res = requests.get(IVLE_TOKEN_INFO_URL.format(AUTH_TOKEN=user.ivle_token))
    res_json = res.json()

    user.ivle_token = res_json['Token']
    user.ivle_expiry = dateparser.parse(res_json['ValidTill_js'])
    user.save()
