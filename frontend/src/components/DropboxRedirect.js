import React, { Component } from 'react';
import { Redirect } from 'react-router';

export default class DropboxRedirect extends Component {
    state = {}

    render() {
        // no expiry
        let thisURL = window.location.href.split(/=|&/);
        let token = thisURL[1];

        return (
            <Redirect to={{pathname: '/user', dropboxtoken:token }}/>
        )
    }

}