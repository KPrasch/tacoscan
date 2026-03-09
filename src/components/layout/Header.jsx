import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TacoOfficialLogo from '../TacoOfficialLogo';
import { SearchIcon } from '../ui';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount } from 'wagmi';
import styles from './Header.module.css';

const Header = () => {
  const navigate = useNavigate();
  const [searchValue, setSearchValue] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchValue.trim()) {
      // Determine search type based on input
      if (searchValue.startsWith('0x') && searchValue.length === 42) {
        navigate(`/address/${searchValue}`);
      } else if (!isNaN(searchValue)) {
        navigate(`/ritual/${searchValue}`);
      } else {
        navigate(`/search?q=${searchValue}`);
      }
      setSearchValue('');
    }
  };

  return (
    <header className={styles.header}>
      <div className={styles.mainHeader}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.logoSection}>
              <a href="/" className={styles.logoLink}>
                <TacoOfficialLogo variant="full" color="#96FF5E" height={32} />
                <span className={styles.logoText}>SCAN</span>
              </a>
            </div>

            <nav className={styles.mainNav}>
              <a href="/" className={styles.navLink}>Home</a>
              <a href="/cohorts" className={styles.navLink}>Action Control</a>
              <a href="/rituals" className={styles.navLink}>Access Control</a>
              <a href="/nodes" className={styles.navLink}>Nodes</a>
              <div className={styles.dropdown}>
                <button className={styles.navLink}>
                  More <span className={styles.dropdownArrow}>▼</span>
                </button>
                <div className={styles.dropdownContent}>
                  <a href="/rewards">Rewards</a>
                  <a href="/infractions">Infractions</a>
                  <a href="/activity">Protocol</a>
                  <a href="/contracts">Smart Contracts</a>
                  <a href="https://playground.taco.build/">Playground</a>
                  <a href="https://docs.taco.build">Documentation</a>
                </div>
              </div>
            </nav>

            <div className={styles.headerActions}>
              <button 
                className={styles.connectButton}
                onClick={() => open()}
              >
                {isConnected 
                  ? `${address.slice(0, 6)}...${address.slice(-4)}` 
                  : 'Connect Wallet'
                }
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.container}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={`${styles.searchBar} ${isSearchFocused ? styles.focused : ''}`}>
              <input
                type="text"
                placeholder="Search by Address / Ritual ID / Operator"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onFocus={() => setIsSearchFocused(true)}
                onBlur={() => setIsSearchFocused(false)}
                className={styles.searchInput}
              />
              <button type="submit" className={styles.searchButton}>
                <SearchIcon />
              </button>
            </div>
            <div className={styles.searchHint}>
              <span>Examples: </span>
              <a href="/ritual/1205" className={styles.exampleLink}>Ritual #1205</a>
              <span>, </span>
              <a href="/address/0x123..." className={styles.exampleLink}>0x123...</a>
            </div>
          </form>
        </div>
      </div>
    </header>
  );
};

export default Header;