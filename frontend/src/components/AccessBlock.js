import React from 'react';
import { Header, Image, Divider } from 'semantic-ui-react';
import styles from '../styles/AccessBlock.module.css';
import access from '../assets/AccessBlock/access.png';

const AnnotateBlock = () => (
    <div className={styles.accessContainer}>
        <div className={styles.message}>
            <Header size='huge' inverted color='blue'>
                Access Files from All Your Devices
                <Divider hidden />
                <Header.Subheader inverted color="grey">
                    When you sync with us, we bring your files together in one safe place. 
                    <br />
                    You can take them with you anywhere you go, access them from any device and share them with anyone.
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.image}>
            <Image className={styles.accessImage} src={access} alt="Access files from all your devices"/>
        </div>
    </div>
)

export default AnnotateBlock;