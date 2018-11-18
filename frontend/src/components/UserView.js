import React, { Component } from 'react';
import styles from '../styles/UserView.module.css';
import { Popup, Confirm, Header, Divider, Message, Grid, Container, Button, Icon, Dimmer, Loader } from 'semantic-ui-react';
import box from "../assets/UserView/box.png";
import onedrive from "../assets/UserView/onedrive.png";
import box_pic from "../assets/UserView/box_pic.jpg";
import googledrive_pic from "../assets/UserView/googledrive_pic.png";
import dropbox_pic from "../assets/UserView/dropbox_pic.jpg";
import onedrive_pic from "../assets/UserView/onedrive_pic.png";
import PageHeader from './Header';
import {getBackendDomain, getFrontendDomain, getDropboxKey, getGdriveKey, getBoxKey, getBoxSecret, getOnedriveKey, getOnedriveSecret, getGdriveSecret} from "./config.js";
import axios from "axios";
import qs from 'qs';
import Footer from './Footer';

class UserView extends Component {
    state = {
        loggedIn: !!localStorage.getItem("access_token"),
        name: "user",
        modules: null,
        storages: null,
        errorMessageLogin: false,
        errorMessage: false,
        errorMessageOneDrive: false,
        loadingScreen: false,
        syncSuccess: false,
        selectSuccess: false,
        deselectSuccess: false,
        moduleSelected: "nothing",
        cloudSelected: "nothing",
        isSyncing: false,
        lastSync: "Not synced yet",
        needConfirmDropbox: false,
        needConfirmGDrive: false,
        needConfirmBox: false,
        needConfirmOneDrive: false,
        refreshStatus: 0,
        boxWarning: false,
    }

    constructor(){
        super();
        this.handleSubmit = this.handleSubmit.bind(this);
        this.handleSubmitDropbox = this.handleSubmitDropbox.bind(this);
        this.handleSubmitGDrive = this.handleSubmitGDrive.bind(this);
        this.handleSubmitBox = this.handleSubmitBox.bind(this);
        this.handleSubmitOneDrive = this.handleSubmitOneDrive.bind(this);
        this.syncDropbox = this.syncDropbox.bind(this);
        this.syncBox = this.syncBox.bind(this);
        this.syncGDrive = this.syncGDrive.bind(this);
        this.syncOneDrive = this.syncOneDrive.bind(this);
        this.refreshModule = this.refreshModule.bind(this);
    }

    componentDidMount() {
        if (this.state.loggedIn) {
            axios.defaults.headers.common = {'Authorization': "JWT " + localStorage.getItem("access_token")};
            this.getProfile();
        } else {
            this.getLoginToken();
        }
        axios.defaults.xsrfCookieName = 'csrftoken'
        axios.defaults.xsrfHeaderName = 'X-CSRFToken'
        // console.log(this.props.location);
        
    }

    syncDropbox = (command, token, refreshtoken="anything") => {
        axios.defaults.headers.common = {'Authorization': "JWT " + localStorage.getItem("access_token")};
        return axios({
            url: getBackendDomain() + 'storages/',
            method: "post",
            data: {
                "type": command,
                "token": token,
                "storage": "dropbox",
                "refresh_token": refreshtoken
            }
        }).then(body => {
            // console.log("syncdropbox", token);
            if (body.statusText === 'OK') {
                let storages = {...this.state.storages};
                storages.dropbox = !storages.dropbox;
                this.setState({storages});
                if (command === "add") {
                    this.setState({syncSuccess: true, cloudSelected:"Dropbox", isSyncing: true});
                }
            } else {
                this.setState({errorMessage: true});
            }
            this.setState({loadingScreen: false});
        }).catch((e) => {
            this.setState({errorMessage: true});
            this.setState({loadingScreen: false});
            // console.log(e);
        })
    }

