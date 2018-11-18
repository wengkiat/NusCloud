import React from 'react';
import { Divider, Icon } from 'semantic-ui-react';
import styles from '../styles/Footer.module.css';

const Footer = () => (
    <div className={styles.footer}>
        &copy; 2018 NUSCloud
        <Divider className={styles.divider}/>
        {/* <a>Terms of Use</a> - <a>Privacy Policy</a> */}
        <br/>Done by a team of NUS students<br />
        <Divider className={styles.divider} />
        <a href="https://www.facebook.com/nuscloud/" target="_blank"><Icon name="facebook"/></a>
        <a href="https://twitter.com/nuscloud" target="_blank"><Icon name="twitter"/></a>
        <a href="https://github.com/NUSCloud/" target="_blank"><Icon name="github"/></a>
    </div>
);

export default Footer;