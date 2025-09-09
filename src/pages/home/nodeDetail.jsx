import React, {useState, useEffect} from "react";
import { useParams } from "react-router-dom";
import * as Data from "../data";
import styles from './styles.module.css'
import { ReactComponent as Copy } from "../../assets/copy.svg";
import * as Const from '../../utils/Cons';
import {ReactComponent as ShareLink} from "../../assets/link.svg";
import * as Utils from "../../utils/utils";
import {TIME_LOCK_DEAUTHORIZATION} from "../../utils/Cons";
import Loader from "../../components/loader";
import {
  Link,
  Tab,
  Box,
  TabPanel,
  TabList,
  TabContext,
  Tooltip,
  TableContainer,
  Paper,
  CheckSharpIcon,
  CloseSharpIcon
} from "../../components/ui";
import RitualTable from "../../components/table/ritual";

function NodeDetail({node, stakingProvider}) {
    const [value, setValue] = React.useState("1");

    const handleChange = (event, newValue) => {
        setValue(newValue);
    };

    return (
        <Box style={{width: '100%'}}>
            <TabContext value={value}>
                <Box style={{borderBottom: '1px solid rgba(0, 0, 0, 0.12)'}}>
                    <TabList onChange={handleChange} aria-label="lab API tabs example">
                        <Tab style={{textTransform: 'none', color: "black"}} label="Overview" value="1"/>
                        <Tab style={{textTransform: 'none', color: "black"}} label="DKG Rituals" value="2"/>
                    </TabList>
                </Box>
                <TabPanel value="1" className={styles.node_detail}>{Overview(node)}</TabPanel>
                <TabPanel value="2">{DKGRituals(stakingProvider)}</TabPanel>
            </TabContext>
        </Box>
    );
}

