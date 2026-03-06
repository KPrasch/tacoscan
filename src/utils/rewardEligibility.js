// Reward eligibility logic - mirrors taco-rewards/scripts/utils/taco_rewards.js

// Beta stakers excluded from rewards per TIP-092 and TIP-100
export const BETA_STAKERS = new Set([
  "0xE4A3492c8b085aB5eDB6FDAE329f172056f6b04e",
  "0xa7baCa5A92842689359Fb1782e75D6eFF59152e6",
  "0x16fCc54E027a342F0683263eb43Cd9af1BD72169",
  "0xCC957f683a7e3093388946d03193Eee10086b900",
  "0xEAE5790C6eE3b6425f39D3Fd33644a7cb90C75A5",
  "0x02faA4286eF91247f8D09F36618D4694717F76bB",
  "0xBa1Ac67539c09AdDe63335635869c86f8e463514",
  "0xa6E3A08FaE33898fC31C4f6C7a584827D809352D",
  "0xDC09db6e5DA859eDeb7FC7bDCf47545056dC35F7",
  "0xdA08C16C86B78cD56CB10FDc0370EFc549d8638B",
  "0xC0B851DCBf00bA59D8B1f490aF93dEC4275cFFcC",
  "0x372626FF774573E82eb7D4545EE96F68F75aaFF6",
  "0xB88A62417eb9e6320AF7620BE0CFBE2dddd435A5",
  "0xb78F9EFE4F713feEFcAB466d2ee41972a0E45205",
  "0x5838636dCDd92113998FEcbcDeDf5B0d8bEB4920",
  "0xAAFc71044C2B832dDDFcedb0AE99695B0367dC57",
  "0x6dEE1fd2b29e2214a4f9aB9Ba5f3D17C8Cb56D11",
  "0x43df8c68a56249CC151dfb3a7E82cC7Fd624cF2a",
  "0x885fA88126955D5CFE0170A134e0300B8d3EfF47",
  "0x9Aa35dCE841A43693Cde23B86c394E1aEFb61c65",
  "0x331F6346C4c1bdb4Ef7467056C66250F0Eb8A44f",
  "0xc54238cac19bB8D57a9Bcdd28C3fdd49d82378D8",
  "0xBf40548b6Fd104C3cA9B2F6b2E2383301dB1c023",
  "0x621074D613Fc938bD9381AB77Ef3609a02432628",
  "0xB0C9F472b2066691Ab7FEE5b6702c28ab35888b2",
  "0xBDC3D611B79349e0b3d63833619875E89388298D",
  "0xc9909E3d0B87A1A2eB0f1194Ec5e3694464Ac522",
  "0x8afC0e9F8207975301893452bDeD1e8F2892f953",
  "0x58d665406Cf0F890daD766389DF879E84cc55671",
  "0x39A2D252769363D070a77fE3ad24b9954e1fB876",
  "0xE6C074228932F53C9E50928AD69DB760649A8C4d",
  "0xF2962794EbE69fc88F8dB441c1CD13b9F90B1Fe7",
  "0x557C836714aFd04f796686b0a50528714B549C74",
  "0x97d065B567cc4543D20dffaa7009f9aDe64d7E26",
  "0xc1268db05E7bD38BD85b2C3Fef80F8968a2c933A",
].map(a => a.toLowerCase()));

/**
 * Check if a node has requested exit — derived on-chain from the
 * isReleased flag on StakingProvider, set when authorized amount
 * drops below minimumAuthorization.  Using deauthorizing > 0 was
 * imprecise because partial stake reductions also set that field.
 */
export function hasRequestedExit(stakingProvider) {
  return stakingProvider?.isReleased === true;
}

export const RewardStatus = {
  ELIGIBLE: 'reward_eligible',
  BETA_STAKER: 'beta_staker',
  REQUESTED_EXIT: 'requested_exit',
  NOT_AUTHORIZED: 'not_authorized',
  NO_CONFIRMED_OPERATOR: 'no_confirmed_operator',
  PENALIZED_FULL: 'penalized_full',
};

