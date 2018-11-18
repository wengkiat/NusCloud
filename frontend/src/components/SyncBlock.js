import React from 'react';
import { Header, Image, Divider } from 'semantic-ui-react';
import styles from '../styles/SyncBlock.module.css';
import syncfiles from '../assets/SyncBlock/syncfiles.png';

const SyncBlock = () => (
    <div className={styles.syncContainer}>
        <div className={styles.message}>
            <Header size='huge'>
                Sync Once and Never Again
                <Divider hidden />
                <Header.Subheader>
                    Sync once and we'll keep your files up to date. You never need to sync again!
                    <br />
                    We help you monitor all files in IVLE and download new files to your selected cloud platform(s).
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.image}>
            <Image className={styles.syncImage} src={syncfiles} alt="Sync files"/>
        </div>
    </div>
)

export default SyncBlock;