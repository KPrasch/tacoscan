import Web3 from "web3";
import mainnetArtifacts from "../artifacts/mainnet.json";
import lynxArtifacts from "../artifacts/lynx.json";
import tapirArtifacts from "../artifacts/tapir.json";
import { getCurrentNetwork } from "./dataSource";
import { networkConfig } from "./networkConfig";
import { conditions } from "@nucypher/taco";
import { fromHexString } from "@nucypher/shared";
import BatchProcessor from "./batchProcessor";

// Helper function to try decoding bytes data as conditions
const tryDecodeConditions = (bytesData) => {
  if (!bytesData || bytesData === "0x" || bytesData === "0x00") {
    return null;
  }

  try {
    // First try to decode as ConditionExpression from taco-web
    const bytes = fromHexString(bytesData);
    const jsonString = new TextDecoder().decode(bytes);

    // Parse JSON and create ConditionExpression
    const conditionExpr =
      conditions.conditionExpr.ConditionExpression.fromJSON(jsonString);

    // Return the condition object
    return conditionExpr.toObj();
  } catch (error) {
    console.log("Could not decode as ConditionExpression:", error.message);

    // Fallback: try to decode as plain JSON
    try {
      const web3 = new Web3();
      const decoded = web3.utils.hexToUtf8(bytesData);

      // Try to parse as JSON
      try {
        return JSON.parse(decoded);
      } catch {
        // If not JSON, return as string if it's printable
        if (decoded && /^[\x20-\x7E\n\r\t]+$/.test(decoded)) {
          return decoded;
        }
      }
    } catch (error) {
      console.log("Could not decode bytes data:", error.message);
    }
  }

  // Return the raw hex if we couldn't decode it
  return bytesData;
};

// Get TACoApplication ABI and address
const getTACoApplication = (network = "mainnet") => {
  let artifacts;

  switch (network) {
    case "lynx":
      // Lynx artifacts are under Sepolia chain ID
      artifacts = lynxArtifacts["11155111"];
      break;
    case "tapir":
      // Tapir artifacts are under Sepolia chain ID
      artifacts = tapirArtifacts["11155111"];
      break;
    case "polygon":
      // Polygon artifacts are in mainnet.json under key "137"
      artifacts = mainnetArtifacts["137"];
      break;
    case "mainnet":
    default:
      // Ethereum mainnet artifacts are under key "1"
      artifacts = mainnetArtifacts["1"];
      break;
  }

  if (!artifacts || !artifacts.TACoApplication) {
    console.warn(
      `TACoApplication not found for network ${network}, artifacts:`,
      artifacts ? Object.keys(artifacts) : "none",
    );
    return null;
  }

  return artifacts.TACoApplication;
};

// Get TestnetThresholdStaking contract for testnets
const getTestnetStaking = (network = "mainnet") => {
  let artifacts;

  switch (network) {
    case "lynx":
      artifacts = lynxArtifacts["11155111"];
      break;
    case "tapir":
      artifacts = tapirArtifacts["11155111"];
      break;
    default:
      return null; // Only testnets have TestnetThresholdStaking
  }

  if (!artifacts || !artifacts.TestnetThresholdStaking) {
    console.warn(`TestnetThresholdStaking not found for network ${network}`);
    return null;
  }

  return artifacts.TestnetThresholdStaking;
};

// Get SigningCoordinator contract for testnets
const getSigningCoordinator = (network = "mainnet") => {
  let artifacts;

  switch (network) {
    case "lynx":
      // SigningCoordinator is on Sepolia (11155111) for lynx
      artifacts = lynxArtifacts["11155111"];
      break;
    case "tapir":
      artifacts = tapirArtifacts["11155111"];
      break;
    default:
      return null; // Only testnets have SigningCoordinator for now
  }

  if (!artifacts || !artifacts.SigningCoordinator) {
    console.warn(`SigningCoordinator not found for network ${network}`);
    return null;
  }

  return artifacts.SigningCoordinator;
};

