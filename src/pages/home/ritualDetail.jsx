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
import { getColorByStatus } from "../../components/table/view_utils";
import TableHead from "@mui/material/TableHead";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import PendingIcon from "@mui/icons-material/Pending";
import ErrorIcon from "@mui/icons-material/Error";

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

    const ParticipantRow = ({ participant, ritual }) => {
        const hasSubmittedTranscript = ritual.transcripts.includes(participant);
        const hasPendingTranscript = ritual.pendingTranscripts?.includes(participant);
        const hasSubmittedAggregation = ritual.aggregations.includes(participant);
        const hasPendingAggregation = ritual.pendingAggregations?.includes(participant);
        const operatorAddress = ritual.operatorAddresses?.[participant] || "-";

        const getStatusIcon = (isSubmitted, isPending) => {
            if (isSubmitted) return <CheckCircleIcon sx={{ color: "#4CAF50", fontSize: "1.2rem" }} />;
            if (isPending) return <PendingIcon sx={{ color: "#FF9800", fontSize: "1.2rem" }} />;
            return <ErrorIcon sx={{ color: "#F44336", fontSize: "1.2rem" }} />;
        };

        return (
            <TableRow>
                <TableCell colSpan={4} sx={{ padding: 0, border: 'none' }}>
                    <Accordion sx={{ 
                        boxShadow: 'none', 
                        '&:before': { display: 'none' },
                        backgroundColor: 'transparent',
                        width: '100%',
                        margin: '0 !important'
                    }}>
                        <AccordionSummary 
                            expandIcon={<ExpandMoreIcon />}
                            sx={{ 
                                padding: 0,
                                '& .MuiAccordionSummary-content': { 
                                    margin: '0 !important',
                                    width: '100%'
                                }
                            }}
                        >
                            <div style={{ 
                                display: 'flex', 
                                width: '100%', 
                                borderBottom: '1px solid rgba(0,0,0,0.12)'
                            }}>
                                <div style={{ 
                                    width: '35%', 
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    <Link
                                        target="_blank"
                                        underline="hover"
                                        href={Utils.getPolygonScanAddressLink() + participant}
                                        className={styles.link}
                                        sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        {participant}
                                        <ShareLink style={{ marginLeft: "4px" }}/>
                                    </Link>
                                    <Copy
                                        style={{ cursor: "pointer", marginLeft: "4px" }}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            copyToClipBoard(participant);
                                        }}
                                    />
                                </div>
                                <div style={{ 
                                    width: '35%', 
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center'
                                }}>
                                    {operatorAddress !== "-" ? (
                                        <>
                                            <Link
                                                target="_blank"
                                                underline="hover"
                                                href={Utils.getPolygonScanAddressLink() + operatorAddress}
                                                className={styles.link}
                                                sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                {operatorAddress}
                                                <ShareLink style={{ marginLeft: "4px" }}/>
                                            </Link>
                                            <Copy
                                                style={{ cursor: "pointer", marginLeft: "4px" }}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    copyToClipBoard(operatorAddress);
                                                }}
                                            />
                                        </>
                                    ) : (
                                        <span style={{ color: 'rgba(0,0,0,0.38)' }}>Not registered</span>
                                    )}
                                </div>
                                <div style={{ 
                                    width: '15%', 
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {getStatusIcon(hasSubmittedTranscript, hasPendingTranscript)}
                                </div>
                                <div style={{ 
                                    width: '15%', 
                                    padding: '12px 16px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {getStatusIcon(hasSubmittedAggregation, hasPendingAggregation)}
                                </div>
                            </div>
                        </AccordionSummary>
                        <AccordionDetails sx={{ padding: '0 16px 16px' }}>
                            <Box sx={{ 
                                display: 'flex', 
                                flexDirection: 'column', 
                                gap: '12px',
                                padding: '16px',
                                backgroundColor: 'rgba(0,0,0,0.02)',
                                borderRadius: '8px'
                            }}>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>Transcript Status</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getStatusIcon(hasSubmittedTranscript, hasPendingTranscript)}
                                        <span>{hasSubmittedTranscript ? 'Submitted' : hasPendingTranscript ? 'Pending' : 'Not Submitted'}</span>
                                    </div>
                                </div>
                                <div>
                                    <div style={{ fontSize: '0.75rem', color: 'rgba(0,0,0,0.6)', marginBottom: '4px' }}>Aggregation Status</div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        {getStatusIcon(hasSubmittedAggregation, hasPendingAggregation)}
                                        <span>{hasSubmittedAggregation ? 'Submitted' : hasPendingAggregation ? 'Pending' : 'Not Submitted'}</span>
                                    </div>
                                </div>
                            </Box>
                        </AccordionDetails>
                    </Accordion>
                </TableCell>
            </TableRow>
        );
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
            <Box sx={{ margin: "16px" }}>
                <div className={styles.detail_item} style={{ flexDirection: "column" }}>
                    {/* Timeline Section */}
                    <div style={{ 
                        width: "100%",
                        marginBottom: "16px"
                    }}>
                        <TransactionTimeline
                            transactions={ritual.transactions}
                            network={ritual.network}
                        />
                    </div>
                    
                    {/* Stats Boxes Section */}
                    <div style={{ 
                        width: "100%", 
                        display: "flex",
                        flexWrap: "wrap",
                        gap: "8px",
                        margin: "-4px",
                        marginBottom: "16px"
                    }}>
                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "0 0 200px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>DKG ID</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: "500", lineHeight: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{ritual.id}</div>
                        </Box>

                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "0 0 240px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Status</div>
                            <div style={{ fontSize: "1.75rem", fontWeight: "500", lineHeight: 1.2, flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", color: getColorByStatus(ritual.status) }}>{ritual.status}</div>
                        </Box>

                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "0 0 200px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Threshold</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: "500", lineHeight: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{ritual.threshold}</div>
                        </Box>

                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "0 0 200px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.5px" }}>DKG Size</div>
                            <div style={{ fontSize: "2.5rem", fontWeight: "500", lineHeight: 1, flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>{ritual.dkgSize}</div>
                        </Box>

                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "1 1 400px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Public Key</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "500", display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
                                <span style={{ flex: "1 1 auto" }}>{ritual.publicKey}</span>
                                <Copy
                                    style={{ cursor: "pointer", flexShrink: 0 }}
                                    onClick={(e) => copyToClipBoard(ritual.publicKey)}
                                />
                            </div>
                        </Box>

                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "1 1 400px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Initiator</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "400", display: "flex", alignItems: "center", padding: "8px 0", flex: 1 }}>
                                <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getPolygonScanAddressLink() + ritual.initiator}
                                    className={styles.link}
                                    sx={{ flex: "1 1 auto" }}
                                >
                                    {ritual.initiator}
                                    <ShareLink style={{ marginLeft: "4px", flexShrink: 0 }}/>
                                </Link>
                                <Copy
                                    style={{ cursor: "pointer", marginLeft: "4px", flexShrink: 0 }}
                                    onClick={(e) => copyToClipBoard(ritual.initiator)}
                                />
                            </div>
                        </Box>

                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "1 1 400px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Authority</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "400", display: "flex", alignItems: "center", padding: "8px 0", flex: 1 }}>
                                <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getPolygonScanAddressLink() + ritual.authority}
                                    className={styles.link}
                                    sx={{ flex: "1 1 auto" }}
                                >
                                    {ritual.authority}
                                    <ShareLink style={{ marginLeft: "4px", flexShrink: 0 }}/>
                                </Link>
                                <Copy
                                    style={{ cursor: "pointer", marginLeft: "4px", flexShrink: 0 }}
                                    onClick={(e) => copyToClipBoard(ritual.authority)}
                                />
                            </div>
                        </Box>

                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "1 1 400px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Access Controller</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "400", display: "flex", alignItems: "center", padding: "8px 0", flex: 1 }}>
                                <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getPolygonScanAddressLink() + ritual.accessController}
                                    className={styles.link}
                                    sx={{ flex: "1 1 auto" }}
                                >
                                    {ritual.accessController}
                                    <ShareLink style={{ marginLeft: "4px", flexShrink: 0 }}/>
                                </Link>
                                <Copy
                                    style={{ cursor: "pointer", marginLeft: "4px", flexShrink: 0 }}
                                    onClick={(e) => copyToClipBoard(ritual.accessController)}
                                />
                            </div>
                        </Box>

                        <Box sx={{
                            padding: "12px",
                            margin: "4px",
                            backgroundColor: "white",
                            borderRadius: "12px",
                            boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                            display: "flex",
                            flexDirection: "column",
                            height: "80px",
                            flex: "1 1 400px"
                        }}>
                            <div style={{ fontSize: "0.75rem", color: "rgba(0,0,0,0.6)", marginBottom: "2px", textTransform: "uppercase", letterSpacing: "0.5px" }}>Fee Model</div>
                            <div style={{ fontSize: "1.1rem", fontWeight: "400", display: "flex", alignItems: "center", padding: "8px 0", flex: 1 }}>
                                <Link
                                    target="_blank"
                                    underline="hover"
                                    href={Utils.getPolygonScanAddressLink() + ritual.feeModel}
                                    className={styles.link}
                                    sx={{ flex: "1 1 auto" }}
                                >
                                    {ritual.feeModel}
                                    <ShareLink style={{ marginLeft: "4px", flexShrink: 0 }}/>
                                </Link>
                                <Copy
                                    style={{ cursor: "pointer", marginLeft: "4px", flexShrink: 0 }}
                                    onClick={(e) => copyToClipBoard(ritual.feeModel)}
                                />
                            </div>
                        </Box>
                    </div>

                    {/* Participants Table Section */}
                    <Box sx={{
                        width: "100%",
                        padding: "20px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}>
                        <div style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.6)", marginBottom: "12px" }}>Participants ({ritual.participants.length})</div>
                        <TableContainer sx={{ width: '100%' }}>
                            <Table sx={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="35%" sx={{ 
                                            color: 'rgba(0,0,0,0.6)', 
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.12)'
                                        }}>Node Address</TableCell>
                                        <TableCell width="35%" sx={{ 
                                            color: 'rgba(0,0,0,0.6)', 
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.12)'
                                        }}>Operator Address</TableCell>
                                        <TableCell width="15%" align="center" sx={{ 
                                            color: 'rgba(0,0,0,0.6)', 
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.12)'
                                        }}>Transcript</TableCell>
                                        <TableCell width="15%" align="center" sx={{ 
                                            color: 'rgba(0,0,0,0.6)', 
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.12)'
                                        }}>Aggregation</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {ritual.participants.map((participant, index) => (
                                        <ParticipantRow key={participant} participant={participant} ritual={ritual} />
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                </div>
            </Box>
        </div>
    );
};

export default RitualDetailPage; 