import React, { useState, useEffect } from "react";
import * as Data from "../data";
import styles from "./styles.module.css";
import { ReactComponent as Copy } from "../../assets/copy.svg";
import { ReactComponent as ShareLink } from "../../assets/link.svg";
import TransactionTimeline from "../../components/table/timeline";
import { RitualManagement } from "../../components/RitualManagement";
import * as Utils from "../../utils/utils";
import Loader from "../../components/loader";
import { getColorByStatus } from "../../components/table/view_utils";
import {
  Link,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableRow,
  Box,
  Paper,
  TableHead,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ExpandMoreIcon,
  CheckCircleIcon,
  PendingIcon,
  ErrorIcon
} from "../../components/ui";

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
            if (isSubmitted) return <CheckCircleIcon style={{ color: "#4CAF50", fontSize: "1.2rem" }} />;
            if (isPending) return <PendingIcon style={{ color: "#FF9800", fontSize: "1.2rem" }} />;
            return <ErrorIcon style={{ color: "#F44336", fontSize: "1.2rem" }} />;
        };

        return (
            <TableRow>
                <TableCell colSpan={4} style={{ padding: 0, border: 'none' }}>
                    <Accordion style={{ 
                        boxShadow: 'none',
                        backgroundColor: 'transparent',
                        width: '100%',
                        margin: '0'
                    }}>
                        <AccordionSummary 
                            expandIcon={<ExpandMoreIcon />}
                            style={{ 
                                padding: 0
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
                                        style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
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
                                                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
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
                        <AccordionDetails style={{ padding: '0 16px 16px' }}>
                            <Box style={{ 
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
            <Box style={{ margin: "16px" }}>
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
                        <Box style={{
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

                        <Box style={{
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

                        <Box style={{
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

                        <Box style={{
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

                        <Box style={{
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

                        <Box style={{
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
                                    style={{ flex: "1 1 auto" }}
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

                        <Box style={{
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
                                    style={{ flex: "1 1 auto" }}
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

                        <Box style={{
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
                                    style={{ flex: "1 1 auto" }}
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

                        <Box style={{
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
                                    style={{ flex: "1 1 auto" }}
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

                    {/* Management Section */}
                    <RitualManagement ritual={ritual} feeModelAddress={ritual.feeModel} />

                    {/* Participants Table Section */}
                    <Box style={{
                        width: "100%",
                        padding: "20px",
                        backgroundColor: "white",
                        borderRadius: "8px",
                        boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
                    }}>
                        <div style={{ fontSize: "0.875rem", color: "rgba(0,0,0,0.6)", marginBottom: "12px" }}>Participants ({ritual.participants.length})</div>
                        <TableContainer style={{ width: '100%' }}>
                            <Table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0 }}>
                                <TableHead>
                                    <TableRow>
                                        <TableCell width="35%" style={{ 
                                            color: 'rgba(0,0,0,0.6)', 
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.12)'
                                        }}>Node Address</TableCell>
                                        <TableCell width="35%" style={{ 
                                            color: 'rgba(0,0,0,0.6)', 
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.12)'
                                        }}>Operator Address</TableCell>
                                        <TableCell width="15%" align="center" style={{ 
                                            color: 'rgba(0,0,0,0.6)', 
                                            fontSize: '0.75rem',
                                            textTransform: 'uppercase',
                                            letterSpacing: '0.5px',
                                            padding: '12px 16px',
                                            borderBottom: '1px solid rgba(0,0,0,0.12)'
                                        }}>Transcript</TableCell>
                                        <TableCell width="15%" align="center" style={{ 
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