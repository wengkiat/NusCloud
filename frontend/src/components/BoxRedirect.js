import React, { Component } from 'react';
import { Redirect } from 'react-router';

export default class BoxRedirect extends Component {
    state = {}

    render() {
        // one hour period, need refresh token
        let thisURL = window.location.href.split("code=");
        let token = thisURL[1];

        return (
            <Redirect to={{pathname: '/user/1', boxtoken:token }}/>
        )
    }

}