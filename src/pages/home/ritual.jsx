import React, {useState, useEffect} from "react";
import * as Data from "../data";
import RitualTable from "../../components/table/ritual";
import { StatsCard } from "../../components/ui";
import styles from './styles.module.css'

const RitualPage = ({network, isSearch, searchInput}) => {
    const [pageData, setPageData] = useState({
        rowData: [],
        isLoading: false,
        pageNumber: 1,
        ritualCounter: {}
    });

    useEffect(() => {
        setPageData((prevState) => ({
            ...prevState,
            rowData: [],
            ritualCounter: {},
            isLoading: true,
        }));

        Data.getRituals(isSearch, searchInput).then(async (info) => {
            if(info?.rituals === undefined){
                setPageData({
                    isLoading: false,
                    rowData: [],
                    ritualCounter: {},
                });
            } else {
                const timeout = await Data.getTimeout();
                setPageData({
                    isLoading: false,
                    rowData: Data.formatRitualsData(info.rituals, timeout),
                    ritualCounter: info?.ritualCounter
                });
            }

        });

    }, [network, isSearch]);


    return (
        <div>
            <div style={{ padding: "24px 40px" }}>
                {isSearch ? (
                    <h3 style={{ margin: 0, color: "#0A0A0A" }}>Search Results: {searchInput}</h3>
                ) : (
                    <h1 style={{ 
                        margin: 0, 
                        fontSize: "2.5rem", 
                        fontWeight: 700, 
                        color: "#0A0A0A",
                        marginBottom: "8px"
                    }}>
                        DKG Rituals
                    </h1>
                )}
            </div>
            
            <div style={{ 
                padding: "0 40px 24px 40px",
                display: "flex",
                gap: "16px",
                flexWrap: "wrap"
            }}>
                <StatsCard 
                    title="Total Rituals"
                    value={pageData.ritualCounter?.total || 0}
                    subtitle="rituals"
                    loading={pageData.isLoading}
                />
                <StatsCard 
                    title="Total DKG Rituals"
                    value={pageData.ritualCounter?.total || 0}
                    loading={pageData.isLoading}
                />
                <StatsCard 
                    title="Ended DKG Rituals"
                    value={pageData.ritualCounter?.successful || 0}
                    loading={pageData.isLoading}
                />
            </div>

            <div className={styles.table_content}>
                <RitualTable
                    columns={Data.ritual_columns}
                    data={pageData.rowData}
                    isLoading={pageData.isLoading}
                    network={network}
                />
            </div>
        </div>
    );
}

export default RitualPage;