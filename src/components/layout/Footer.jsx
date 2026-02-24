import React from 'react';
import styles from './Footer.module.css';

const Footer = () => {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.footerContent}>
          <div className={styles.footerSection}>
            <h4 className={styles.footerTitle}>TACo Scan</h4>
            <p className={styles.footerDescription}>
              The TACo Encryption Network Explorer and Analytics Platform
            </p>
            <div className={styles.socialLinks}>
              <a href="https://github.com/nucypher" className={styles.socialLink}>GitHub</a>
              <a href="https://x.com/buildwithtaco" className={styles.socialLink}>Twitter</a>
              <a href="https://discord.gg/ZHnDAJtuED" className={styles.socialLink}>Discord</a>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h5 className={styles.footerSubtitle}>Network</h5>
            <ul className={styles.footerLinks}>
              <li><a href="/rituals">DKG Rituals</a></li>
              <li><a href="/nodes">Nodes</a></li>
              <li><a href="/activity">Network Activity</a></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h5 className={styles.footerSubtitle}>Developers</h5>
            <ul className={styles.footerLinks}>
              <li><a href="https://docs.taco.build/">Documentation</a></li>
              <li><a href="https://github.com/nucypher/tacoscan">Source Code</a></li>
              <li><a href="/integrate">Integration Guide</a></li>
              <li><a href="/sdk">SDK Reference</a></li>
            </ul>
          </div>


        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContent}>
            <p className={styles.copyright}>
              © 2025 TACo Scan. All rights reserved.
            </p>
            <div className={styles.footerBottomLinks}>
              <a href="/terms">Terms</a>
              <a href="/privacy">Privacy</a>
              <a href="/contact">Contact</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;