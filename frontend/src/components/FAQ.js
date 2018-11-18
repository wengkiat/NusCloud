import React, { Component } from 'react';
import { Container, Header, Divider, Segment, Icon, Button } from 'semantic-ui-react';
import styles from '../styles/FAQ.module.css';
import header_styles from '../styles/Header.module.css'
import PageHeader from './Header.js';
import Fade from 'react-reveal/Fade';
import Footer from './Footer';

class FAQ extends Component {
    state = {}

    componentDidMount() {
        window.scrollTo(0, 0);
        let elem = Array.from(document.getElementsByClassName(header_styles.faq))[0];
        elem.click();
    }

    render() {
        return (
            <div>
                <PageHeader login={!!localStorage.getItem("access_token")} able={true}/>
                <div className={styles.outer_container}>
                    <Fade>
                        <Header className={styles.header}>
                            <Icon name="question circle outline" />
                            FAQ
                        </Header>
                        <Container text>
                            <Header attached='top' className={styles.sectionHeader}>
                                Introduction
                            </Header>
                            <Segment attached className={styles.segment}>
                                <strong>What is NUSCloud?</strong>
                                <Divider hidden />
                                Tired of downloading files manually from NUS IVLE and then uploading them to your cloud platforms? Find it troublesome to check IVLE everytime for new files being uploaded? 
                                NUSCloud is an app that helps you sync files in IVLE instantly to your own cloud platforms. We support Dropbox, Box, Google Drive, OneDrive. 
                                <Divider section hidden />
                                <strong>How does NUSCloud work?</strong>
                                <Divider hidden />
                                Just login to our website using your NUS IVLE account, provide permissions for us to access your cloud storage account, and the application will begin monitoring your IVLE files for new uploads to be downloaded! Steps with visual aids are displayed on the home page.
                            </Segment>
                            <Header attached className={styles.sectionHeader}>
                                Syncing with NUSCloud
                            </Header>
                            <Segment attached className={styles.segment}>
                                <strong>What does NUSCloud sync for me?</strong><br/>
                                We sync the workbins of the modules that you select.
                                <Divider section hidden />
                                <strong>How often does NUSCloud sync?</strong><br/>
                                We help you sync automatically when a new file is uploaded onto IVLE.
                                <Divider section hidden />
                                <strong>Does NUSCloud automatically sync when a new file is uploaded?</strong><br/>
                                Yes, we will help you sync automatically when a new file is uploaded onto IVLE.
                                <Divider section hidden />
                                <strong>Where will my files be synced to in my cloud storage?</strong><br/>
                                A folder will be created for NUSCloud in your cloud platform. <br/>
                                For Dropbox, your files will be synced to a newly created NUSCloud folder in the <a href="https://www.dropbox.com/home/Apps" target="_blank">Apps</a> folder.<br/>
                                For Google Drive, Box and OneDrive, your files will be synced to a newly created NUSCloud folder in the root of the main directory.
                                <Divider section hidden />
                                <strong>Will files with the same name get replaced when a new version is uploaded?</strong><br/>
                                No, new files uploaded with the same name will not replace old files in your cloud platform because we do not want for you to lose all your notes when the lecturer reuploads.<br/>
                                If you want the new files to be on the cloud, you can rename or delete the old files.
                            </Segment>
                            <Header attached className={styles.sectionHeader}>
                                Privacy
                            </Header>
                            <Segment attached className={styles.segment}>
                                <strong>Does NUSCloud store my credentials for IVLE and cloud platforms?</strong><br/>
                                No, we take the privacy of our users seriously. Your credentials are not stored and authentication is done by the relevant third-party providers.
                                <Divider section hidden />
                                <strong>Can NUSCloud view or edit files in my cloud platforms?</strong><br/>
                                No, we do not have access to view or edit your files. We only can access the files that we create on your cloud platform. 
                                <br/><em>Due to the limited access types in Box, we are going to be able to see your files. However, we do not plan to use that access to view any of your other files.</em>
                                <Divider section hidden />
                                <strong>Can NUSCloud view or upload files in my IVLE?</strong><br/>
                                No, we do not have access to view files in your IVLE or upload files to your IVLE.
                            </Segment>
                            <Header attached className={styles.sectionHeader}>
                                Technical Troubles
                            </Header>
                            <Segment attached className={styles.segment}>
                            This should not happen but if you encounter any technical problems with our app, please <a href="/contact">contact</a> us. <br/>In your message, please tell us the details of the problem that you are facing.
                            </Segment>
                            <Header attached className={styles.sectionHeader}>
                                Still have questions?
                                <Divider hidden />
                                <Button inverted size="huge" color="blue" onClick={() => window.location = "/contact"}>Contact Us</Button>
                            </Header>
                        </Container>
                    </Fade>
                </div>
                <Footer />
            </div>
        )
    }
}

export default FAQ;
