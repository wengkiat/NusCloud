import React from 'react';
import { Header, Image, Divider } from 'semantic-ui-react';
import styles from '../styles/StepThreeBlock.module.css';
import step3 from '../assets/StepThreeBlock/step3.png';

const StepOneBlock = () => (
    <div className={styles.stepThreeContainer}>
        <div className={styles.message}>
            <Header size='huge'>
                3. Click on Your Preferred Cloud Storage
                <Divider hidden />
                <Header.Subheader>
                    We support Dropbox, GoogleDrive, Box and OneDrive.
                    <br />
                    Just provide us with the permission to upload your IVLE files! We do not have access to change or view other files in your cloud platforms.
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.stepThreeImage}>
            <Image className={styles.image} src={step3} alt="Log in with IVLE"/>
        </div>
    </div>
)

export default StepOneBlock;