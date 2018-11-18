import React from 'react';
import { Header, Image, Divider } from 'semantic-ui-react';
import styles from '../styles/AnnotateBlock.module.css';
import annotate from '../assets/AnnotateBlock/annotate.png';

const AnnotateBlock = () => (
    <div className={styles.annotateContainer}>
        <div className={styles.message}>
            <Header size='huge' inverted color='blue'>
                Annotate Your Files Directly in Your Synced Folders
                <Divider hidden />
                <Header.Subheader inverted color="grey">
                    Reupload your annotated files to the same synced folders. 
                    <br />
                    We do not overwrite the files upon syncing. Instead, new versions are uploaded.
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.image}>
            <Image className={styles.annotateImage} src={annotate} alt="Annotate directly on your cloud platforms"/>
        </div>
    </div>
)

export default AnnotateBlock;