import React, { useEffect } from "react";
import About from "./about";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import styles from "./styles.module.css";
import RitualPage from "./ritual";
import RitualDetailPage from "./ritualDetail";
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
  const navigate = useNavigate();
  const [tab, setTab] = React.useState("rituals");
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
          return navigate("/rituals");
        case "stakers":
          return navigate("/stakers");
        case "about":
          return navigate("/about");
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
        <TabContext value={tab === "ritualDetail" ? "rituals" : tab}>
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
              value={tab === "ritualDetail" ? "rituals" : tab}
            >
              <Tab sx={{ padding: 2 }} label="DKG Rituals" value="rituals" />
              <Tab sx={{ padding: 2 }} label="Stakers" value="stakers" />
              <Tab sx={{ padding: 2 }} label="About" value="about" />
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
                    <IconButton onClick={() => submitSearch()}>
                      <SearchIcon />
                    </IconButton>
                  ),
                }}
              />
            </div>
          </Box>
          <TabPanel value="rituals">
            {tab === "ritualDetail" ? ritualDetail() : rituals()}
          </TabPanel>
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
