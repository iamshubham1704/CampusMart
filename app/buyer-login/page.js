import React from 'react';
import styles from './buyer_login.module.css';

const BuyerLogin = () => {
  return (
    <div className={styles.loginWrapper}>
      <div className={styles.loginBox}>
        <h2 className={styles.title}>Buyer Login</h2>
        <form className={styles.form}>
          <input type="email" placeholder="Email Address" required />
          <input type="password" placeholder="Password" required />
          <button type="submit" className={styles.loginButton}>
            Log In
          </button>
        </form>
        <div className={styles.or}>or</div>
        <button className={styles.googleButton}>Continue with Google</button>
      </div>
    </div>
  );
};

export default BuyerLogin;