// Get SigningCoordinatorChild contracts for different chains
const getSigningCoordinatorChild = (chainId) => {
  const artifacts = lynxArtifacts[String(chainId)];

  if (!artifacts?.SigningCoordinatorChild) {
    console.log("SigningCoordinatorChild not found for chain:", chainId);
    return null;
  }

  return artifacts.SigningCoordinatorChild;
};

// Get supported chain IDs for signing cohorts
const getSupportedChainIds = (network = "mainnet") => {
  if (network === "lynx" || network === "tapir") {
    // Return all chain IDs from lynx artifacts
    return Object.keys(lynxArtifacts).map((id) => parseInt(id));
  }
  return [1]; // Mainnet only supports Ethereum mainnet
};

// Get RPC URL for network
const getRpcUrl = (network) => {
  switch (network) {
    case "lynx":
    case "tapir":
      return networkConfig.rpcEth;
    case "polygon":
      return networkConfig.rpcPolygon;
    case "mainnet":
    default:
      return networkConfig.rpcEth;
  }
};

// Read staking provider info directly from contract
export const getStakingProviderInfo = async (
  stakingProvider,
  network = "mainnet",
) => {
  try {
    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const tacoApp = getTACoApplication(network);

    if (!tacoApp) {
      console.error("TACoApplication not found");
      return null;
    }

    const contract = new web3.eth.Contract(tacoApp.abi, tacoApp.address);

    // For testnets, also get TestnetThresholdStaking contract
    const testnetStaking = getTestnetStaking(network);
    let stakingContract = null;
    let stakingInfo = {};

    if (testnetStaking) {
      stakingContract = new web3.eth.Contract(
        testnetStaking.abi,
        testnetStaking.address,
      );

      // On testnets, get stake info from TestnetThresholdStaking
      try {
        // Get authorized stake from TestnetThresholdStaking
        const authorizedStake = await stakingContract.methods
          .authorizedStake(stakingProvider, tacoApp.address)
          .call();

        // Get staking provider info from TestnetThresholdStaking if available
        try {
          const providerInfo = await stakingContract.methods
            .stakingProviderInfo(stakingProvider)
            .call();
          stakingInfo = {
            authorized: authorizedStake || "0",
            stakedAmount: providerInfo?.tStake || "0",
            ...providerInfo,
          };
        } catch {
          // If stakingProviderInfo doesn't exist, just use authorizedStake
          stakingInfo = {
            authorized: authorizedStake || "0",
          };
        }

        // Get roles (owner, operator, etc.) from TestnetThresholdStaking
        try {
          const roles = await stakingContract.methods
            .rolesOf(stakingProvider)
            .call();
          if (roles) {
            stakingInfo.owner = roles.owner || stakingProvider;
            stakingInfo.operator =
              roles.operator || roles.owner || stakingProvider;
          }
        } catch {
          // If rolesOf fails, default to stakingProvider
          stakingInfo.owner = stakingProvider;
          stakingInfo.operator = stakingProvider;
        }
      } catch (error) {
        console.error("Error reading from TestnetThresholdStaking:", error);
      }
    }

    // Get operator info from TACoApplication
    let tacoInfo;
    try {
      tacoInfo = await contract.methods
        .stakingProviderInfo(stakingProvider)
        .call();
    } catch {
      // If TACoApplication doesn't have the info, return what we have from TestnetThresholdStaking
      if (testnetStaking && stakingInfo.authorized) {
        return {
          operator: stakingInfo.operator || stakingProvider,
          operatorConfirmed: false,
          operatorStartTimestamp: 0,
          authorized: stakingInfo.authorized,
          deauthorizing: "0",
          endDeauthorization: 0,
          tReward: "0",
          endCommitment: 0,
          ...stakingInfo,
        };
      }
      return null;
    }

    // For testnets, merge info from both contracts
    if (testnetStaking) {
      return {
        operator: tacoInfo.operator || stakingInfo.operator || stakingProvider,
        operatorConfirmed: tacoInfo.operatorConfirmed || false,
        operatorStartTimestamp: parseInt(tacoInfo.operatorStartTimestamp || 0),
        authorized: stakingInfo.authorized || tacoInfo.authorized || "0",
        deauthorizing: tacoInfo.deauthorizing || "0",
        endDeauthorization: parseInt(tacoInfo.endDeauthorization || 0),
        tReward: tacoInfo.tReward || "0",
        endCommitment: parseInt(tacoInfo.endCommitment || 0),
        stakedAmount: stakingInfo.stakedAmount || "0",
      };
    }

    // For mainnet, use TACoApplication info as before
    return {
      operator: tacoInfo.operator,
      operatorConfirmed: tacoInfo.operatorConfirmed,
      operatorStartTimestamp: parseInt(tacoInfo.operatorStartTimestamp),
      authorized: tacoInfo.authorized,
      deauthorizing: tacoInfo.deauthorizing,
      endDeauthorization: parseInt(tacoInfo.endDeauthorization),
      tReward: tacoInfo.tReward,
      endCommitment: parseInt(tacoInfo.endCommitment),
    };
  } catch (error) {
    console.error("Error reading staking provider info:", error);
    return null;
  }
};

