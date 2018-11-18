import React from 'react';
import { Header, Image, Divider } from 'semantic-ui-react';
import styles from '../styles/PrivacyBlock.module.css';
import keepyourprivacy from '../assets/PrivacyBlock/keepyourprivacy.png';

const PrivacyBlock = () => (
    <div className={styles.privacyContainer}>
        <div className={styles.message}>
            <Header size='huge'>
                Keep Your Privacy
                <Divider hidden />
                <Header.Subheader>
                    We do not store any credentials. Authentication is done by the relevant third-party providers.
                    <br />
                    Don't worry, we do not have access to change or view other files in your cloud platforms (except Box, see below). Moreover, we cannot upload anything to your IVLE and neither we have access to your grades at IVLE.
                    <Divider hidden />
                    <em>Due to the limited access types in Box, we are going to be able to see your files. However, we do not plan to use that access to view any of your other files.</em>
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.image}>
            <Image className={styles.privacyImage} src={keepyourprivacy} alt="Keep your privacy"/>
        </div>
    </div>
)

export default PrivacyBlock;