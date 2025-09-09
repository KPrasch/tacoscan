import * as client from "../../.graphclient";
import * as Const from "../utils/Cons";
import moment from "moment";
import Web3 from "web3";
import { CoordinatorABI } from "../utils/abi";
import { CoordinatorAddress } from "../utils/addresses";
import web3Cache from "../utils/web3Cache";
import BatchProcessor from "../utils/batchProcessor";
import { getStakingProviderInfo } from "../utils/contractReader";

const tacoAddr = "0x347cc7ede7e5517bd47d20620b2cf1b406edcf07".toLowerCase()
export const ritual_columns = [
  {
    header: "ID",
    accessor: "id",
    numeric: true,
  },
  {
    header: "UPDATED",
    accessor: "updateTime",
    numeric: false,
  },
  {
    header: "AUTHORITY",
    accessor: "authority",
    numeric: false,
  },
  {
    header: "PARTICIPANTS",
    accessor: "totalParticipants",
    numeric: true,
  },
  {
    header: "TRANSCRIPTS",
    accessor: "totalPostedTranscripts",
    numeric: true,
  },
  {
    header: "AGGREGATIONS",
    accessor: "totalPostedAggregations",
    numeric: true,
  },
  {
    header: "CURRENT STATE",
    accessor: "status",
    numeric: false,
  },
];

export const node_columns = [
  {
    header: "Node Provider",
    accessor: "id",
    numeric: false,
  },
  {
    header: "Operator",
    accessor: "registeredOperatorAddress",
    numeric: false,
  },
  {
    header: "Authorized Stake",
    accessor: "authorizedAmount",
    numeric: true,
  },
  {
    header: "Amount Staked",
    accessor: "stakedAmount",
    numeric: true,
  },
  {
    header: "Confirmed",
    accessor: "isOperatorConfirmed",
    numeric: false,
  },
  {
    header: "Bonded At",
    accessor: "bondedAt",
    numeric: true,
  },
];

const COUNT_FORMATS = [
  {
    // 0 - 999
    letter: "",
    limit: 1e3,
  },
  {
    // 1,000 - 999,999
    letter: "K",
    limit: 1e6,
  },
  {
    // 1,000,000 - 999,999,999
    letter: "M",
    limit: 1e9,
  },
  {
    // 1,000,000,000 - 999,999,999,999
    letter: "B",
    limit: 1e12,
  },
];

export const formatString = (data) => {
  if (data == null) {
    return "Not yet finalized";
  }
  if (data.length < 10) {
    return data;
  }

  const fistSymbol = data.slice(0, 7);
  const endSymbol = data.slice(data.length - 7);
  return fistSymbol + " ... " + endSymbol;
};

export const formatStringEnd = (data) => {
  if (data == null) {
    return "...";
  }
  if (data.length < 10) {
    return data;
  }

  const fistSymbol = data.slice(0, 10);
  return fistSymbol + " ... ";
};

export const formatSatoshi = (data) => {
  return (data / Const.SATOSHI_BITCOIN).toFixed(7);
};

export const formatGwei = (value) => {
  return parseFloat(value / Const.DECIMAL_ETH).toFixed(7);
};

export const formatGweiFixedZero = (value) => {
  // Handle null/undefined
  if (!value) return "0";
  
  // Convert to string if not already
  const valueStr = value.toString();
  
  // For very large numbers, use BigInt for accurate division
  try {
    const valueBigInt = BigInt(valueStr);
    const decimalBigInt = BigInt(Const.DECIMAL_ETH);
    const result = valueBigInt / decimalBigInt;
    return result.toString();
  } catch (e) {
    // Fallback for non-integer values
    return parseFloat(value / Const.DECIMAL_ETH).toFixed(0);
  }
};

export const formatWeiDecimal = (value) => {
  return new Intl.NumberFormat().format(formatGweiFixedZero(value));
};