// Get authorized stake amount
export const getAuthorizedStake = async (
  stakingProvider,
  network = "mainnet",
) => {
  try {
    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const tacoApp = getTACoApplication(network);

    if (!tacoApp) {
      console.error("TACoApplication not found");
      return "0";
    }

    const contract = new web3.eth.Contract(tacoApp.abi, tacoApp.address);

    // Call authorizedStake
    const stake = await contract.methods
      .authorizedStake(stakingProvider)
      .call();

    return stake; // Return in wei for consistency
  } catch (error) {
    console.error("Error reading authorized stake:", error);
    return "0";
  }
};

// Get all staking providers from contract events
export const getAllStakingProviders = async (network = "mainnet") => {
  try {
    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const tacoApp = getTACoApplication(network);

    if (!tacoApp) {
      console.error("TACoApplication not found");
      return [];
    }

    const contract = new web3.eth.Contract(tacoApp.abi, tacoApp.address);

    // For testnets, we need to check TestnetThresholdStaking for stake amounts
    const testnetStaking = getTestnetStaking(network);
    let stakingContract = null;
    if (testnetStaking) {
      stakingContract = new web3.eth.Contract(
        testnetStaking.abi,
        testnetStaking.address,
      );
    }

    // Get events for all operator confirmations (these represent active nodes)
    const events = await contract.getPastEvents("OperatorConfirmed", {
      fromBlock: 0,
      toBlock: "latest",
    });

    console.log(
      `Found ${events.length} OperatorConfirmed events on ${network}`,
    );

    // Get unique staking providers
    const stakingProviders = new Set();
    events.forEach((event) => {
      if (event.returnValues && event.returnValues.stakingProvider) {
        stakingProviders.add(event.returnValues.stakingProvider);
      }
    });

    // If on testnet and no operators found, try getting stakes directly from TestnetThresholdStaking
    if (stakingProviders.size === 0 && stakingContract) {
      console.log(
        "No operators found, checking TestnetThresholdStaking for staked providers...",
      );

      // Try to get all staking providers who have authorized to TACoApplication
      const authEvents = await stakingContract.getPastEvents(
        "AuthorizationIncreased",
        {
          fromBlock: 0,
          toBlock: "latest",
          filter: { application: tacoApp.address },
        },
      );

      authEvents.forEach((event) => {
        if (event.returnValues && event.returnValues.stakingProvider) {
          stakingProviders.add(event.returnValues.stakingProvider);
        }
      });

      console.log(
        `Found ${stakingProviders.size} providers from AuthorizationIncreased events`,
      );
    }

    // Fetch data for each provider in parallel batches
    const batchProcessor = new BatchProcessor(5, 200);
    const results = await batchProcessor.processBatch(
      [...stakingProviders],
      async (provider) => {
        const info = await getStakingProviderInfo(provider, network);
        return info ? { stakingProvider: provider, ...info } : null;
      },
    );

    return results.filter(Boolean);
  } catch (error) {
    console.error("Error fetching all staking providers:", error);
    return [];
  }
};

