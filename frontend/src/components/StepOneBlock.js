import React from 'react';
import { Header, Image, Divider } from 'semantic-ui-react';
import styles from '../styles/StepOneBlock.module.css';
import step1 from '../assets/StepOneBlock/step1.png';

const StepOneBlock = () => (
    <div className={styles.stepOneContainer}>
        <div className={styles.message}>
            <Header size='huge'>
                1. Log in with IVLE
                <Divider hidden />
                <Header.Subheader>
                    Log in through NUS IVLE's authentication system so we can verify your identity and retrieve your modules!
                    <br />
                    Don't worry, we cannot upload anything to your IVLE and we do not store your credentials.
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.stepOneImage}>
            <Image className={styles.image} src={step1} alt="Log in with IVLE"/>
        </div>
    </div>
)

export default StepOneBlock;