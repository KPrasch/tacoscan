import React, { useEffect } from "react";
import { Box, Tab, TabContext, TabList, TabPanel, Button } from "../../components/ui";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import RitualPage from "./ritual";
import RitualDetailPage from "./ritualDetail";
import TacoLogoAnimated from "../../components/TacoLogoAnimated";

import * as Const from "../../utils/Cons";
import { IconButton, TextField } from "../../components/ui";
import { SettingsIcon, SearchIcon } from "../../components/ui";
import { Menu, MenuItem } from "../../components/ui";
import NodesPage from "./nodes";
import NodeDetailPage from "./nodeDetail";
import UserDetailPage from "./userDetail";
import { useWeb3Modal } from '@web3modal/wagmi/react'
import { useAccount } from 'wagmi'
import { AccountBalanceWalletIcon } from '../../components/ui';

const HomePage = () => {
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("rituals");
  const [anchorElSetting, setAnchorElSetting] = React.useState(null);
  const [searchInput, setSearchInput] = React.useState("");
  const [isSearch, setIsSearch] = React.useState(false);
  const { open } = useWeb3Modal()
  const { address, isConnected } = useAccount()

  const openSetting = Boolean(anchorElSetting);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    if (query.has("staker")) {
      setTab("stakerDetail");
    } else if (query.has("user")) {
      setTab("userDetail");
    } else {
      const pathName = window.location.pathname;
      if (pathName.startsWith("/staker/")) {
        setTab("stakerDetail");
      } else if (pathName.startsWith("/stakers")) {
        setTab("stakers");
      } else if (pathName.startsWith("/rituals/")) {
        setTab("ritualDetail");
      } else {
        setTab("rituals");
      }
    }
  }, [window.location.pathname, window.location.search]);

  function rituals() {
    return (
      <div>
        <RitualPage
          network={Const.DEFAULT_NETWORK}
          isSearch={isSearch}
          searchInput={searchInput}
        />
      </div>
    );
  }

  function ritualDetail() {
    return <RitualDetailPage />;
  }

  function nodes() {
    return (
      <div>
        <NodesPage
          network={Const.DEFAULT_NETWORK}
          isSearch={isSearch}
          searchInput={searchInput}
        />
      </div>
    );
  }

  function nodeDetail() {
    return <NodeDetailPage />;
  }

  function userDetail() {
    return <UserDetailPage />;
  }

  function renderWalletButton() {
    return (
      <Button
        variant="contained"
        onClick={() => open()}
        startIcon={<AccountBalanceWalletIcon />}
        style={{
          marginLeft: '20px',
          marginRight: '20px',
          backgroundColor: '#0A0A0A',
          color: '#FFFFFF',
          border: 'none'
        }}
        className={styles.walletButton}
      >
        {isConnected ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Connect Wallet'}
      </Button>
    );
  }

  function tabs() {
    const handleChange = (event, newValue) => {
      setTab(newValue);
      switch (newValue) {
        case "rituals":
          return navigate("/rituals");
        case "stakers":
          return navigate("/stakers");
        default:
          return navigate("/");
      }
    };

    const handleChangeSearchInput = (event) => {
      setSearchInput(event.target.value);
      if (event.target.value.trim().length == 0) {
        setIsSearch(false);
      }
    };

    const submitSearch = () => {
      if (searchInput.length > 0) {
        setIsSearch(true);
      }
    };

    return (
      <Box style={{ width: "100%", background: "#F8F9FA", minHeight: "100vh" }}>
        <TabContext value={tab === "ritualDetail" ? "rituals" : tab}>
          <Box
            style={{
              marginBottom: 0,
              borderBottom: "1px solid #E5E7EB",
              textAlign: "left",
              padding: "20px 40px",
              display: "flex",
              flexDirection: "row",
              overflowX: "auto",
              overflowY: "hidden",
              height: "70px",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
              position: "sticky",
              top: 0,
              zIndex: 100
            }}
          >
            <div className={styles.logo_header}>
              <a href="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
                <TacoLogoAnimated width={108} height={28} loop={false} autoplay={true} />
                <span style={{ 
                  fontFamily: 'var(--font-mono, "Space Mono", monospace)', 
                  fontSize: '18px', 
                  fontWeight: '700',
                  color: '#0A0A0A',
                  letterSpacing: '-0.5px'
                }}>
                  SCAN
                </span>
              </a>
            </div>
            <TabList
              onChange={handleChange}
              aria-label=""
              style={{ 
                display: "flex", 
                paddingLeft: "20px", 
                minWidth: "500px",
                alignItems: "center",
                height: "100%",
                borderBottom: "none",
                marginBottom: 0
              }}
              value={tab === "ritualDetail" ? "rituals" : tab}
            >
              <Tab style={{ padding: "16px", alignSelf: "stretch", display: "flex", alignItems: "center" }} label="DKG Rituals" value="rituals" />
              <Tab style={{ padding: "16px", alignSelf: "stretch", display: "flex", alignItems: "center" }} label="Nodes" value="stakers" />
            </TabList>
            <div style={{ flex: "1 1 0%" }}></div>
            <div className={styles.search} style={{ display: 'flex', alignItems: 'center' }}>
              <TextField
                placeholder="key / addresses / txhash"
                variant="outlined"
                fullWidth
                value={searchInput}
                onChange={handleChangeSearchInput}
                onKeyUp={(event) => {
                  if (event.key == "Enter") submitSearch();
                }}
                endAdornment={
                  <IconButton onClick={() => submitSearch()}>
                    <SearchIcon />
                  </IconButton>
                }
                style={{ margin: 0 }}
              />
            </div>
            {renderWalletButton()}
          </Box>
          <TabPanel value="rituals">
            {tab === "ritualDetail" ? ritualDetail() : rituals()}
          </TabPanel>
          <TabPanel value="stakers">{nodes()}</TabPanel>
          <TabPanel value="stakerDetail">{nodeDetail()}</TabPanel>
          <TabPanel value="userDetail">{userDetail()}</TabPanel>
        </TabContext>
      </Box>
    );
  }

  return <div>{tabs()}</div>;
};

export default HomePage;