export const formatWeiDecimalNoSurplus = (value) => {
  // Handle null/undefined
  if (!value) return "0";
  
  // Convert to string if not already
  const valueStr = value.toString();
  
  // For very large numbers, use BigInt for accurate division
  try {
    const valueBigInt = BigInt(valueStr);
    const decimalBigInt = BigInt(Const.DECIMAL_ETH);
    const result = valueBigInt / decimalBigInt;
    return new Intl.NumberFormat().format(result.toString());
  } catch (e) {
    // Fallback for non-integer values
    return new Intl.NumberFormat().format(
      parseFloat(value / Const.DECIMAL_ETH).toFixed(0)
    );
  }
};

export const formatNumberToDecimal = (value) => {
  return new Intl.NumberFormat().format(value);
};

export const formatNumber = (value) => {
  let newValue = value / Const.DECIMAL_ETH;
  const format = COUNT_FORMATS.find((format) => newValue < format.limit);
  newValue = (1000 * newValue) / format.limit;
  newValue = Math.round(newValue * 10) / 10;
  return newValue + format.letter;
};

export function formatTimeToText(timestamp) {
  if (timestamp == 0) return "Didn't staked";
  const date = moment.duration(
    moment(new Date().getTime()).diff(moment(timestamp))
  );
  const day = date.days();
  const month = date.months();
  const year = date.years();
  const hour = date.hours();
  const minute = date.minutes();
  const second = date.seconds();

  if (year > 0) {
    if (year == 1) {
      return year + " year ago";
    } else {
      return year + " years ago";
    }
  } else if (month > 0) {
    if (month == 1) {
      return month + " month ago";
    } else {
      return month + " months ago";
    }
  } else if (day > 0) {
    if (day == 1) {
      return day + " day ago";
    } else {
      return day + " days ago";
    }
  } else if (hour > 0) {
    if (hour == 1) {
      return hour + " hour ago";
    } else {
      return hour + " hours ago";
    }
  } else if (minute > 0) {
    if (minute == 1) {
      return minute + " minute ago";
    } else {
      return minute + " minutes ago";
    }
  } else {
    if (second == 1) {
      return second + " second ago";
    } else {
      return second + " seconds ago";
    }
  }
}

export function formatTimestampToText(date) {
  const month = date.months();
  let day = date.days();
  const hours = date.hours();
  const minutes = date.minutes();
  if (month > 0) {
    day = day + month * 30;
  }
  if (day > 0) {
    return `${day < 10 ? "0" + day : day}d ${
      hours < 10 ? "0" + hours : hours
    }h ago`;
  } else {
    return `${hours < 10 ? "0" + hours : hours}h ${
      minutes < 10 ? "0" + minutes : minutes
    }m ago`;
  }
}

export function formatEntryDate(date) {
  const month = date.months();
  let day = date.days();
  const hours = date.hours();
  const minutes = date.minutes();
  const seconds = date.seconds();
  if (month > 0) {
    day = day + month * 30;
  }
  if (day > 0) {
    return `${day < 10 ? "0" + day : day}d ${
      hours < 10 ? "0" + hours : hours
    }h`;
  } else if (hours > 0) {
    return `${hours < 10 ? "0" + hours : hours}h ${
      minutes < 10 ? "0" + minutes : minutes
    }m`;
  } else if (minutes > 0) {
    return `${minutes < 10 ? "0" + minutes : minutes}m`;
  } else if (seconds > 0) {
    return `${seconds < 10 ? "0" + seconds : seconds}s`;
  }
}

