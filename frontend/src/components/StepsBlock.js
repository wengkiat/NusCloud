import React from 'react';
import { Header, Divider } from 'semantic-ui-react';
import styles from '../styles/StepsBlock.module.css';

const StepsBlock = () => (
    <div className={styles.stepsContainer}>
        <div className={styles.message}>
            <Header as="h1" inverted color='teal'>
                1. Log in with IVLE
                <Divider hidden />
                <Header.Subheader inverted color='grey'>
                    Log in through NUS IVLE's authentication system so we can verify your identity and retrieve your modules!
                    <br />
                    Don't worry, we cannot upload anything to your IVLE and we do not store your credentials.
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.message}>
            <Header as="h1" inverted color='teal'>
                2. Choose Your Modules
                <Divider hidden />
                <Header.Subheader inverted color='grey'>
                    Fret not, you can choose which modules to sync! Just click on modules that you want to sync with your cloud platform. 
                    <br />
                    You can unsync anytime. We sync all files in your module workbin.
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.message}>
            <Header as="h1" inverted color='teal'>
                3. Click on Your Preferred Cloud Storage
                <Divider hidden />
                <Header.Subheader inverted color='grey'>
                    We support Dropbox, GoogleDrive, Box and OneDrive.
                    <br />
                    Just provide us with the permission to upload your IVLE files! 
                    <br />
                    We do not have access to change or view other files in your cloud platforms.
                </Header.Subheader>
            </Header>
        </div>
    </div>
)

export default StepsBlock;