// Get Coordinator contract for rituals
const getCoordinator = (network = "mainnet") => {
  let artifacts;

  switch (network) {
    case "lynx":
      // Coordinator is on Polygon Amoy (80002) for lynx
      artifacts = lynxArtifacts["80002"];
      break;
    case "tapir":
      // Coordinator is on Polygon Amoy (80002) for tapir
      artifacts = tapirArtifacts["80002"];
      break;
    case "polygon":
      artifacts = mainnetArtifacts["137"];
      break;
    case "mainnet":
    default:
      // Coordinator is on Polygon (137) for mainnet
      artifacts = mainnetArtifacts["137"];
      break;
  }

  // Look for Coordinator contract
  if (artifacts) {
    // Try different possible names
    const coordinatorNames = [
      "Coordinator",
      "CoordinatorAgent",
      "DKGCoordinator",
    ];
    for (const name of coordinatorNames) {
      if (artifacts[name]) {
        return artifacts[name];
      }
    }
  }

  return null;
};

// Get all rituals from contract
export const getAllRituals = async (network = "mainnet") => {
  try {
    const coordinator = getCoordinator(network);

    if (!coordinator) {
      console.log("Coordinator contract not found for network:", network);
      return [];
    }

    // Rituals are always on Polygon/Polygon Amoy, use Polygon RPC
    const rpcUrl = networkConfig.rpcPolygon;
    const web3 = new Web3(rpcUrl);
    const contract = new web3.eth.Contract(
      coordinator.abi,
      coordinator.address,
    );

    // Get the total number of rituals
    let numRituals;
    try {
      numRituals = await contract.methods.numberOfRituals().call();
    } catch {
      // Try alternative method name
      try {
        numRituals = await contract.methods.ritualsCount().call();
      } catch {
        console.log("Could not determine number of rituals");
        return [];
      }
    }

    // Fetch each ritual's data
    const rituals = [];
    for (let i = 0; i < numRituals; i++) {
      try {
        const ritual = await contract.methods.rituals(i).call();
        rituals.push({
          id: i,
          ...ritual,
        });
      } catch (error) {
        console.error(`Error fetching ritual ${i}:`, error);
      }
    }

    return rituals;
  } catch (error) {
    console.error("Error fetching all rituals:", error);
    return [];
  }
};

