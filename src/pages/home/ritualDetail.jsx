import React, { useState, useEffect } from "react";
import * as Data from "../data";
import styles from "./styles.module.css";
import Link from "@mui/material/Link";
import { ReactComponent as Copy } from "../../assets/copy.svg";
import { ReactComponent as ShareLink } from "../../assets/link.svg";
import TransactionTimeline from "../../components/table/timeline";
import * as Utils from "../../utils/utils";
import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableRow from "@mui/material/TableRow";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Loader from "../../components/loader";

const RitualDetailPage = () => {
    const [pageData, setPageData] = useState({
        ritual: null,
        isLoading: true
    });

    useEffect(() => {
        const fetchRitualData = async () => {
            const ritualId = window.location.pathname.split("/rituals/")[1];
            if (!ritualId) return;

            const data = await Data.getRituals(true, ritualId);
            if (data?.rituals && data.rituals.length > 0) {
                const timeout = await Data.getTimeout();
                const formattedRitual = Data.formatRitualsData(data.rituals, timeout)[0];
                setPageData({
                    ritual: formattedRitual,
                    isLoading: false
                });
            } else {
                setPageData({
                    ritual: null,
                    isLoading: false
                });
            }
        };

        fetchRitualData();
    }, []);

    const copyToClipBoard = (data) => {
        try {
            navigator.clipboard.writeText(data);
        } catch (err) {}
    };

    const formatAddresses = ({ addresses }) => {
        if (!addresses || addresses.length === 0) return "-";
        
        return addresses.map((address, index) => (
            <div key={index}>
                <Link
                    target="_blank"
                    underline="hover"
                    href={Utils.getPolygonScanAddressLink() + address}
                    className={styles.link}
                >
                    {address}
                    <ShareLink />
                </Link>
                <Copy
                    style={{ cursor: "pointer" }}
                    onClick={(e) => copyToClipBoard(address)}
                />
            </div>
        ));
    };

    if (pageData.isLoading) {
        return <Loader />;
    }

    if (!pageData.ritual) {
        return <div className={styles.nodata}>Ritual not found</div>;
    }

    const { ritual } = pageData;

    return (
        <div>
            <div className={styles.staker_detail_header}>
                <div className={styles.staker_detail_header_address}>
                    <h3>DKG Ritual #{ritual.id}</h3>
                    <span>Status: {ritual.status}</span>
                </div>
            </div>
            <Box sx={{ margin: "20px" }}>
                <div className={styles.detail_item} style={{ flexDirection: "column" }}>
                    <div style={{ width: "100%" }}>
                        <TransactionTimeline
                            transactions={ritual.transactions}
                            network={ritual.network}
                        />
                    </div>
                    <div style={{ width: "100%", marginTop: "20px" }}>
                        <TableContainer component={Paper} className={styles.timeline}>
                            <Table
                                className={styles.table_detail}
                                sx={{ minWidth: 750 }}
                                aria-labelledby="tableTitle"
                                size={"small"}
                            >
                                <TableBody>
                                    <TableRow>
                                        <TableCell>DKG Id</TableCell>
                                        <TableCell>{ritual.id}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Public key</TableCell>
                                        <TableCell>
                                            {Data.formatString(ritual.publicKey)}
                                            <Copy
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => copyToClipBoard(ritual.publicKey)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Threshold</TableCell>
                                        <TableCell>{ritual.threshold}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>DKG Size</TableCell>
                                        <TableCell>{ritual.dkgSize}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell>Initiator</TableCell>
                                        <TableCell>
                                            <Link
                                                target="_blank"
                                                underline="hover"
                                                href={Utils.getPolygonScanAddressLink() + ritual.initiator}
                                                className={styles.link}
                                            >
                                                {Data.formatString(ritual.initiator)}
                                                <ShareLink />
                                            </Link>
                                            <Copy
                                                style={{ cursor: "pointer" }}
                                                onClick={(e) => copyToClipBoard(ritual.initiator)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell style={{ verticalAlign: "top" }}>Participants</TableCell>
                                        <TableCell>{formatAddresses({ addresses: ritual.participants })}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell style={{ verticalAlign: "top" }}>Transcripts</TableCell>
                                        <TableCell>{formatAddresses({ addresses: ritual.transcripts })}</TableCell>
                                    </TableRow>
                                    {ritual.pendingTranscripts && ritual.pendingTranscripts.length > 0 && (
                                        <TableRow>
                                            <TableCell style={{ verticalAlign: "top" }}>Pending Transcripts</TableCell>
                                            <TableCell>{formatAddresses({ addresses: ritual.pendingTranscripts })}</TableCell>
                                        </TableRow>
                                    )}
                                    <TableRow>
                                        <TableCell style={{ verticalAlign: "top" }}>Aggregations</TableCell>
                                        <TableCell>{formatAddresses({ addresses: ritual.aggregations })}</TableCell>
                                    </TableRow>
                                    {ritual.pendingAggregations && ritual.pendingAggregations.length > 0 && (
                                        <TableRow>
                                            <TableCell style={{ verticalAlign: "top" }}>Pending Aggregations</TableCell>
                                            <TableCell>{formatAddresses({ addresses: ritual.pendingAggregations })}</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </div>
                </div>
            </Box>
        </div>
    );
};

export default RitualDetailPage; 