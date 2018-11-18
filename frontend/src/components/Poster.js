import React from 'react';
import poster from '../assets/Poster/Poster.png';
import styles from '../styles/Poster.module.css'

const Poster = () => (
    <div className={styles.container}>
        <img src={poster} alt="poster" className={styles.poster}/>
    </div>
);

export default Poster;