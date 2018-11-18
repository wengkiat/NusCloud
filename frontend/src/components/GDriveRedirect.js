import React, { Component } from 'react';
import { Redirect } from 'react-router';

export default class GDriveRedirect extends Component {
    state = {}

    render() {
        // expire in 1 hour :(
        let thisURL = window.location.href.split(/=|&/);
        let token = thisURL[1];

        return (
            <Redirect to={{pathname: '/user/1', gdrivetoken:token}}/>
        )
    }

}