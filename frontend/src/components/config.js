var settings = require('../settings.json')

export function getBackendDomain() {
    return settings.backendDomain;
}

export function getFrontendDomain() {
    return settings.frontendDomain;
}

export function getIvleKey() {
    return settings.ivleKey;
}

export function getDropboxKey() {
    return settings.dropboxKey;
}

export function getGdriveKey() {
    return settings.gdriveKey;
}

export function getGdriveSecret() {
    return settings.gdriveSecret;
}

export function getBoxKey() {
    return settings.boxKey;
}

export function getBoxSecret() {
    return settings.boxSecret;
}

export function getOnedriveKey() {
    return settings.onedriveKey;
}

export function getOnedriveSecret() {
    return settings.onedriveSecret;
}

export function getEmailjsKey() {
    return settings.emailjsKey;
}