export const RewardStatusLabels = {
  [RewardStatus.ELIGIBLE]: 'Reward Eligible',
  [RewardStatus.BETA_STAKER]: 'Beta Staker (Excluded)',
  [RewardStatus.REQUESTED_EXIT]: 'Requested Exit (Excluded)',
  [RewardStatus.NOT_AUTHORIZED]: 'Not Authorized',
  [RewardStatus.NO_CONFIRMED_OPERATOR]: 'No Confirmed Operator',
  [RewardStatus.PENALIZED_FULL]: 'Fully Penalized (Heartbeats)',
};

export const RewardStatusColors = {
  [RewardStatus.ELIGIBLE]: '#10B981',
  [RewardStatus.BETA_STAKER]: '#6366F1',
  [RewardStatus.REQUESTED_EXIT]: '#F59E0B',
  [RewardStatus.NOT_AUTHORIZED]: '#6B7280',
  [RewardStatus.NO_CONFIRMED_OPERATOR]: '#EF4444',
  [RewardStatus.PENALIZED_FULL]: '#DC2626',
};

export const RewardStatusIcons = {
  [RewardStatus.ELIGIBLE]: '✓',
  [RewardStatus.BETA_STAKER]: 'β',
  [RewardStatus.REQUESTED_EXIT]: '→',
  [RewardStatus.NOT_AUTHORIZED]: '—',
  [RewardStatus.NO_CONFIRMED_OPERATOR]: '!',
  [RewardStatus.PENALIZED_FULL]: '✗',
};

/**
 * Determine why a node is or isn't receiving rewards.
 * Returns the most relevant reason.
 */
export function getRewardStatus(authorization, stakingProviderData) {
  const stakingProvider = (authorization.stake?.id || authorization.id?.split('-')[0] || '').toLowerCase();
  const hasAmount = authorization.amount && Number(authorization.amount) > 0;
  const hasOperator = !!authorization.tacoOperator?.operator;
  const isConfirmed = authorization.tacoOperator?.confirmed === true;

  // Check exclusion lists first
  if (BETA_STAKERS.has(stakingProvider)) {
    return RewardStatus.BETA_STAKER;
  }
  if (hasRequestedExit(stakingProviderData || authorization)) {
    return RewardStatus.REQUESTED_EXIT;
  }
  
  // Must have authorized amount
  if (!hasAmount) {
    return RewardStatus.NOT_AUTHORIZED;
  }
  
  // Must have confirmed operator
  if (!hasOperator || !isConfirmed) {
    return RewardStatus.NO_CONFIRMED_OPERATOR;
  }
  
  return RewardStatus.ELIGIBLE;
}

/**
 * Get reward eligibility explanation text
 */
export function getRewardExplanation(status) {
  switch (status) {
    case RewardStatus.ELIGIBLE:
      return 'This node is eligible for TACo rewards. Actual rewards depend on heartbeat participation — nodes failing 4+ heartbeat rituals receive zero rewards for that period.';
    case RewardStatus.BETA_STAKER:
      return 'Beta stakers are excluded from rewards per TIP-092 and TIP-100.';
    case RewardStatus.REQUESTED_EXIT:
      return 'This node has requested exit from rituals and is excluded from rewards.';
    case RewardStatus.NOT_AUTHORIZED:
      return 'This node has no authorized stake amount. Authorization to TACo is required to earn rewards.';
    case RewardStatus.NO_CONFIRMED_OPERATOR:
      return 'This node needs a confirmed operator on Polygon. The operator must call confirmOperatorAddress on the TACoApplication contract.';
    case RewardStatus.PENALIZED_FULL:
      return 'This node failed 4 or more heartbeat rituals and received a 100% penalty on rewards for this period.';
    default:
      return '';
  }
}

/**
 * Categorize all nodes by reward status and return counts
 */
export function categorizeRewardEligibility(authorizations) {
  const counts = {};
  Object.values(RewardStatus).forEach(s => { counts[s] = 0; });
  
  authorizations.forEach(auth => {
    const status = getRewardStatus(auth);
    counts[status]++;
  });
  
  return counts;
}
