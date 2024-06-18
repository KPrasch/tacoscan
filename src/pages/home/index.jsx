import React, { useEffect } from "react";
import About from "./about";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Button from "@mui/material/Button";
import { browserHistory } from "react-router";
import styles from "./styles.module.css";
import RitualPage from "./ritual";
import { ReactComponent as Logo } from "../../logo.svg";
import { ReactComponent as PowerThreshold} from '../../assets/power-threshold.svg';

import * as Const from "../../utils/Cons";
import IconButton from "@mui/material/IconButton";
import SettingsIcon from "@mui/icons-material/Settings";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import SearchIcon from "@mui/icons-material/Search";
import StakerPage from "./staker";
import StakerDetailPage from "./stakerDetail";
import UserDetailPage from "./userDetail";

const HomePage = () => {
  const [tab, setTab] = React.useState("1");
  const [anchorElSetting, setAnchorElSetting] = React.useState(null);
  const [searchInput, setSearchInput] = React.useState("");
  const [isSearch, setIsSearch] = React.useState(false);

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
      } else if (pathName.startsWith("/about")) {
        setTab("about");
      } else {
        setTab("rituals");
      }
    }
  }, []);

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

  function stakers() {
    return (
      <div>
        <StakerPage
          network={Const.DEFAULT_NETWORK}
          isSearch={isSearch}
          searchInput={searchInput}
        />
      </div>
    );
  }

  function stakerDetail() {
    return <StakerDetailPage />;
  }

  function userDetail() {
    return <UserDetailPage />;
  }

  function about() {
    return <About />;
  }

  function tabs() {
    const handleChange = (event, newValue) => {
      setTab(newValue);
      switch (newValue) {
        case "rituals":
          return browserHistory.push("/rituals");
        case "stakers":
          return browserHistory.push("/stakers");
        case "about":
          return browserHistory.push("/about");
        default:
          return browserHistory.push("/");
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
      <Box sx={{ width: "100%", typography: "body" }}>
        <div>
          <div className={styles.top_banner}>
            <div style={{paddingRight:"20px" , fill:"white"}}>
              <a href="https://threshold.network/" target="_blank" rel="noopener noreferrer">
                <PowerThreshold/>
              </a>
            </div>
            <p>
              Powered by Threshold Network
              <a href="https://threshold.network/" target="_blank" rel="noopener noreferrer">
                {" Learn More ↗"}
              </a>
            </p>
          </div>
        </div>
        <TabContext value={tab}>
          <Box
            sx={{
              mb: 0,
              borderBottom: 1,
              borderColor: "divider",
              textAlign: "left",
              marginLeft: "20px",
              paddingTop: "20px",
              display: "flex",
              flexDirection: "row",
              overflowX: "scroll",
              overflowY: "hidden",
              height: "90px",
            }}
          >
            <div className={styles.logo_header}>
              <a href="/">
                <Logo height={60} />
              </a>
            </div>
            <TabList
              onChange={handleChange}
              aria-label=""
              sx={{ display: "flex", paddingLeft: "20px", minWidth: "500px" }}
            >
              <Tab sx={{ padding: 2 }} label="DKG Rituals" value="rituals" />
              <Tab sx={{ padding: 2 }} label="Stakers" value="stakers" />
            </TabList>
            <div style={{ flex: "1 1 0%" }}></div>
            <div className={styles.search}>
              <TextField
                label="key / addresses / txhash"
                variant="outlined"
                fullWidth
                value={searchInput}
                onChange={handleChangeSearchInput}
                onKeyUp={(event) => {
                  if (event.key == "Enter") submitSearch();
                }}
                InputProps={{
                  endAdornment: (
                    <IconButton>
                      <SearchIcon onClick={() => submitSearch()} />
                    </IconButton>
                  ),
                }}
              />
            </div>
            <div className={styles.about}>
              <TabList
                className={styles.tab}
                onChange={handleChange}
                aria-label=""
              >
                <Tab sx={{ padding: 0 }} label="About" value="about" />
              </TabList>
            </div>
          </Box>
          <TabPanel value="rituals">{rituals()}</TabPanel>
          <TabPanel value="stakers">{stakers()}</TabPanel>
          <TabPanel value="stakerDetail">{stakerDetail()}</TabPanel>
          <TabPanel value="userDetail">{userDetail()}</TabPanel>
          <TabPanel value="about">{about()}</TabPanel>
        </TabContext>
      </Box>
    );
  }

  return <div>{tabs()}</div>;
};

export default HomePage;