export function formatDate(date) {
  return new Date(date).toLocaleString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export const calculateTimeMoment = (timestamp) => {
  return formatTimestampToText(
    moment.duration(moment(new Date().getTime()).diff(moment(timestamp)))
  );
};

// const calculateTreasuryFee = (treasuryFee) => (1 / treasuryFee) * 100;
// const calculateTxMaxFee = (txMaxFee) => txMaxFee / Const.SATOSHI_BITCOIN;

function convertFromLittleEndian(hex) {
  try {
    if (hex == null) return "...";
    hex = hex.replace("0x", "");
    hex = hex.padStart(8, "0");
    let littleEndianHex = "";
    for (let i = hex.length - 2; i >= 0; i -= 2) {
      littleEndianHex += hex.slice(i, i + 2);
    }
    return "0x" + littleEndianHex;
  } catch (e) {
    console.log(e);
  }
}

export function convertToLittleEndian(txHash) {
  try {
    if (txHash === undefined) {
      return "";
    }
    txHash = txHash.replace("0x", "");
    const chunks = txHash.match(/.{2}/g).reverse();
    const littleEndianHex = chunks.join("");
    return "0x" + littleEndianHex;
  } catch (e) {
    console.log(e);
  }
  return "";
}

export const formatRitualsData = (rawData, timeout) => {
  if (rawData === undefined) {
    return [];
  }

  const timeoutMs = parseFloat(timeout) * 1000;

  return rawData
    .map((ritual) => {
      // Calculate status
      const currentTimestampMs = Date.now();
      const initTimeStampMs = ritual.initTimestamp * 1000;
      const timeoutStamp = initTimeStampMs + timeoutMs;
      
      let status = ritual.dkgStatus.replaceAll("_", " ");
      
      if ((ritual.dkgStatus === "DKG_AWAITING_AGGREGATIONS" || 
           ritual.dkStatus === "DKG_AWAITING_TRANSCRIPTS") && 
          timeoutStamp < currentTimestampMs) {
        status = "TIME OUT";
      }

      return {
        id: ritual.id,
        status: status,
        initiator: ritual.initiator,
        authority: ritual.authority,
        aggregations: ritual.postedAggregations,
        transcripts: ritual.postedTranscripts,
        participants: ritual.participants,
        publicKey: ritual.publicKey,
        initTimeStamp: ritual.initTimestamp * 1000,
        endTimeStamp: ritual.endTimestamp * 1000,
        threshold: ritual.threshold,
        dkgSize: ritual.dkgSize,
        accessController: ritual.accessController,
        feeModel: ritual.feeModel,
        transactions: ritual.transactions,
        updateTime: ritual.transactions[ritual.transactions.length - 1].timestamp * 1000,
        totalParticipants: ritual.participants.length,
        totalPostedAggregations: ritual.postedAggregations.length,
        totalPostedTranscripts: ritual.postedTranscripts.length,
        pendingTranscripts: ritual.participants.filter(
          (participant) => !ritual.postedTranscripts.includes(participant)
        ),
        pendingAggregations: ritual.participants.filter(
          (participant) => !ritual.postedAggregations.includes(participant)
        ),
        operatorAddresses: ritual.operatorAddresses || {} // Preserve operator addresses
      };
    })
    .sort((a, b) => b.id - a.id);
};

export const formatNodes = (rawData) => {
  // Handle null or undefined data
  if (!rawData || !Array.isArray(rawData)) {
    return {
      nodes: [],
      statsRecord: {
        numBondedOperators: 0,
        totalAuthorizedAmount: 0,
        totalStaked: 0,
      }
    };
  }

  const nodes = rawData.map((item) => ({
    id: item.id.split('-')[0],
    registeredOperatorAddress: item.tacoOperator?.operator,
    isOperatorConfirmed: item.tacoOperator?.confirmed,
    isAuthorized: parseFloat(item.amount) > 0,
    authorizedAmount: parseFloat(item.amount) || 0,
    stakedAmount: parseFloat(item.stake?.stakedAmount) || 0,
    bondedAt: item.tacoOperator?.bondedTimestamp * 1000,
  }))

  const statsRecord = {
    numBondedOperators: 0,
    totalAuthorizedAmount: 0,
    totalStaked: 0,
  };

  nodes.forEach((node) => {
    if (node.isOperatorConfirmed) {
      statsRecord.numBondedOperators += 1;
    }
    statsRecord.totalAuthorizedAmount += node.authorizedAmount;
    statsRecord.totalStaked += node.stakedAmount;
  });

  return { nodes, statsRecord };
};

export const formatNodeDetail = (rawData) => {
  console.log("formatNodeDetail input:", rawData);
  
  // Handle null or missing appAuthorization
  if (!rawData || !rawData.appAuthorization) {
    console.log("No appAuthorization found, returning empty data");
    return {
      id: null,
      registeredOperatorAddress: null,
      isOperatorConfirmed: false,
      isAuthorized: false,
      weiDecimalAuthorizedAmount: "0",
      parsedAuthorizedAmount: 0,
      weiDecimalDeauthorizingAmount: "0",
      weiDecimalStakedAmount: "0",
      parsedStakedAmount: 0,
      bondedAt: null,
      stakedAt: null,
      owner: null,
      authorizer: null,
      beneficiary: null,
      appAuthorization: null,
      events: []
    };
  }
  
  const appAuthorization = rawData.appAuthorization;

  const getFirstStakedAt = (stakeHistory) => {
    const stakedEvents = stakeHistory.filter(event => event.eventType === 'Staked');
    if (stakedEvents.length > 0) {
      const firstStakedEvent = stakedEvents.reduce((earliest, current) => {
        return earliest.timestamp < current.timestamp ? earliest : current;
      });
      return firstStakedEvent.timestamp;
    }
    return null;
  };

  const firstStakedAt = appAuthorization.stake?.stakeHistory 
    ? getFirstStakedAt(appAuthorization.stake?.stakeHistory) * 1000 
    : null;

  const mergeAndSortEvents = (stakeHistory, appAuthHistories, tacoOperator) => {
    const combinedEvents = [...stakeHistory, ...appAuthHistories].map(event => ({
      blockNumber: event.blockNumber,
      eventType: event.eventType,
      timestamp: event.timestamp * 1000,
      weiDecimalEventAmount: formatWeiDecimal(event.eventAmount || event.amount),
      parsedEventAmount: parseFloat(event.eventAmount || event.amount),
    }));

    if (tacoOperator?.bondedTimestamp) {
      combinedEvents.push({
        blockNumber: null,
        eventType: 'BondedOperator',
        timestamp: tacoOperator.bondedTimestamp * 1000,
        weiDecimalEventAmount: null,
        parsedEventAmount: null,
      });
    }
    
    combinedEvents.sort((a, b) => b.timestamp - a.timestamp);
    return combinedEvents;
  };

  const events = mergeAndSortEvents(
    appAuthorization.stake?.stakeHistory || [], 
    rawData.appAuthHistories || [], 
    appAuthorization.tacoOperator || {}
  );

  const result = {
    id: appAuthorization.id?.split('-')[0],
    registeredOperatorAddress: appAuthorization.tacoOperator?.operator,
    isOperatorConfirmed: appAuthorization.tacoOperator?.confirmed,
    isAuthorized: parseFloat(appAuthorization.amount) > 0,
    weiDecimalAuthorizedAmount: formatWeiDecimal(appAuthorization.amount),
    parsedAuthorizedAmount: parseFloat(appAuthorization.amount),
    weiDecimalDeauthorizingAmount: formatWeiDecimal(appAuthorization.amountDeauthorizing),
    weiDecimalStakedAmount: formatWeiDecimal(appAuthorization.stake?.stakedAmount),
    parsedStakedAmount: parseFloat(appAuthorization.stake?.stakedAmount),
    bondedAt: appAuthorization.tacoOperator?.bondedTimestamp * 1000,
    stakedAt: firstStakedAt,
    owner: appAuthorization.stake?.owner?.id,
    authorizer: appAuthorization.stake?.authorizer,
    beneficiary: appAuthorization.stake?.beneficiary,
    events: events,
  };
  
  console.log("formatNodeDetail result:", result);
  console.log("Authorized amount:", appAuthorization.amount, "->", result.weiDecimalAuthorizedAmount);
  console.log("Staked amount:", appAuthorization.stake?.stakedAmount, "->", result.weiDecimalStakedAmount);
  
  return result;
};

export const formatUserDetail = (user) => ({
  rituals: formatRitualsData(user.rituals)
});

// Helper function to retry GraphQL queries with exponential backoff
const retryQuery = async (queryFn, maxRetries = 3) => {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await queryFn();
            if (result.errors) {
                // Check if it's a network/fetch error vs a GraphQL schema error
                const hasNetworkError = result.errors.some(error => 
                    error.message.includes('Failed to fetch') || 
                    error.message.includes('Network error') ||
                    error.extensions?.code === 'NETWORK_ERROR'
                );
                
                if (hasNetworkError && attempt < maxRetries - 1) {
                    console.warn(`Network error detected, retrying... (${attempt + 1}/${maxRetries})`);
                    throw new Error(`Network error: ${result.errors[0].message}`);
                } else {
                    throw new Error(`GraphQL errors: ${JSON.stringify(result.errors)}`);
                }
            }
            return result;
        } catch (error) {
            console.warn(`Query attempt ${attempt + 1} failed:`, error.message);
            if (attempt === maxRetries - 1) throw error;
            // Exponential backoff: wait 1s, 2s, 4s
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
};

// Helper function to get all rituals data with pagination
const getAllRitualsWithPagination = async () => {
    const allRituals = [];
    let skip = 0;
    const pageSize = 1000;
    let hasMore = true;
    let ritualCounter = null;
    let pageCount = 0;
    let consecutiveFailures = 0;
    const maxConsecutiveFailures = 3;
    
    console.log('🌮 Starting paginated ritual fetch...');
    
    while (hasMore && consecutiveFailures < maxConsecutiveFailures) {
        pageCount++;
        console.log(`📄 Fetching page ${pageCount} (skip: ${skip})`);
        
        try {
            const query = () => client.execute(client.GetAllRitualsQueryDocument, { skip });
            const data = await retryQuery(query, 2); // Fewer retries per page
            
            if (data.data) {
                const rituals = data.data.rituals || [];
                const pageRitualCounter = data.data.ritualCounter;
                
                // Store ritual counter from first page for total count
                if (!ritualCounter && pageRitualCounter) {
                    ritualCounter = pageRitualCounter;
                    const expectedTotal = ritualCounter.total ? parseInt(ritualCounter.total) : 0;
                    console.log(`📊 Expected total rituals: ${expectedTotal}`);
                }
                
                if (rituals.length > 0) {
                    // Remove duplicates by ID (just in case)
                    const existingIds = new Set(allRituals.map(r => r.id));
                    const newRituals = rituals.filter(r => !existingIds.has(r.id));
                    
                    allRituals.push(...newRituals);
                    console.log(`✅ Page ${pageCount}: Added ${newRituals.length} new rituals (total: ${allRituals.length})`);
                    
                    // Check if we actually added new rituals
                    if (newRituals.length === 0) {
                        // No new rituals added, we've reached the end
                        console.log('📊 No new unique rituals found, ending pagination');
                        hasMore = false;
                    } else {
                        skip += pageSize;
                        consecutiveFailures = 0; // Reset failure counter on success
                        
                        // If we got less than pageSize, we've reached the end
                        hasMore = rituals.length === pageSize;
                        
                        // Also check against expected total if available
                        if (ritualCounter?.total && allRituals.length >= parseInt(ritualCounter.total)) {
                            console.log(`📊 Reached expected total of ${ritualCounter.total} rituals`);
                            hasMore = false;
                        }
                    }
                    
                    // Progress indicator
                    if (ritualCounter?.total) {
                        const progress = Math.min(100, (allRituals.length / parseInt(ritualCounter.total)) * 100);
                        console.log(`📈 Progress: ${progress.toFixed(1)}% (${allRituals.length}/${ritualCounter.total})`);
                    }
                    
                    // Safety check to prevent infinite loops
                    if (allRituals.length >= 5000) {
                        console.warn('⚠️ Reached safety limit of 5000 rituals');
                        hasMore = false;
                    }
                } else {
                    console.log('📋 No more rituals found, ending pagination');
                    hasMore = false;
                }
            } else {
                console.warn('❌ No data returned, ending pagination');
                hasMore = false;
            }
            
            // Small delay between successful requests
            if (hasMore) {
                await new Promise(resolve => setTimeout(resolve, 200));
            }
            
        } catch (error) {
            consecutiveFailures++;
            console.error(`❌ Page ${pageCount} failed (${consecutiveFailures}/${maxConsecutiveFailures}):`, error.message);
            
            if (consecutiveFailures >= maxConsecutiveFailures) {
                console.error('💥 Too many consecutive failures, stopping pagination');
                throw new Error(`Pagination failed after ${maxConsecutiveFailures} consecutive failures: ${error.message}`);
            }
            
            // Wait longer before retrying after failure
            await new Promise(resolve => setTimeout(resolve, 2000 * consecutiveFailures));
        }
    }
    
    console.log(`🎉 Pagination complete! Total rituals fetched: ${allRituals.length}`);
    
    // If we got some data but not all, still return what we have
    return {
        rituals: allRituals,
        ritualCounter: ritualCounter
    };
};

export const getRituals = async (isSearch, searchInput) => {
    const emptyData = { rituals: [] };
    try {
        let data;
        if (!isSearch) {
            // Try paginated fetch first, fallback to single query if it fails
            console.log('Fetching all rituals with pagination...');
            try {
                const ritualsData = await getAllRitualsWithPagination();
                data = { data: ritualsData };
            } catch (paginationError) {
                console.warn('Pagination failed, falling back to single query:', paginationError.message);
                // Fallback to original single query without pagination
                const fallbackQuery = () => client.execute(client.GetAllRitualsQueryDocument, { skip: 0 });
                data = await retryQuery(fallbackQuery, 2); // Fewer retries for fallback
            }
        } else {
            const fundingTxHashHex = convertToLittleEndian(searchInput.toLowerCase());
            data = await retryQuery(() => client.execute(client.GetRitualsQueryByUserDocument, {
                authority: searchInput.toLowerCase(),
                id: searchInput.toLowerCase(),
                txHash: fundingTxHashHex,
            }));
        }
        
        console.log("GraphQL Response:", data);
        
        // Check for GraphQL errors
        if (data.errors) {
            console.error("GraphQL errors:", data.errors);
            return emptyData;
        }
        
        if (data.data !== undefined && data.data !== null) {
            // Fetch operator addresses for all participants
            const stakersData = await client.execute(client.GetAllStakersQueryDocument, {});
            const operatorMap = {};
            
            if (stakersData.data?.appAuthorizations) {
                stakersData.data.appAuthorizations.forEach(auth => {
                    if (auth.tacoOperator) {
                        const stakerId = auth.id.split('-')[0].toLowerCase();
                        operatorMap[stakerId] = {
                            operator: auth.tacoOperator.operator,
                            confirmed: auth.tacoOperator.confirmed
                        };
                    }
                });
            }
            
            // Add operatorMap to each ritual WITHOUT fetching feeModel
            // feeModel will be fetched on-demand when ritual details are expanded
            if (data.data.rituals) {
                data.data.rituals = data.data.rituals.map(ritual => ({
                    ...ritual,
                    feeModel: null, // Will be fetched lazily when needed
                    operatorAddresses: ritual.participants.reduce((acc, participant) => {
                        const operatorInfo = operatorMap[participant.toLowerCase()];
                        acc[participant] = operatorInfo && operatorInfo.confirmed ? operatorInfo.operator : "-";
                        return acc;
                    }, {})
                }));
            }
            
            return data.data;
        }
    } catch (e) {
        console.error("error to fetch ritual data:", e);
        // Return empty but properly structured data to prevent null reference errors
        return emptyData;
    }
    return emptyData;
};

export const getRitualsByStakingProvider = async (searchInput) => {
  const emptyData = JSON.parse(`[]`);
  try {
    let data;
    data = await client.execute(client.GetRitualsQueryByStakingProviderDocument, {
      id: searchInput.toLowerCase(),
    });

    if (data.data !== undefined) {
      // Fetch operator addresses for all participants
      const stakersData = await client.execute(client.GetAllStakersQueryDocument, {});
      const operatorMap = {};
      
      if (stakersData.data?.appAuthorizations) {
        stakersData.data.appAuthorizations.forEach(auth => {
          if (auth.tacoOperator) {
            const stakerId = auth.id.split('-')[0].toLowerCase();
            operatorMap[stakerId] = {
              operator: auth.tacoOperator.operator,
              confirmed: auth.tacoOperator.confirmed
            };
          }
        });
      }
      
      // Add operatorMap to each ritual
      if (data.data.rituals) {
        data.data.rituals = data.data.rituals.map(ritual => ({
          ...ritual,
          operatorAddresses: ritual.participants.reduce((acc, participant) => {
            const operatorInfo = operatorMap[participant.toLowerCase()];
            acc[participant] = operatorInfo && operatorInfo.confirmed ? operatorInfo.operator : "-";
            return acc;
          }, {})
        }));
      }

      return data.data;
    }
  } catch (e) {
    console.log("error to fetch ritual data " + e);
  }
  return emptyData;
};

export const getNodes = async (isSearch, searchInput) => {
  const emptyData = { appAuthorizations: [] };
  try {
    let data;
    if (!isSearch) {
      data = await client.execute(client.GetAllStakersQueryDocument, {});
    } else {
      data = await client.execute(client.SearchStakersDocument, {
        id: `${searchInput.toLowerCase()}-${tacoAddr}`,
        address: searchInput.toLowerCase(),
      });
    }
    console.log("data: ", data)
    
    // Check if data is valid before returning
    if (data && data.data && !data.errors) {
      return data.data;
    } else if (data && data.errors) {
      console.error("GraphQL errors:", data.errors);
    }
  } catch (e) {
    console.log("error to fetch stakers data " + e);
  }
  return emptyData;
};

export const getNodeDetail = async (node) => {
  try {
    // First try to get data from subgraph
    const nodeAddress = node.toLowerCase();
    const appAddress = tacoAddr;
    const queryId = `${nodeAddress}-${appAddress}`;
    
    console.log("Fetching node detail for ID:", queryId);
    
    const data = await client.execute(client.StakerDetailDocument, {
      id: queryId
    });

    console.log("Node detail response:", data);
    
    if (data?.data?.appAuthorization) {
      return data.data;
    }
    
    // If not found in subgraph, read directly from contract
    console.log("Node not found in subgraph, reading from contract...");
    const contractInfo = await getStakingProviderInfo(node, 'mainnet');
    
    if (contractInfo) {
      // Format contract data to match subgraph structure
      return {
        appAuthorization: {
          id: queryId,
          amount: contractInfo.authorized,
          amountDeauthorizing: contractInfo.deauthorizing,
          appAddress: tacoAddr,
          appName: "TACo",
          stake: {
            id: nodeAddress,
            stakedAmount: contractInfo.authorized, // Use authorized as proxy for staked
            owner: { id: nodeAddress },
            authorizer: nodeAddress,
            beneficiary: nodeAddress,
            stakeHistory: []
          },
          tacoOperator: contractInfo.operator !== '0x0000000000000000000000000000000000000000' ? {
            id: contractInfo.operator,
            operator: contractInfo.operator,
            confirmed: contractInfo.operatorConfirmed,
            bondedTimestamp: contractInfo.operatorStartTimestamp,
            bondedTimestampFirstOperator: contractInfo.operatorStartTimestamp
          } : null
        },
        appAuthHistories: []
      };
    }
  } catch (e) {
    console.log("error to fetch staking provider data " + e);
  }
  
  return { appAuthorization: null, appAuthHistories: [] };
};

export const getUserDetail = async (userAddress) => {
  const emptyData = JSON.parse(`[]`);
  try {
    let data;
    data = await client.execute(client.GetRitualsQueryByUserDocument, {
      authority: userAddress,
    });

    if (data.data !== undefined) {
      return data.data;
    }
  } catch (e) {
    console.log("error to fetch user data " + e);
  }
  return emptyData;
};

export const getCurrentBlockNumber = async () => {
  try {
    const response = await fetch(
      Const.DEFAULT_NETWORK === Const.NETWORK_MAINNET
        ? Const.RPC_ETH_MAINNET
        : Const.RPC_ETH_GOERLI,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          method: "eth_blockNumber",
          params: [],
          id: 1,
        }),
      }
    );
    const dataJson = await response.json();
    return parseInt(dataJson.result, 16);
  } catch (e) {
    return "ERROR";
  }
};

