# TACo Network Dashboard Gauges Documentation

This document explains how each metric displayed on the TACo Network Dashboard is calculated.

## Overview Dashboard Metrics

The main dashboard displays four key network overview gauges in the dark header section:

### 1. Active Rituals (1046 of 1208 total)

**Calculation:** `activeRituals + successfulRituals`

**Source Code Location:** `src/pages/Dashboard.jsx:88`

**Detailed Formula:**
```javascript
const activeRituals = formattedRituals.filter(r => r.status === 'ACTIVE').length;
const successfulRituals = formattedRituals.filter(r => r.status === 'SUCCESSFUL').length;
const displayedActiveRituals = activeRituals + successfulRituals;
```

**Data Sources:**
- **Rituals Data:** Fetched from GraphQL subgraph via `getRituals()` function with pagination
- **Status Determination:** Based on `ritual.dkgStatus` field from blockchain data, processed in `formatRitualsData()`

**Status Categories Included:**
- `ACTIVE`: Rituals currently running
- `SUCCESSFUL`: Rituals that completed successfully

**Total Count:**
```javascript
const totalRituals = ritualCounter?.total ? parseInt(ritualCounter.total) : formattedRituals.length;
```

**Note:** The total count comes from the `ritualCounter.total` field in the GraphQL response, which represents the actual on-chain count, while the "active" display combines active and successful rituals to show meaningful operational rituals.

---

### 2. Node Operators (X active)

**Calculation:** Confirmed nodes that participated in successful DKG rituals within the past 2 weeks

**Source Code Location:** `src/pages/Dashboard.jsx:50-77`

**Detailed Formula:**
```javascript
const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
const recentSuccessfulRituals = formattedRituals.filter(r => 
  r.status === 'SUCCESSFUL' && 
  r.updateTime > twoWeeksAgo
);

// Get all participants from recent successful rituals
const activeParticipantIds = new Set();
recentSuccessfulRituals.forEach(ritual => {
  if (ritual.participants && Array.isArray(ritual.participants)) {
    ritual.participants.forEach(participant => {
      activeParticipantIds.add(participant.toLowerCase());
    });
  }
});

// Count confirmed nodes that have been active participants
const activeNodes = nodes.filter(n => 
  n.tacoOperator?.confirmed && 
  activeParticipantIds.has(n.id.toLowerCase())
).length;
```

**Data Sources:**
- **Nodes Data:** Fetched from GraphQL subgraph via `getNodes()` function
- **Ritual Participation:** From ritual participants arrays in successful rituals
- **Time Filter:** Only successful rituals from past 14 days

**Criteria for "Active" Node Operators:**
- Must have `tacoOperator.confirmed === true` (bonded and confirmed on-chain)
- Must have participated as a DKG participant in at least one successful ritual
- Participation must have occurred within the past 2 weeks (14 days)
- Only successful rituals count (status === 'SUCCESSFUL')

**Raw Data Processing:**
```javascript
// From formatNodes() function
const nodes = rawData.map((item) => ({
  id: item.id.split('-')[0],
  registeredOperatorAddress: item.tacoOperator?.operator,
  isOperatorConfirmed: item.tacoOperator?.confirmed,
  isAuthorized: parseFloat(item.amount) > 0,
  authorizedAmount: parseFloat(item.amount) || 0,
  stakedAmount: parseFloat(item.stake?.stakedAmount) || 0,
  bondedAt: item.tacoOperator?.bondedTimestamp * 1000,
}))
```

---

### 3. Success Rate (100.0%)

**Calculation:** `(successfulRituals / totalRituals) * 100`

**Source Code Location:** `src/pages/Dashboard.jsx:51-54`

**Detailed Formula:**
```javascript
const successfulRituals = formattedRituals.filter(r => r.status === 'SUCCESSFUL').length;
const totalRituals = ritualCounter?.total ? parseInt(ritualCounter.total) : formattedRituals.length;

const successRate = totalRituals > 0 
  ? ((successfulRituals / totalRituals) * 100).toFixed(1) + '%'
  : '0%';
```

**Status Categories:**

**Successful Rituals (Numerator):**
- `SUCCESSFUL`: Rituals that completed the DKG process successfully

**Total Rituals (Denominator):**
- All rituals that have ever been created on the network
- Includes: `ACTIVE`, `SUCCESSFUL`, `EXPIRED`, `TIMEOUT`, `DKG_AWAITING_TRANSCRIPTS`, `DKG_AWAITING_AGGREGATIONS`, etc.