// Get all signing cohorts
export const getAllSigningCohorts = async (network = "mainnet") => {
  try {
    const signingCoordinator = getSigningCoordinator(network);

    if (!signingCoordinator) {
      console.log("SigningCoordinator not found for network:", network);
      return [];
    }

    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const contract = new web3.eth.Contract(
      signingCoordinator.abi,
      signingCoordinator.address,
    );

    // Get total number of cohorts
    const numCohorts = await contract.methods.numberOfSigningCohorts().call();
    console.log(`Found ${numCohorts} signing cohorts on ${network}`);

    // Fetch each cohorts data
    const cohorts = [];
    for (let i = 0; i < numCohorts; i++) {
      try {
        // Get cohort state
        const state = await contract.methods.getSigningCohortState(i).call();
        const isActive = await contract.methods.isCohortActive(i).call();

        // Get signers for this cohort
        const signerParticipants = await contract.methods.getSigners(i).call();
        const signers = signerParticipants.map((p) => ({
          provider: p.provider || p[0],
          operator: p.operator || p[1],
          signature: p.signature || p[2],
          address: p.provider || p[0],
        }));

        // Get threshold
        const threshold = await contract.methods.getThreshold(i).call();

        // Try to get conditions for each supported chain
        let conditions = {};
        const supportedChainIds = getSupportedChainIds(network);

        for (const chainId of supportedChainIds) {
          try {
            const chainConditions = await contract.methods
              .getSigningCohortConditions(i, chainId)
              .call();
            console.log(
              `Cohort ${i} chain ${chainId} conditions:`,
              chainConditions,
            );
            // getSigningCohortConditions returns bytes data
            if (
              chainConditions &&
              chainConditions !== "0x" &&
              chainConditions !== "0x00"
            ) {
              // Store the raw bytes data - we'll decode it in the UI if needed
              conditions[chainId] = {
                raw: chainConditions,
                // Try to decode as ConditionExpression
                decoded: tryDecodeConditions(chainConditions),
              };
              console.log(
                `Decoded conditions for cohort ${i} chain ${chainId}:`,
                conditions[chainId].decoded,
              );
            }
          } catch (error) {
            // Conditions might not be set for this chain
            console.log(
              `No conditions for cohort ${i} on chain ${chainId}:`,
              error.message,
            );
          }
        }

        cohorts.push({
          id: i,
          state,
          isActive,
          signers,
          threshold: parseInt(threshold),
          conditions,
          signersCount: signerParticipants.length,
        });
      } catch (error) {
        console.error(`Error fetching cohort ${i}:`, error);
      }
    }

    return cohorts;
  } catch (error) {
    console.error("Error fetching signing cohorts:", error);
    return [];
  }
};

// Get signing cohort details
export const getSigningCohortDetails = async (
  cohortId,
  network = "mainnet",
) => {
  try {
    const signingCoordinator = getSigningCoordinator(network);

    if (!signingCoordinator) {
      console.log("SigningCoordinator not found for network:", network);
      return null;
    }

    const rpcUrl = getRpcUrl(network);
    const web3 = new Web3(rpcUrl);
    const contract = new web3.eth.Contract(
      signingCoordinator.abi,
      signingCoordinator.address,
    );

    // Get cohort state
    const state = await contract.methods.getSigningCohortState(cohortId).call();
    const isActive = await contract.methods.isCohortActive(cohortId).call();

    // Get signers and their details
    const signerParticipants = await contract.methods
      .getSigners(cohortId)
      .call();
    const signers = [];

    // getSigners returns array of {provider, operator, signature}
    for (const participant of signerParticipants) {
      signers.push({
        provider: participant.provider || participant[0],
        operator: participant.operator || participant[1],
        signature: participant.signature || participant[2],
        // For display, we'll use the provider address as the main address
        address: participant.provider || participant[0],
      });
    }

    // Get threshold
    const threshold = await contract.methods.getThreshold(cohortId).call();

    // Get chains this cohort operates on
    let chains = [];
    try {
      chains = await contract.methods.getChains(cohortId).call();
    } catch {
      // May not be available for all cohorts
    }

    // Try to get conditions for each supported chain
    let conditions = {};
    const supportedChainIds = getSupportedChainIds(network);

    for (const chainId of supportedChainIds) {
      try {
        const chainConditions = await contract.methods
          .getSigningCohortConditions(cohortId, chainId)
          .call();
        // getSigningCohortConditions returns bytes data
        if (
          chainConditions &&
          chainConditions !== "0x" &&
          chainConditions !== "0x00"
        ) {
          // Store the raw bytes data - we'll decode it in the UI if needed
          conditions[chainId] = {
            raw: chainConditions,
            // Try to decode as ConditionExpression
            decoded: tryDecodeConditions(chainConditions),
          };
        }
      } catch (error) {
        // Conditions might not be set for this chain
        console.log(
          `No conditions for cohort ${cohortId} on chain ${chainId}:`,
          error.message,
        );
      }
    }

    return {
      id: cohortId,
      state,
      isActive,
      signers,
      signersCount: signers.length,
      threshold: parseInt(threshold),
      chains,
      conditions,
    };
  } catch (error) {
    console.error("Error fetching cohort details:", error);
    return null;
  }
};