export const getBalanceOfAddress = async (address) => {
  try {
    if (address === Const.ADDRESS_ZERO) {
      return 0;
    }
    let rpc = Const.MAINNET_API_BALANCE;
    if (Const.DEFAULT_NETWORK === Const.NETWORK_TESTNET) {
      rpc = Const.GOERLI_API_BALANCE;
    }

    const response = await fetch(rpc + address);
    const data = await response.json();
    return parseFloat(parseFloat(data.result) / 1000000000000000000).toFixed(2);
  } catch (e) {
    console.log("fetch balance error : " + e.toString());
  }
  return 0;
};

// Singleton Web3 instance to reuse connection
let web3Instance = null;
const getWeb3Instance = () => {
  if (!web3Instance) {
    web3Instance = new Web3(Const.RPC_ETH_POLYGON);
  }
  return web3Instance;
};

export const getRitualFeeModel = async (ritualId) => {
  if (!ritualId || isNaN(ritualId)) {
    console.error(`Invalid ritual ID: ${ritualId}`);
    return null;
  }

  try {
    // Use cache with longer TTL for fee models
    return await web3Cache.get(
      `ritual-feeModel-${ritualId}`,
      async () => {
        const web3 = getWeb3Instance();
        const coordinatorContract = new web3.eth.Contract(
          CoordinatorABI,
          CoordinatorAddress
        );
        const ritualData = await coordinatorContract.methods.rituals(ritualId).call();
        return ritualData.feeModel;
      },
      3600000 // Cache for 1 hour
    );
  } catch (error) {
    console.error(`Failed to fetch feeModel for ritual ${ritualId}:`, error);
    return null;
  }
};

