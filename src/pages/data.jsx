import * as client from "../../.graphclient";
import * as Const from "../utils/Cons";
import moment from "moment";
import Web3 from "web3";

const tacoAddr = "0x347cc7ede7e5517bd47d20620b2cf1b406edcf07"
export const ritual_columns = [
  {
    header: "Id",
    accessor: "id",
    numeric: true,
  },
  {
    header: "Updated",
    accessor: "updateTime",
    numeric: false,
  },
  {
    header: "Authority",
    accessor: "authority",
    numeric: false,
  },
  {
    header: "Participants",
    accessor: "totalParticipants",
    numeric: true,
  },
  {
    header: "Transcripts",
    accessor: "totalPostedTranscripts",
    numeric: true,
  },
  {
    header: "Aggregations",
    accessor: "totalPostedAggregations",
    numeric: true,
  },
  {
    header: "Current State",
    accessor: "status",
    numeric: false,
  },
];

export const staker_columns = [
  {
    header: "Staking Provider",
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
  return parseFloat(value / Const.DECIMAL_ETH).toFixed(0);
};

export const formatWeiDecimal = (value) => {
  return new Intl.NumberFormat().format(formatGweiFixedZero(value));
};

export const formatWeiDecimalNoSurplus = (value) => {
  return new Intl.NumberFormat().format(
    parseFloat(value / Const.DECIMAL_ETH).toFixed(0)
  );
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

export const formatStakers = (rawData) => {
  const stakers = rawData.map((item) => ({
    id: item.id.split('-')[0],
    registeredOperatorAddress: item.tacoOperator?.operator,
    isOperatorConfirmed: item.tacoOperator?.confirmed,
    isAuthorized: parseFloat(item.amount) > 0,
    authorizedAmount: parseFloat(item.amount),
    stakedAmount: parseFloat(item.stake?.stakedAmount),
    bondedAt: item.tacoOperator?.bondedTimestamp * 1000,
  }))

  const statsRecord = {
    numBondedOperators: 0,
    totalAuthorizedAmount: 0,
    totalStaked: 0,
  };

  stakers.forEach((staker) => {
    if (staker.isOperatorConfirmed) {
      statsRecord.numBondedOperators += 1;
    }
    statsRecord.totalAuthorizedAmount += staker.authorizedAmount;
    statsRecord.totalStaked += staker.stakedAmount;
  });

  return { stakers, statsRecord };
};

export const formatStakerDetail = (rawData) => {
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

  return {
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
};

export const formatUserDetail = (user) => ({
  rituals: formatRitualsData(user.rituals)
});

export const getRituals = async (isSearch, searchInput) => {
    const emptyData = JSON.parse(`[]`);
    try {
        let data;
        if (!isSearch) {
            data = await client.execute(client.GetAllRitualsQueryDocument, {});
        } else {
            const fundingTxHashHex = convertToLittleEndian(searchInput.toLowerCase());
            data = await client.execute(client.GetRitualsQueryByUserDocument, {
                authority: searchInput.toLowerCase(),
                id: searchInput.toLowerCase(),
                txHash: fundingTxHashHex,
            });
        }
        
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

export const getStakers = async (isSearch, searchInput) => {
  const emptyData = JSON.parse(`[]`);
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
    return data.data;
  } catch (e) {
    console.log("error to fetch stakers data " + e);
  }
  return emptyData;
};

export const getStakerDetail = async (staker) => {
  const emptyData = JSON.parse(`[]`);  
  try {
    const data = await client.execute(client.StakerDetailDocument, {
      id: `${staker}-${tacoAddr}`
    });

    if (data.data !== undefined) {
      return data.data;
    }
  } catch (e) {
    console.log("error to fetch staking provider data " + e);
  }
  return emptyData;
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

export const getTimeout = async () => {
  if (Const.DEFAULT_NETWORK === Const.NETWORK_TESTNET) return 0;

  const web3 = new Web3(Const.RPC_ETH_POLYGON);
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
