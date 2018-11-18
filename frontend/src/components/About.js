import React, { Component } from 'react';
import { Container, Header, Divider } from 'semantic-ui-react';
import styles from '../styles/About.module.css';
import header_styles from '../styles/Header.module.css'
import PageHeader from './Header.js';
import SyncBlock from './SyncBlock';
import AccessBlock from './AccessBlock';
import PrivacyBlock from './PrivacyBlock';
import Fade from 'react-reveal/Fade';
import OpenSourceBlock from './OpenSourceBlock';
import Footer from './Footer';

class About extends Component {
    state = {}

    componentDidMount() {
        window.scrollTo(0, 0);
        let elem = Array.from(document.getElementsByClassName(header_styles.about))[0];
        elem.click();
    }

    render() {
        return (
            <div>
                <PageHeader login={!!localStorage.getItem("access_token")} able={true}/>
                <div className={styles.outer_container}>
                    <Fade>
                        <Container className={styles.container}>
                            <Header className={styles.header}>
                                Sync all your course materials with just one click
                                <Divider hidden />
                                <Header.Subheader className={styles.subheader}>
                                    We believe in bringing a better experience for the NUS community <br /> - convenience, connectivity and privacy
                                </Header.Subheader>
                            </Header>
                        </Container>

                        <PrivacyBlock />
                        <AccessBlock />
                        <SyncBlock />
                        {/* <OpenSourceBlock /> */}
                    </Fade>
                </div>
                <Footer />
            </div>
        )
    }
}

export default About;