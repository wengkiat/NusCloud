import React from 'react';
import { Header, Image, Divider } from 'semantic-ui-react';
import styles from '../styles/StepTwoBlock.module.css';
import step2 from '../assets/StepTwoBlock/step2.png';

const StepTwoBlock = () => (
    <div className={styles.stepTwoContainer}>
        <div className={styles.message}>
            <Header size='huge'>
                2. Choose Your Modules
                <Divider hidden />
                <Header.Subheader>
                    Fret not, you can choose which modules to sync! Just click on modules that you want to sync with your cloud platform. 
                    <br />
                    You can unsync anytime. We sync all files in your module workbin.
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.stepTwoImage}>
            <Image className={styles.image} src={step2} alt="Log in with IVLE"/>
        </div>
    </div>
)

export default StepTwoBlock;