    syncBox = (command, token, refreshtoken="anyhow") => {
        axios.defaults.headers.common = {'Authorization': "JWT " + localStorage.getItem("access_token")};
        return axios({
            url: getBackendDomain() + 'storages/',
            method: "post",
            data: {
                "type": command,
                "token": token,
                "storage": "box",
                "refresh_token": refreshtoken
            }
        }).then(body => {
            // console.log("syncdropbox", token);
            if (body.statusText === 'OK') {
                let storages = {...this.state.storages};
                storages.box = !storages.box;
                this.setState({storages});
                if (command === "add") {
                    this.setState({syncSuccess: true, cloudSelected:"Box", isSyncing: true});
                }
            } else {
                this.setState({errorMessage: true});
            }
            this.setState({loadingScreen: false});
        }).catch((e) => {
            this.setState({errorMessage: true});
            this.setState({loadingScreen: false});
            // console.log(e);
        })
    }

    syncGDrive = (command, token="anything", refreshtoken="anyhow") => {
        axios.defaults.headers.common = {'Authorization': "JWT " + localStorage.getItem("access_token")};
        return axios({
            url: getBackendDomain() + 'storages/',
            method: "post",
            data: {
                "type": command,
                "storage": "gdrive",
                "token": token,
                "refresh_token": refreshtoken
            }
        }).then(body => {
            // console.log("syncdropbox", token);
            if (body.statusText === 'OK') {
                let storages = {...this.state.storages};
                storages.gdrive = !storages.gdrive;
                this.setState({storages});
                if (command === "add") {
                    this.setState({syncSuccess: true, cloudSelected:"Google Drive", isSyncing: true});
                }
            } else {
                this.setState({errorMessage: true});
            }
            this.setState({loadingScreen: false});
        }).catch((e) => {
            this.setState({errorMessage: true});
            this.setState({loadingScreen: false});
            // console.log(e);
        })
    }

    syncOneDrive = (command, token="anything", refreshtoken="anyhow") => {
        axios.defaults.headers.common = {'Authorization': "JWT " + localStorage.getItem("access_token")};
        return axios({
            url: getBackendDomain() + 'storages/',
            method: "post",
            data: {
                "type": command,
                "storage": "onedrive",
                "token": token,
                "refresh_token": refreshtoken
            }
        }).then(body => {
            if (body.statusText === 'OK') {
                let storages = {...this.state.storages};
                storages.onedrive = !storages.onedrive;
                this.setState({storages});
                if (command === "add") {
                    this.setState({syncSuccess: true, cloudSelected:"OneDrive", isSyncing: true});
                }
            } else {
                this.setState({errorMessageOneDrive: true});
            }
            this.setState({loadingScreen: false});
        }).catch((e) => {
            this.setState({errorMessageOneDrive: true});
            this.setState({loadingScreen: false});
            // console.log(e);
        })
    }

    handleSubmit = (url) => {
        window.open(url, '_self',       
            `toolbar=no, location=no, directories=no, status=no, menubar=no, 
            scrollbars=no, resizable=no, copyhistory=no`
        );
        return;
    }

    handleSubmitDropbox = () => {
        const clientID = getDropboxKey();
        const callbackurl = getFrontendDomain() + "dropbox";
        const url = `https://www.dropbox.com/oauth2/authorize?client_id=${clientID}&redirect_uri=${callbackurl}&response_type=token`;
        this.handleSubmit(url, callbackurl);
        return;
    }

