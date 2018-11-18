import React from 'react';
import { Container, Divider } from 'semantic-ui-react';
import { Link } from 'react-router-dom';
import styles from '../styles/NotFoundPage.module.css';
import PageHeader from './Header.js';

const NotFoundPage = () => (
    <div>
        {<PageHeader login={!!localStorage.getItem("access_token")}/>}
        <Container text className={styles.container}>
        Page Not Found<br/>
        <Divider hidden />
        <Link to="/">Go to Homepage</Link>
    </Container>
    </div>
);

export default NotFoundPage;