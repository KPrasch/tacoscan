import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TacoLogoAnimated from '../TacoLogoAnimated';
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
      <div className={styles.topBar}>
        <div className={styles.container}>
          <div className={styles.topBarContent}>
            <div className={styles.networkInfo}>
              <span className={styles.networkLabel}>Polygon Network</span>
              <span className={styles.separator}>|</span>
              <span className={styles.priceInfo}>TACO: $0.042</span>
              <span className={styles.separator}>|</span>
              <span className={styles.gasInfo}>Gas: 30 Gwei</span>
            </div>
            <div className={styles.topBarActions}>
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

      <div className={styles.mainHeader}>
        <div className={styles.container}>
          <div className={styles.headerContent}>
            <div className={styles.logoSection}>
              <a href="/" className={styles.logoLink}>
                <TacoLogoAnimated width={108} height={28} />
                <span className={styles.logoText}>SCAN</span>
              </a>
              <span className={styles.tagline}>TACo Blockchain Explorer</span>
            </div>

            <nav className={styles.mainNav}>
              <a href="/" className={styles.navLink}>Home</a>
              <div className={styles.dropdown}>
                <button className={styles.navLink}>
                  Blockchain <span className={styles.dropdownArrow}>▼</span>
                </button>
                <div className={styles.dropdownContent}>
                  <a href="/rituals">DKG Rituals</a>
                  <a href="/nodes">Node Operators</a>
                  <a href="/transactions">Transactions</a>
                  <a href="/pending">Pending Txns</a>
                </div>
              </div>
              <div className={styles.dropdown}>
                <button className={styles.navLink}>
                  Tokens <span className={styles.dropdownArrow}>▼</span>
                </button>
                <div className={styles.dropdownContent}>
                  <a href="/token/taco">TACO Token</a>
                  <a href="/token/holders">Top Holders</a>
                  <a href="/token/transfers">Token Transfers</a>
                </div>
              </div>
              <div className={styles.dropdown}>
                <button className={styles.navLink}>
                  Resources <span className={styles.dropdownArrow}>▼</span>
                </button>
                <div className={styles.dropdownContent}>
                  <a href="/charts">Charts & Stats</a>
                  <a href="/apis">APIs</a>
                  <a href="/verified-contracts">Verified Contracts</a>
                </div>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <div className={styles.searchSection}>
        <div className={styles.container}>
          <form onSubmit={handleSearch} className={styles.searchForm}>
            <div className={`${styles.searchBar} ${isSearchFocused ? styles.focused : ''}`}>
              <input
                type="text"
                placeholder="Search by Address / Ritual ID / Transaction Hash / Block"
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