import React, { Component } from 'react';
import { Menu, Button, Icon, Responsive, Sidebar, Segment } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import styles from '../styles/Header.module.css';
import {getFrontendDomain, getIvleKey} from "./config.js";
import logo from "../assets/Header/favicon-50.png";

export default class PageHeader extends Component {
    state = {haveLogin: false}

    constructor(props) {
        super(props);
        this.state = {
            haveLogin: !!localStorage.getItem("access_token"),
            showMenu: false
        }
        this.handleSubmitSignIn = this.handleSubmitSignIn.bind(this);
        this.handleSubmitSignOut = this.handleSubmitSignOut.bind(this);
    }

    componentWillReceiveProps(props) {
        if (props.login !== this.state.haveLogin) {
            this.setState({haveLogin: props.login});
        }
    }

    handleItemClick = (e, { name }) => this.setState({ activeItem: name });

    handleSubmitSignIn = () => {
        const callbackurl = getFrontendDomain() + "ivle";
        const ivleKey = getIvleKey();
        const url = `https://ivle.nus.edu.sg/api/login/?apikey=${ivleKey}&url=${callbackurl}`;
        window.open(url, '_self',       
            `toolbar=no, location=no, directories=no, status=no, menubar=no, 
            scrollbars=no, resizable=no, copyhistory=no`
        );
        return;
    }

    handleSubmitSignOut = () => {
        localStorage.removeItem('access_token');
        this.setState({haveLogin: false});
    }

    renderMenuItem(activeItem, name, link_target, icon_name, css_name, text) {
        return (
            <Menu.Item
                name={name}
                className={css_name}
                active={activeItem === name}
                onClick={this.handleItemClick}
                color='blue'
                as={Link} to={{ pathname: link_target, state: {able: this.props.able} }}
            >
                <Icon name={icon_name} />
                {text}
            </Menu.Item>
        )
    }

    render() {
        const { activeItem } = this.state;

        return (
            <div>
                <Responsive as={Menu} minWidth={831} stackable inverted className={styles.header}>
                    <Menu.Item header onClick={()=>Array.from(document.getElementsByClassName(styles.home))[0].click()} className={styles.logo}><img src={logo}/></Menu.Item>
                    {this.renderMenuItem(activeItem, "home", "/", "home", styles.home, "Home")}
                    {this.renderMenuItem(activeItem, "about", "/about", "cloud download", styles.about, "Why NUSCloud?")}
                    {this.renderMenuItem(activeItem, "contact", "/contact", "mail", styles.contact, "Contact")}
                    {this.renderMenuItem(activeItem, "faq", "/faq", "question circle", styles.faq, "FAQ")}

                    <Menu.Menu position='right'>
                        {this.state.haveLogin && (
                            <Menu.Item>
                                <Button color="red" as={Link} to={"/"} id="signout" onClick={this.handleSubmitSignOut}>Sign Out</Button>
                            </Menu.Item>
                        )}
                        {this.state.haveLogin ? (
                            <Menu.Item>
                                <Button primary as={Link} to={"/user"} id="account">My Account</Button>
                            </Menu.Item>
                        ) : (
                            <Menu.Item>
                                <Button primary onClick={this.handleSubmitSignIn} id="signin">Sign In</Button>
                            </Menu.Item>
                        )}
                    </Menu.Menu>
                </Responsive>
                <Responsive maxWidth={830}>
                    <Menu inverted className={styles.header}>
                        <Menu.Item header onClick={()=>this.setState({showMenu: true})}><Icon name="bars" size="large"/></Menu.Item>
                    </Menu>
                    <Sidebar.Pushable as={Segment} className={styles.sidebar}>
                        <Sidebar
                            as={Menu}
                            animation="overlay"
                            icon="labeled"
                            inverted
                            onHide={()=>this.setState({showMenu: false})}
                            vertical
                            visible={this.state.showMenu}
                            width="thin"
                        >
                            {this.renderMenuItem(activeItem, "home", "/", "home", styles.home, "Home")}
                            {this.renderMenuItem(activeItem, "about", "/about", "cloud download", styles.about, "Why NUSCloud?")}
                            {this.renderMenuItem(activeItem, "contact", "/contact", "mail", styles.contact, "Contact")}
                    {this.renderMenuItem(activeItem, "faq", "/faq", "question circle", styles.faq, "FAQ")}
                            {this.state.haveLogin && (
                                <Menu.Item>
                                    <Button color="red" as={Link} to={"/"} id="signout" onClick={this.handleSubmitSignOut}>Sign Out</Button>
                                </Menu.Item>
                            )}
                            {this.state.haveLogin ? (
                                <Menu.Item>
                                    <Button primary as={Link} to={"/user"} id="account">My Account</Button>
                                </Menu.Item>
                            ) : (
                                <Menu.Item>
                                    <Button primary onClick={this.handleSubmitSignIn} id="signin">Sign In</Button>
                                </Menu.Item>
                            )}
                        </Sidebar>
                    </Sidebar.Pushable>
                    {this.state.showMenu && (
                        <div className={styles.sidebar_dimmer}>
                        </div>
                    )}
                </Responsive>
            </div>
        )
  }
}