**Note:** This represents the overall network success rate across all rituals ever created, not just completed ones.

---

### 4. Network Uptime (X%)

**Calculation:** `(activeNodes / totalConfirmedNodes) * 100`

**Source Code Location:** `src/pages/Dashboard.jsx:85-89`

**Detailed Formula:**
```javascript
const totalConfirmedNodes = nodes.filter(n => n.tacoOperator?.confirmed).length;
const activeNodes = nodes.filter(n => 
  n.tacoOperator?.confirmed && 
  activeParticipantIds.has(n.id.toLowerCase())
).length;

const networkUptime = totalConfirmedNodes > 0 
  ? ((activeNodes / totalConfirmedNodes) * 100).toFixed(1) + '%'
  : '0%';
```

**Interpretation:**
- **Total Confirmed Nodes:** All bonded and confirmed operators in the system
- **Active Nodes:** Confirmed operators that participated in successful rituals in past 2 weeks
- **Uptime Metric:** Percentage of confirmed operators that are actively participating in successful DKG rituals

**Note:** This represents the operational activity rate of the confirmed node network, showing what percentage of bonded operators are actively contributing to successful ritual completions within the recent timeframe.

---

## Secondary Dashboard Metrics

### Total Rituals
**Value:** Same as total count from Active Rituals section
**Display:** Shows in statistics grid with growth percentage

### Node Operators (Statistics Grid)
**Value:** Same as Node Operators gauge
**Display:** Shows total with confirmed count as subtitle

### Total Authorized
**Calculation:** Sum of bonded stakes from confirmed operators
**Source Code Location:** `src/pages/Dashboard.jsx:75-84`

```javascript
const totalStaked = nodes
  .filter(n => n.tacoOperator?.confirmed && n.tacoOperator?.bondedStake)
  .reduce((sum, n) => sum + parseFloat(n.tacoOperator.bondedStake || 0), 0);

const totalAuthorized = totalStaked > 1000000 
  ? (totalStaked / 1000000).toFixed(1) + 'M'
  : totalStaked > 1000
  ? (totalStaked / 1000).toFixed(1) + 'K'
  : totalStaked.toFixed(0);
```

### Average Response Time
**Calculation:** Average processing time of recent rituals
**Source Code Location:** `src/pages/Dashboard.jsx:64-73`

```javascript
const recentRituals = formattedRituals.slice(0, 20); // Use recent 20 rituals
const processingTimes = recentRituals
  .filter(r => r.updateTime && r.createdAt)
  .map(r => new Date(r.updateTime) - new Date(r.createdAt))
  .filter(time => time > 0 && time < 24 * 60 * 60 * 1000); // Filter reasonable times (< 24 hours)

const avgResponseTime = processingTimes.length > 0
  ? Math.round(processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length / 1000) + 'ms'
  : '0ms';
```

---

## Data Sources & Processing Pipeline

### 1. Ritual Data Pipeline
```
GraphQL Subgraph → getRituals() → formatRitualsData() → Dashboard Calculations
```

**Pagination:** Uses multiple queries with `skip` parameter to fetch all rituals (beyond 1000 limit)

### 2. Node Data Pipeline  
```
GraphQL Subgraph → getNodes() → formatNodes() → Dashboard Calculations
```

### 3. Status Processing
Ritual statuses are derived from blockchain `dkgStatus` field with timeout logic:

```javascript
let status = ritual.dkgStatus.replaceAll("_", " ");

if ((ritual.dkgStatus === "DKG_AWAITING_AGGREGATIONS" || 
     ritual.dkStatus === "DKG_AWAITING_TRANSCRIPTS") && 
    timeoutStamp < currentTimestampMs) {
  status = "TIME OUT";
}
```

---

## Data Freshness

- **Rituals:** Fetched on page load with full pagination
- **Nodes:** Fetched on page load  
- **Updates:** Manual page refresh required for latest data
- **Caching:** GraphQL responses may be cached by subgraph infrastructure

---

## Known Limitations

1. **Ritual Limit:** Currently fetches maximum 5000 rituals (safety limit)
2. **Response Time Accuracy:** Based on `updateTime` vs `createdAt`, may not reflect actual DKG processing time
3. **Network Uptime Definition:** Represents node confirmation percentage, not time-based availability
4. **Real-time Updates:** No live updates, requires page refresh

---

*Last Updated: Generated from codebase analysis*