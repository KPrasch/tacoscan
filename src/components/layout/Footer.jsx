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
              The TACo Network Blockchain Explorer and Analytics Platform
            </p>
            <div className={styles.socialLinks}>
              <a href="https://github.com/nucypher" className={styles.socialLink}>GitHub</a>
              <a href="https://twitter.com/nucypher" className={styles.socialLink}>Twitter</a>
              <a href="https://discord.gg/nucypher" className={styles.socialLink}>Discord</a>
            </div>
          </div>

          <div className={styles.footerSection}>
            <h5 className={styles.footerSubtitle}>Blockchain</h5>
            <ul className={styles.footerLinks}>
              <li><a href="/rituals">DKG Rituals</a></li>
              <li><a href="/nodes">Node Operators</a></li>
              <li><a href="/transactions">Transactions</a></li>
              <li><a href="/pending">Pending Txns</a></li>
              <li><a href="/contracts">Verified Contracts</a></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h5 className={styles.footerSubtitle}>Developers</h5>
            <ul className={styles.footerLinks}>
              <li><a href="/apis">APIs</a></li>
              <li><a href="/docs">Documentation</a></li>
              <li><a href="https://github.com/nucypher/tacoscan">Source Code</a></li>
              <li><a href="/verify">Verify Contract</a></li>
              <li><a href="/broadcast">Broadcast TXN</a></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h5 className={styles.footerSubtitle}>Resources</h5>
            <ul className={styles.footerLinks}>
              <li><a href="/charts">Charts & Stats</a></li>
              <li><a href="/topstats">Top Statistics</a></li>
              <li><a href="/directory">Directory</a></li>
              <li><a href="/newsletter">Newsletter</a></li>
              <li><a href="https://taco.build">TACo Website</a></li>
            </ul>
          </div>

          <div className={styles.footerSection}>
            <h5 className={styles.footerSubtitle}>Network Info</h5>
            <div className={styles.networkInfo}>
              <div className={styles.networkItem}>
                <span className={styles.networkLabel}>Network:</span>
                <span className={styles.networkValue}>Polygon</span>
              </div>
              <div className={styles.networkItem}>
                <span className={styles.networkLabel}>Chain ID:</span>
                <span className={styles.networkValue}>137</span>
              </div>
              <div className={styles.networkItem}>
                <span className={styles.networkLabel}>Currency:</span>
                <span className={styles.networkValue}>MATIC</span>
              </div>
              <div className={styles.networkItem}>
                <span className={styles.networkLabel}>Block Time:</span>
                <span className={styles.networkValue}>~2.0s</span>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footerBottom}>
          <div className={styles.footerBottomContent}>
            <p className={styles.copyright}>
              © 2024 TACo Scan. All rights reserved.
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