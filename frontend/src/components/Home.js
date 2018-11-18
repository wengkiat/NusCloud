import React, { Component } from 'react';
import { Button, Header, Divider } from 'semantic-ui-react';
import styles from '../styles/Home.module.css';
import header_styles from '../styles/Header.module.css'
import logo from './favicon-512.png'
import PageHeader from './Header.js'
import {getFrontendDomain} from './config.js';
import StepsBlock from './StepsBlock';
import StepOneBlock from './StepOneBlock';
import StepTwoBlock from './StepTwoBlock';
import StepThreeBlock from './StepThreeBlock';
import Fade from 'react-reveal/Fade';
import Footer from './Footer';

class Home extends Component {
    state ={
        loggedIn: !!localStorage.getItem("access_token")
    }

    constructor() {
        super();
        this.handleSubmit = this.handleSubmit.bind(this);
    }

    componentDidMount() {
        window.scrollTo(0, 0);
        let elem = Array.from(document.getElementsByClassName(header_styles.home))[0];
        elem.click();
        if (this.state.loggedIn && (!this.props.location.state || !this.props.location.state.able)) {
            this.props.history.push('/user');
        }
    }

    handleSubmit = () => {
        if (localStorage.getItem('access_token')) {
            this.props.history.push('/user');
        } else {
            const callbackurl = getFrontendDomain() + "ivle";
            const url = `https://ivle.nus.edu.sg/api/login/?apikey=aPsV0Dp2sBkKOiRl8kLCG&url=${callbackurl}`;
            window.open(url, '_self',       
                `toolbar=no, location=no, directories=no, status=no, menubar=no, 
                scrollbars=no, resizable=no, copyhistory=no`
            );
        }
        return;
    }

    render() {
        return (
            <div>
                {<PageHeader login={!!localStorage.getItem("access_token")}/>}
                <div className={styles.container}>
                    <Fade>
                        <Header as='h1' className={styles.header}>
                            <img className={styles.image} src={logo} alt="NUSCloud"/><br/>
                            Welcome to NUSCloud
                            <Header.Subheader className={styles.subHeader}>Sync all your course materials with just one click</Header.Subheader>
                        </Header>
                        <Divider />
                        <div className={styles.button}>
                            <Button size="massive" basic color='blue' onClick={this.handleSubmit}>Get Started</Button>
                        </div>
                        <StepsBlock />
                        <StepOneBlock />
                        <StepTwoBlock />
                        <StepThreeBlock />
                    </Fade>
                </div>
                <Footer />
            </div>
        )
    }
}


export default Home;