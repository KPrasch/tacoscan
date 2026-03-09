import Web3 from "web3";

// Coordinator contract ABI for the methods we need
const coordinatorAbi = [
  {
    "type": "function",
    "name": "timeout",
    "stateMutability": "view",
    "inputs": [],
    "outputs": [
      {
        "name": "",
        "type": "uint32",
        "internalType": "uint32"
      }
    ]
  },
  {
    "type": "function",
    "name": "rituals",
    "stateMutability": "view",
    "inputs": [
      {
        "name": "ritualId",
        "type": "uint256",
        "internalType": "uint256"
      }
    ],
    "outputs": [
      {
        "name": "initiator",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "initTimestamp",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "endTimestamp",
        "type": "uint32",
        "internalType": "uint32"
      },
      {
        "name": "totalTranscripts",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "totalAggregations",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "authority",
        "type": "address",
        "internalType": "address"
      },
      {
        "name": "dkgSize",
        "type": "uint16",
        "internalType": "uint16"
      },
      {
        "name": "threshold",
        "type": "uint16",
        "internalType": "uint16"
      }
    ]
  }
];

// Polygon RPC URL
const POLYGON_RPC_URL = 'https://polygon-rpc.com';

// Coordinator contract address on Polygon
const COORDINATOR_ADDRESS = '0xE74259e3dafe30bAA8700238e324b47aC98FE755';

/**
 * Check if a ritual has expired by reading from the Coordinator contract
 * @param {number} ritualId - The ritual ID to check
 * @returns {Promise<Object>} - Object containing expiration status and details
 */
export const checkRitualExpiration = async (ritualId) => {
  try {
    console.log(`Checking expiration status for ritual #${ritualId}...`);
    
    // Initialize Web3 with Polygon RPC
    const web3 = new Web3(POLYGON_RPC_URL);
    const contract = new web3.eth.Contract(coordinatorAbi, COORDINATOR_ADDRESS);
    
    // Read timeout value from contract
    console.log('Reading timeout value from Coordinator contract...');
    const timeout = await contract.methods.timeout().call();
    const timeoutSeconds = parseInt(timeout);
    console.log(`Contract timeout: ${timeoutSeconds} seconds (${timeoutSeconds / 3600} hours)`);
    
    // Read ritual details
    console.log(`Reading ritual #${ritualId} details...`);
    const ritual = await contract.methods.rituals(ritualId).call();
    
    const initTimestamp = parseInt(ritual.initTimestamp);
    const endTimestamp = parseInt(ritual.endTimestamp);
    
    console.log(`Ritual details:
      - Initiator: ${ritual.initiator}
      - Init timestamp: ${initTimestamp} (${new Date(initTimestamp * 1000).toISOString()})
      - End timestamp: ${endTimestamp} (${new Date(endTimestamp * 1000).toISOString()})
      - DKG size: ${ritual.dkgSize}
      - Threshold: ${ritual.threshold}
      - Authority: ${ritual.authority}
    `);
    
    // Calculate expiration
    const currentTime = Math.floor(Date.now() / 1000);
    const expirationTime = initTimestamp + timeoutSeconds;
    const isExpired = currentTime > expirationTime;
    const timeUntilExpiration = expirationTime - currentTime;
    
    const result = {
      ritualId,
      currentTime,
      currentTimeISO: new Date(currentTime * 1000).toISOString(),
      initTimestamp,
      initTimestampISO: new Date(initTimestamp * 1000).toISOString(),
      endTimestamp,
      endTimestampISO: new Date(endTimestamp * 1000).toISOString(),
      timeout: timeoutSeconds,
      expirationTime,
      expirationTimeISO: new Date(expirationTime * 1000).toISOString(),
      isExpired,
      timeUntilExpiration,
      timeUntilExpirationHours: timeUntilExpiration / 3600,
      ritual: {
        initiator: ritual.initiator,
        authority: ritual.authority,
        dkgSize: parseInt(ritual.dkgSize),
        threshold: parseInt(ritual.threshold),
        totalTranscripts: parseInt(ritual.totalTranscripts),
        totalAggregations: parseInt(ritual.totalAggregations)
      },
      calculation: `current time (${currentTime}) > init timestamp (${initTimestamp}) + timeout (${timeoutSeconds}) = ${expirationTime}`
    };
    
    console.log(`\n=== EXPIRATION CHECK RESULTS ===`);
    console.log(`Ritual #${ritualId} expiration status: ${isExpired ? 'EXPIRED' : 'NOT EXPIRED'}`);
    console.log(`Current time: ${result.currentTimeISO}`);
    console.log(`Ritual init time: ${result.initTimestampISO}`);
    console.log(`Expiration time: ${result.expirationTimeISO}`);
    
    if (isExpired) {
      const timeExpired = currentTime - expirationTime;
      console.log(`Time since expiration: ${timeExpired} seconds (${(timeExpired / 3600).toFixed(2)} hours)`);
    } else {
      console.log(`Time until expiration: ${timeUntilExpiration} seconds (${(timeUntilExpiration / 3600).toFixed(2)} hours)`);
    }
    
    console.log(`Calculation: ${result.calculation}`);
    console.log('=================================\n');
    
    return result;
    
  } catch (error) {
    console.error('Error checking ritual expiration:', error);
    throw error;
  }
};

/**
 * Quick check for ritual #1054 specifically
 */
export const checkRitual1054 = async () => {
  return await checkRitualExpiration(1054);
};