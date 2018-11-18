import React from 'react';
import { Header, Button, Divider } from 'semantic-ui-react';
import styles from '../styles/OpenSourceBlock.module.css';
// import openSource from '../assets/OpenSourceBlock/access.png';

const OpenSourceBlock = () => (
    <div className={styles.openSourceContainer}>
        <div className={styles.message}>
            <Header className={styles.header} size="huge">
                Open Source
                <Divider hidden />
                <Header.Subheader>
                    We are an open source project.
                    <br />
                    Your suggestions and feedback are always welcomed.
                </Header.Subheader>
            </Header>
        </div>
        <div className={styles.buttonWrapper}>
            {/* <Image className={styles.openSourceImage} src={openSource} alt="We are an open source project"/> */}
            <Button inverted color="blue" size="huge" onClick={() => window.open("https://github.com/NUSCloud", "_blank")}>View Our Code</Button>
        </div>
    </div>
)

export default OpenSourceBlock;