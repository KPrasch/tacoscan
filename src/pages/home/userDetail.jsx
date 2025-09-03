import React, {useState, useEffect} from "react";
import * as Data from "../data";
import styles from './styles.module.css'
import Loader from "../../components/loader";
import * as Const from "../../utils/Cons";
import RitualTable from "../../components/table/ritual";
import * as Utils from "../../utils/utils";
import {
  Tab,
  Box,
  TabPanel,
  TabList,
  TabContext,
  Link
} from "../../components/ui";
import {ReactComponent as ShareLink} from "../../assets/link.svg";


function UserDetail({rowData}) {
  const [value, setValue] = React.useState("1");

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  return (
    <Box style={{width: '100%'}}>
      <TabContext value={value}>
        <Box style={{borderBottom: '1px solid rgba(0, 0, 0, 0.12)'}}>
          <TabList onChange={handleChange} aria-label="lab API tabs example">
            <Tab style={{textTransform: 'none', color: "black"}} label="DKG Rituals" value="1"/>
          </TabList>
        </Box>
        <TabPanel value="1">{RitualPanel(rowData)}</TabPanel>
      </TabContext>
    </Box>
  );
}

function RitualPanel(rowData){
  return (<RitualTable
    columns={Data.ritual_columns}
    data={rowData}
    isLoading={false}
    network={Const.DEFAULT_NETWORK}
  />);
}

const UserDetailPage = () => {
  const [pageData, setPageData] = useState({
    rowData: [],
    isLoading: true,
  });
  const [user, setUser] = useState();

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const user = query.get("user");
    setUser(user);

    Data.getUserDetail(user).then(async (info) => {
      const timeout = await Data.getTimeout();
      const array = [...info.rituals];
      setPageData({
        isLoading: false,
        rowData: Data.formatRitualsData(array, timeout),
      });
    });

  }, []);

  return (
    <>
      {
        pageData.isLoading ? (
          <div style={{textAlign: "center"}}>
            <Loader/>
          </div>
        ) : (
          <div>
            <div className={styles.staker_detail_header}>
              <div className={styles.staker_detail_header_address}>
                <h3>
                  <Link
                    target="_blank"
                    underline="hover"
                    href={Utils.getPolygonScanAddressLink() + user}
                    className={styles.link}
                  >
                    {Data.formatString(user)}
                    <ShareLink/>
                  </Link>
                </h3>
                <span>user</span>
              </div>
                <div className={styles.staker_detail_header_value}>
                  <div className={styles.staker_detail_header_value_item}>
                    <div className={styles.staker_detail_header_value_item_lable}>
                      DKG rituals authority
                    </div>
                    <div>
                      <div>{pageData.rowData.length}</div>
                    </div>
                  </div>
                </div>
            </div>
            <UserDetail rowData={pageData.rowData}/>
          </div>
        )
      }
    </>
  );
}

export default UserDetailPage;