export const getTimeout = async () => {
  if (Const.DEFAULT_NETWORK === Const.NETWORK_TESTNET) return 0;

  // Use cache to prevent multiple calls
  return web3Cache.get('coordinator-timeout', async () => {
    const web3 = getWeb3Instance();
    const coordinator = "0xE74259e3dafe30bAA8700238e324b47aC98FE755";
    const contractAbi = [
      {
        type: "function",
        name: "timeout",
        stateMutability: "view",
        inputs: [],
        outputs: [
            {
                name: "",
                type: "uint32",
                internalType: "uint32"
            }
        ]
    },
    ];

    const contract = new web3.eth.Contract(contractAbi, coordinator);
    const timeout = await contract.methods
      .timeout()
      .call();
    return timeout;
  }, 300000); // Cache for 5 minutes
};

export const getTotalMerkleDropReward = async (address) => {
  try {
    if (Const.DEFAULT_NETWORK === Const.NETWORK_TESTNET) return 0;

    let tags = await (
      await fetch(
        `https://api.github.com/repos/threshold-network/token-dashboard/tags`
      )
    ).json();
    const latestTag = tags[0].name;
    const rewardsJsonUrl = `https://raw.githubusercontent.com/threshold-network/token-dashboard/${latestTag}/src/merkle-drop/rewards.json`;
    const data = await (await fetch(rewardsJsonUrl)).json();
    if (data != undefined && data.claims != undefined) {
      const key = Object.keys(data.claims).find(
        (k) => k.toLowerCase() === address.toLowerCase()
      );
      const amount = data.claims[key].amount;
      if (amount === undefined || amount === 0) return 0;
      return parseFloat(formatGwei(amount)).toFixed(1);
    }
  } catch (e) {
    console.log("get merkle drop reward error " + e.toString());
  }
  return 0;
};