function Overview(node) {
    const copyToClipBoard = (data) => {
        try {
          navigator.clipboard.writeText(data);
        } catch (err) {}
    };

    const formatEventType = (eventType) => {
        return eventType
          .replace(/([a-z])([A-Z])/g, '$1 $2')
          .replace(/([A-Z])([A-Z][a-z])/g, '$1 $2')
          .replace(/\b\w/g, char => char.toUpperCase());
    };

    const formatEvent = (event, amount) => {
        if (event == undefined)
            return

        switch (event) {
            case "Staked":
                return "Node staked " + amount + " token."
            case "ToppedUp":
                return "Node stake more " + amount + " token."
            case "Unstaked":
                return "Node has unstaked " + amount + " token."
            case "AuthorizationIncreased":
                return "Has been authorized " + amount + " token to the Staking contract."
            case "AuthorizationDecreaseApproved":
                return "Node has reduced " + amount + " token from Staking contract."
            case "AuthorizationInvoluntaryDecreased":
                return "The Staking Contract has reduced the authorized amount to " + amount + " token."
            case "BondedOperator":
                return "Operator has been bonded with the TACoApplication contract."
        }
    }

    return (
        <div className={styles.node_detail_overview}>
            <div style={{flex: "1 1 0%"}}>
                <table className={styles.node_detail_overview_table}>
                    {/* --------- Stake---------*/}
                    <tbody>
                    <tr>
                        <th colSpan="2" style={{fontWeight: "bold"}}>Stake</th>
                    </tr>
                    </tbody>
                    <tbody className={styles.node_detail_overview_table_tbody}>
                    <tr>
                        <th>Stake</th>
                        <td>
                            {"T " + node.weiDecimalStakedAmount}
                        </td>
                    </tr>
                    <tr>
                        <th>Staked at</th>
                        <td>
                            {Data.formatDate(node.stakedAt) ?? "Not yet staked"}
                        </td>
                    </tr>
                    <tr>
                        <th>Operator bonded at</th>
                        <td>
                            {Data.formatDate(node.bondedAt) ?? "Operator not bonded"}
                        </td>
                    </tr>
                    </tbody>
                    {/* --------- Roles---------*/}
                    <tbody>
                        <tr>
                            <th colSpan="2" style={{fontWeight: "bold"}}>Roles</th>
                        </tr>
                    </tbody>
                    <tbody className={styles.node_detail_overview_table_tbody}>
                        <tr>
                            <th>Owner</th>
                            <td>
                                <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getEtherAddressLink() + node.owner}
                                    className={styles.link}
                                >
                                    {Data.formatString(node.owner)}
                                    <ShareLink/>
                                </Link>
                                <Tooltip title="Copied">
                                    <Copy
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) => copyToClipBoard(node.owner)}
                                    />
                                </Tooltip>
                            </td>
                        </tr>
                        <tr>
                            <th>Beneficiary</th>
                            <td>
                                <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getEtherAddressLink() + node.beneficiary}
                                    className={styles.link}
                                >
                                    {Data.formatString(node.beneficiary)}
                                    <ShareLink/>
                                </Link>
                                <Tooltip title="Copied">
                                    <Copy
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) => copyToClipBoard(node.beneficiary)}
                                    />
                                </Tooltip>
                            </td>
                        </tr>
                        <tr>
                            <th>Authorizer</th>
                            <td>
                                <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getEtherAddressLink() + node.authorizer}
                                    className={styles.link}
                                >
                                    {Data.formatString(node.authorizer)}
                                    <ShareLink/>
                                </Link>
                                <Tooltip title="Copied">
                                    <Copy
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) => copyToClipBoard(node.authorizer)}
                                    />
                                </Tooltip>
                            </td>
                        </tr>
                        <tr>
                            <th>Operator</th>
                            <td>
                                <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getEtherAddressLink() + node.registeredOperatorAddress}
                                    className={styles.link}
                                >
                                    {node.registeredOperatorAddress ? Data.formatString(node.registeredOperatorAddress) : "Operator not registered"}
                                    <ShareLink/>
                                </Link>
                                <Tooltip title="Copied">
                                    <Copy
                                        style={{ cursor: "pointer" }}
                                        onClick={(e) => copyToClipBoard(node.registeredOperatorAddress)}
                                    />
                                </Tooltip>
                            </td>
                        </tr>
                        <tr>
                            <th>Operator confirmed</th>
                            <td>
                                {
                                    node.isOperatorConfirmed ? (
                                        <CheckSharpIcon style={{color: "green"}}/>
                                    ) : (
                                        <CloseSharpIcon style={{color: "red"}}/>
                                    )
                                }
                            </td>
                        </tr>
                    </tbody>

                    {/* --------- Authorizations---------*/}
                    <tbody>
                        <tr>
                            <th colSpan="2" style={{fontWeight: "bold"}}>Authorizations</th>
                        </tr>
                    </tbody>
                    <tbody className={styles.node_detail_overview_table_tbody}>
                        <tr>
                            <th>Total authorized</th>
                            <td>
                                {
                                    node.weiDecimalAuthorizedAmount
                                }
                                {
                                    node.isAuthorized ? (
                                        <CheckSharpIcon style={{color: "green"}}/>
                                    ) : (
                                        <CloseSharpIcon style={{color: "red"}}/>
                                    )
                                }

                            </td>
                        </tr>
                    </tbody>
                    {/* --------- Deauthorization ---------*/}
                    <tbody>
                    <tr>
                        <th colSpan="2" style={{fontWeight: "bold"}}>Deauthorization</th>
                    </tr>
                    </tbody>
                    <tbody className={styles.node_detail_overview_table_tbody}>
                        <tr>
                            <th>Total deauthorizing</th>
                            <td>
                                {node.weiDecimalDeauthorizingAmount}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div style={{flex: "1 1 0%"}}>
                <h4><strong>Log</strong></h4>
                {node?.events?.map((eventEntity, index) => {
                    const event = eventEntity.eventType;
                    const timestamp = eventEntity.timestamp;
                    const amount = eventEntity.weiDecimalEventAmount;
                    return (
                        <div key={`event-${index}-${timestamp}`} className={styles.log_item}>
                            <div className={styles.log_item_lable}>
                                <Tooltip title={Data.formatDate(timestamp)}>
                                    <span>{Data.formatTimeToText(timestamp)}</span>
                                </Tooltip>
                            </div>
                            <div>
                                <strong>{formatEventType(event)}</strong>
                                <div>
                                    {formatEvent(event, amount)}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
}

function DKGRituals(node) {
    const [pageData, setPageData] = useState({
        rowData: [],
        isLoading: false,
        pageNumber: 1
    });

    useEffect(() => {
        setPageData((prevState) => ({
            ...prevState,
            rowData: [],
            isLoading: true,
        }));

        Data.getRitualsByStakingProvider(node).then(async (info) => {
            if(info?.rituals === undefined){
                setPageData({
                    isLoading: false,
                    rowData: []
                });
            } else {
                const timeout = await Data.getTimeout();
                setPageData({
                    isLoading: false,
                    rowData: Data.formatRitualsData(info.rituals, timeout)
                });
            }
        });
    }, []);

    return <RitualTable
        columns={Data.ritual_columns}
        data={pageData.rowData}
        isLoading={pageData.isLoading}
        network
    />
    
}

const NodeDetailPage = () => {
    const { address } = useParams(); // Get the node address from URL params
    const [pageData, setPageData] = useState({
        rowData: {},
        isLoading: true,
    });

    const [node, setNode] = useState();
    useEffect(() => {
        const nodeAddress = address; // Use the address from URL params
        setNode(nodeAddress);

        Data.getNodeDetail(nodeAddress).then((info) => {
            console.log("NodeDetail received info:", info);
            
            if (!info || !info.appAuthorization) {
                console.log("No appAuthorization found, setting empty data");
                setPageData({
                    isLoading: false,
                    rowData: {}
                });
                return
            }

            const formattedData = Data.formatNodeDetail(info);
            console.log("Formatted node data:", formattedData);
            
            setPageData({
                isLoading: false,
                rowData: formattedData
              });
        });
    }, [address]);

    function calculatePercentAuthorizedOfStake(authorizedAmount, stakedAmount) {
        if (stakedAmount == 0 || authorizedAmount == 0)
            return 0
        return parseFloat((authorizedAmount / stakedAmount) * 100).toFixed(2);
    }

    return (<>
            {
                pageData.isLoading ? (
                    <div style={{textAlign: "center"}}>
                        <Loader/>
                    </div>
                ) : (
                    <div>
                        <div className={styles.node_detail_header}>
                            <div className={styles.node_detail_header_address}>
                                <h3><Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getEtherAddressLink() + node}
                                    className={styles.link}
                                >
                                    {Data.formatString(node)}
                                    <ShareLink/>
                                </Link>
                                </h3>
                                <span>Staking Provider</span>
                            </div>
                            <div className={styles.node_detail_header_value}>
                                <div className={styles.node_detail_header_value_item}>
                                    <div className={styles.node_detail_header_value_item_lable}>total authorized
                                    </div>
                                    <div>
                                        <div>{pageData.rowData.weiDecimalAuthorizedAmount}<span
                                            className={styles.span_t_token}>{" T"}</span></div>
                                        <div
                                            className={styles.node_detail_header_value_item_percent}>
                                            {calculatePercentAuthorizedOfStake(pageData.rowData.parsedAuthorizedAmount, pageData.rowData.parsedStakedAmount)}%
                                            of staked
                                        </div>
                                    </div>
                                </div>
                                <div className={styles.node_detail_header_value_item}>
                                    <div className={styles.node_detail_header_value_item_lable}>staked</div>
                                    <div>
                                        <div>{pageData.rowData.weiDecimalStakedAmount}<span
                                            className={styles.span_t_token}>{" T"}</span></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <NodeDetail node={pageData.rowData} stakingProvider={node} />
                    </div>
                )
            }</>

    );
}

export default NodeDetailPage;