    handleSubmitGDrive = () => {
        const clientID = getGdriveKey();
        const callbackurl = getFrontendDomain() + "gdrive";
        const scope = "https://www.googleapis.com/auth/drive.file";
        const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientID}&redirect_uri=${callbackurl}&response_type=code&scope=${scope}&access_type=offline&prompt=consent`;
        this.handleSubmit(url, callbackurl);
        return;
    }

    handleSubmitBox = () => {
        const clientID = getBoxKey();
        const callbackurl = getFrontendDomain() + "box";
        const url = `https://account.box.com/api/oauth2/authorize?response_type=code&client_id=${clientID}&redirect_uri=${callbackurl}`;
        this.handleSubmit(url, callbackurl);
        return;
    }

    handleSubmitOneDrive = () => {
        const clientID = getOnedriveKey();
        const callbackurl = getFrontendDomain() + "onedrive";
        const scope = "Files.ReadWrite.Appfolder offline_access";
        const url = `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?client_id=${clientID}&scope=${scope}&response_type=code&redirect_uri=${callbackurl}`;
        this.handleSubmit(url, callbackurl);
        return;
    }

    getSyncURL() {
        switch (this.state.cloudSelected) {
            case "Dropbox":
                return "https://www.dropbox.com/home/Apps";
            case "Google Drive":
                return "https://drive.google.com/drive/my-drive"
            case "Box":
                return "https://app.box.com/folder/0"
            case "OneDrive":
                return "https://onedrive.live.com"
            default:
                return "nil";
        }

    }

    getLoginToken() {
        this.setState({loadingScreen: true});
        return axios({
            url: getBackendDomain() + "api-token-auth/",
            method: "post",
            data: {
                "ivle_token": this.props.location.ivletoken
            },
        }).then(body => {
            this.setState({loadingScreen: false});
            // console.log(body);
            localStorage.setItem("access_token", body.data.token)
            this.setState({loggedIn: true});
            this.getProfile();
        }).catch(err => {
            this.setState({loadingScreen: false});
            this.props.history.push('/');
            return null;
        });
    }

    getProfile() {
        this.setState({loadingScreen: true});
        axios.defaults.headers.common = {'Authorization': "JWT " + localStorage.getItem("access_token")}
        return axios.get(getBackendDomain() + "profile/", 
        ).then(body => {
            // console.log(body);
            const module_set = new Set();
            for (let mod_idx in body.data.modules) {
                let mod = body.data.modules[mod_idx];
                let mod_sync = mod.sync ? "true" : "false";
                let mod_iden = mod.code + "===" + mod_sync;
                module_set.add(mod_iden);
            }
            let new_module_list = [];
            module_set.forEach(function(module_iden){ 
                let module_iden_array = module_iden.split("===");
                let new_module_object = {};
                new_module_object.code = module_iden_array[0];
                new_module_object.sync = module_iden_array[1] === "true";
                new_module_list.push(new_module_object);
            });
            this.setState({ 
                name: body.data.profile.name,
                modules: new_module_list,
                storages: body.data.storages,
                // isSyncing: false,
                isSyncing: body.data.status.sync_status,
                lastSync: body.data.status.last_updated.replace("T", "  ").split(".")[0]
            });

            if (!!this.props.location.dropboxtoken) {
                this.syncDropbox("add", this.props.location.dropboxtoken);
            } else if (!!this.props.location.gdrivetoken){
                let clientID = getGdriveKey();
                let clientSecret = getGdriveSecret();
                let code = this.props.location.gdrivetoken;
                let redirect_uri = getFrontendDomain() + "gdrive";
                axios({
                    url: "https://www.googleapis.com/oauth2/v4/token",
                    method: "post",
                    datatype: "json",
                    contentType: "application/x-www-form-urlencoded; charset=utf-8",
                    async : true,
                    data : {
                        code: code,
                        client_id: clientID,
                        client_secret: clientSecret,
                        redirect_uri: redirect_uri,
                        grant_type: "authorization_code"
                    },
                }).then((x)=>{
                    let gdriveResp = x.data;
                    let gdriveRefresh = gdriveResp.refresh_token;
                    this.syncGDrive("add", gdriveRefresh, gdriveRefresh);
                }).catch((x)=>{
                    this.setState({loadingScreen: false});
                    this.setState({errorMessage: true});
                });
            } else if (!!this.props.location.boxtoken) {
                let clientID = getBoxKey();
                let clientSecret = getBoxSecret();
                let code = this.props.location.boxtoken;
                axios({
                    url: "https://api.box.com/oauth2/token",
                    method: "post",
                    async: true,
                    crossDomain: true,
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "cache-control": "no-cache",
                    },
                    data : qs.stringify({
                        client_id: clientID,
                        grant_type: "authorization_code",
                        client_secret: clientSecret,
                        code: code
                    })
                }).then((x)=>{
                    let boxResp = x.data;
                    let boxAccess = boxResp.access_token;
                    let boxRefresh = boxResp.refresh_token;
                    this.syncBox("add", boxAccess, boxRefresh);
                }).catch((x)=>{
                    this.setState({loadingScreen: false});
                    this.setState({errorMessage: true});
                });
            } else if (!!this.props.location.onedrivetoken) {
                let code = this.props.location.onedrivetoken;
                let clientID = getOnedriveKey();
                let clientSecret = getOnedriveSecret();
                let redirect_uri = getFrontendDomain() + "onedrive";
                this.syncOneDrive("add", code, redirect_uri);
            } else {
                this.setState({loadingScreen: false});
            }
            setInterval(()=>{
                axios.get(
                    getBackendDomain() + "profile/",
                ).then(body => {
                    this.setState({ 
                        isSyncing: body.data.status.sync_status,
                        lastSync: body.data.status.last_updated.replace("T", "  ").split(".")[0]
                    });
                })
            }, 60000);
        }).catch((e) => {
            this.setState({loadingScreen: false});
            this.setState({errorMessageLogin: true});
        });
    }

    renderCloudButton(isExternal, text, iconSource) {
        let pic = undefined;
        let active = undefined;
        let clickFunction = () => true;
        let cloudName = "";
        let clickRemove = () => true;
        let openConfirm = () => true;
        let closeConfirm = ()=> true;
        let cloudConfirm = "";
        const handleClick = (cloud) => {
            if (this.state.storages && !this.state.storages[cloud]) {
                if (cloud === "box") {
                    this.setState({boxWarning: true});
                } else {
                    clickFunction();
                }
            } else {
                openConfirm();
                // clickRemove("remove", "anyhowputone");
            }
        }
        switch (text) {
            case "Dropbox":
                pic = dropbox_pic;
                clickFunction = this.handleSubmitDropbox;
                clickRemove = this.syncDropbox;
                active = this.state.storages && this.state.storages.dropbox;
                cloudName = "dropbox";
                openConfirm = ()=>this.setState({needConfirmDropbox: true})
                closeConfirm = ()=>this.setState({needConfirmDropbox: false})
                cloudConfirm = "Dropbox";
                break;
            case "Google Drive":
                pic = googledrive_pic;
                clickFunction = this.handleSubmitGDrive;
                clickRemove = this.syncGDrive;
                active = this.state.storages && this.state.storages.gdrive;
                cloudName = "gdrive";
                openConfirm = ()=>this.setState({needConfirmGDrive: true})
                closeConfirm = ()=>this.setState({needConfirmGDrive: false})
                cloudConfirm = "GDrive";
                break;
            case "Box":
                pic = box_pic;
                clickFunction = this.handleSubmitBox;
                clickRemove = this.syncBox;
                active = this.state.storages && this.state.storages.box;
                cloudName = "box";
                openConfirm = ()=>this.setState({needConfirmBox: true})
                closeConfirm = ()=>this.setState({needConfirmBox: false})
                cloudConfirm = "Box";
                break;
            case "OneDrive":
                pic = onedrive_pic;
                clickFunction = this.handleSubmitOneDrive;
                clickRemove = this.syncOneDrive;
                active = this.state.storages && this.state.storages.onedrive;
                cloudName = "onedrive";
                openConfirm = ()=>this.setState({needConfirmOneDrive: true})
                closeConfirm = ()=>this.setState({needConfirmOneDrive: false})
                cloudConfirm = "OneDrive";
                break;
            default:
                pic = undefined;
                clickFunction = ()=>true;
                clickRemove = () => true;
                openConfirm = ()=>true;
                closeConfirm = ()=>true
                cloudName = "";
        }   
        return (
            <Grid.Column mobile={8} tablet={4} computer={4}>
                <div className={styles.wrapper}>
                    <img src={pic} alt={iconSource} className={styles.pic}/>
                    <Button icon labelPosition="left" toggle active={active} disabled={cloudName === "nothing"} onClick={() => {handleClick(cloudName)}} className={styles.button}>
                        <Icon name={active ? "check" : "close"}/>
                        {text}
                    </Button>
                    <Confirm
                        open={this.state["needConfirm"+cloudConfirm]}
                        content={"Are you sure you want to unlink " + text + "?"}
                        onCancel={closeConfirm}
                        onConfirm={()=>{clickRemove("remove", "anyhowputone"); closeConfirm();}}
                    />
                    <Confirm
                        open={this.state.boxWarning}
                        header="Warning!"
                        content={"Due to the limited access types in Box, we are going to be able to see your files. However, we do not plan to use that access to view any of your other files."}
                        onCancel={()=>this.setState({boxWarning: false})}
                        onConfirm={()=>{this.handleSubmitBox(); this.setState({boxWarning: false});}}
                        className={styles.box_warning}
                        id="box_warning"
                    />
                </div>
            </Grid.Column>
        )
    }

    renderModuleButton(item) {
        const handleClick = (code) => {
            this.setState({loadingScreen: true});
            axios.defaults.headers.common = {'Authorization': "JWT " + localStorage.getItem("access_token")};
            var module = this.state.modules.find((element) => {
                return element.code === code;
            });
            axios.post(getBackendDomain() + "modules/", {
                "type": module.sync ? "remove" : "add",
                "module_code": code
            }).then(body => {
                this.setState({loadingScreen: false, moduleSelected: code});
                if (body.statusText === "OK") {
                    let module_list = this.state.modules;
                    for (let i in module_list) {
                        if (module_list[i].code === code) {
                            module_list[i].sync = !module_list[i].sync;
                        }
                    }
                    this.setState({modules: module_list, selectSuccess: module.sync, deselectSuccess: !module.sync});
                }
            }).catch((e) => {
                this.setState({loadingScreen: false});
                this.setState({errorMessage: true});
            });
        }
        return (
            <Popup
                trigger=
                    {<Button icon labelPosition="left" toggle active={item.sync} onClick={() => handleClick(item.code)} className={styles.button}>
                        <Icon name={item.sync ? "check" : "close"}/>
                        {item.code}
                    </Button>}
                content={item.code}
                position="top center"
                inverted
            />
        )
    }

    refreshModule = () => {
        this.setState({refreshStatus: 2});
        axios.get(
            getBackendDomain() + "modules/refresh/",
        ).then(body => {
            this.setState({refreshStatus: 1, modules: body.data.modules})
        }).catch(err => {
            this.setState({refreshStatus: 0});
        });
    }

    render() {
        return (
            <div>
                {this.state.loadingScreen && (
                    <Dimmer active page>
                        <Loader/>
                    </Dimmer>
                )}
                <PageHeader login={!!localStorage.getItem("access_token")} able={true}/>
                {this.state.errorMessage && (
                    <div className={styles.error}>
                        <Message error>
                            Error - Please try again later
                        </Message>
                    </div>
                )}
                {this.state.errorMessageOneDrive && (
                    <div className={styles.error}>
                        <Message error>
                            Error - Please try again later.<br/><br/>
                            Please make sure you link your personal OneDrive account instead of your NUS OneDrive account.
                        </Message>
                    </div>
                )}
                {this.state.loggedIn && !this.state.errorMessageLogin && (
                    <div className={styles.container}>
                        <Container text>
                            <Header as="h1">
                                Welcome, {this.state.name}
                            </Header>
                            <Divider hidden />
                            <div>
                                <Header size="medium">
                                    IVLE Workbins to Sync
                                </Header>
                                <Divider />
                                {this.state.selectSuccess && (
                                    <Message positive>
                                        <Message.Header>You have selected {this.state.moduleSelected}</Message.Header>
                                    </Message>
                                )}
                                {this.state.deselectSuccess && (
                                    <Message negative>
                                        <Message.Header>You have unselected {this.state.moduleSelected}</Message.Header>
                                    </Message>
                                )}
                                <Grid>
                                    <Grid.Row>
                                    {this.state.modules && this.state.modules.map((item) => (
                                        <Grid.Column mobile={8} tablet={4} computer={4} key={item.code}>
                                            {this.renderModuleButton(item)}
                                        </Grid.Column>
                                    ))}
                                    </Grid.Row>
                                </Grid>
                                <div className={styles.refresh_container}>
                                    {this.state.refreshStatus === 2 ? (
                                        <div>
                                            <Button color="green" loading className={styles.refresh}>
                                            </Button>
                                        </div>
                                    ) : (
                                        <div>
                                            <Button color="green" onClick={this.refreshModule} className={styles.refresh}>
                                                {this.state.refreshStatus === 1 ? "Module List Refreshed!" : "Refresh Module List"}
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <Divider hidden />
                            <div>
                                <Header size="medium">
                                    Cloud Services to Sync
                                </Header>
                                <Divider />
                                <Grid>
                                    <Grid.Row>
                                            {this.renderCloudButton(true, "Dropbox", "dropbox")}
                                            {this.renderCloudButton(false, "Box", box)}
                                            {this.renderCloudButton(true, "Google Drive", "google drive")}
                                            {this.renderCloudButton(false, "OneDrive", onedrive)}
                                    </Grid.Row>
                                </Grid>
                                <Divider hidden />
                                <div className={styles.note_container}>
                                    <div className={styles.note}>
                                        Note:&nbsp;&nbsp;&nbsp;
                                    </div>
                                    <div className={styles.note}>
                                        Only personal OneDrive accounts can be synced. <br />
                                        Corporation accounts, such as NUS OneDrive, cannot be synced. 
                                    </div>
                                </div>
                                {this.state.syncSuccess && (
                                    <Message positive>
                                        <Message.Header>Sync to {this.state.cloudSelected} started!</Message.Header>
                                        <p>
                                            Your sync to {this.state.cloudSelected} has started and the folder will appear <a href={this.getSyncURL()} target="_blank" rel="noopener noreferrer">here</a> after a short while.<br/>
                                            Feel free to close this page and come back anytime when you want to change cloud storage or configure modules to sync.<br/>
                                            Else, just sit back and watch it work!
                                        </p>
                                    </Message>
                                )}
                            </div>
                            <div className={styles.status_container}>
                                {(this.state.storages && !this.state.storages.dropbox && !this.state.storages.gdrive && !this.state.storages.box && !this.state.storages.onedrive) ? (
                                    <div>
                                        <div className={styles.led_box}>
                                            <div className={styles.led_red}></div>
                                        </div>
                                        Not Linked
                                    </div>
                                ) : (
                                    <div>
                                        {this.state.isSyncing ? (
                                            <div className={styles.status_wrapper}>
                                                <div className={styles.reload_double}></div>
                                                Syncing...
                                            </div>
                                        )  : (
                                            <div>
                                                <div className={styles.led_box}>
                                                    <div className={styles.led_green}></div>
                                                </div>
                                                Last Synced: {this.state.lastSync}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </Container>
                        <Divider hidden />
                    </div>
                )}                

                {this.state.errorMessageLogin && (
                    <div className={styles.container}>
                        <Message error>
                            Authentication Error
                        </Message>
                    </div>
                )}

                {!this.state.errorMessageLogin && !this.state.loggedIn && (
                    <div className={styles.container}>
                        <Message>
                            Loading
                        </Message>
                    </div>
                )}

                <Footer />
            </div>
        )
    }
}

export default UserView;
