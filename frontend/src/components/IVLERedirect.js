import React, { Component } from 'react';
import { Redirect } from 'react-router';

export default class IVLERedirect extends Component {
    state = {}

    render() {
        let thisURL = window.location.href.split("=");
        let token = thisURL[1];

        return (
            <Redirect to={{pathname: '/user/1', ivletoken:token }}/>
        )
    }

}