# Round 2: Bug Fixes & Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix remaining bugs (fake data, XSS, dead Goerli references, web3Cache race condition), improve performance (batch provider fetches), and remove dead code (unused exports, components, CSS).

**Architecture:** Surgical fixes across existing files. No new files needed. Most changes are deletions or small edits.

**Tech Stack:** React 18, Vite 4, Web3.js, CSS Modules

---

### Task 1: Fix NetworkActivity.jsx - remove fake data generation

**Files:**
- Modify: `src/pages/NetworkActivity.jsx`

The page mixes real subgraph events with fabricated ritual "events" that have fake tx hashes (`Math.random()`) and fake gas values. The real events from `getAllNetworkEvents()` also get fake gas values injected.

**Changes:**

1. For real events (the `allEvents.forEach` block starting ~line 35): remove the `Math.random()` fallbacks. Use the actual `event.txHash` (show `'-'` if null). Remove fake `gasUsed` and `gasPrice` fields entirely - the subgraph doesn't provide gas data, so don't fabricate it.

2. For ritual-derived events (the `formattedRituals.forEach` block ~line 55): these are synthetic timeline entries derived from ritual state, not real blockchain transactions. They should NOT have fake tx hashes. Remove `txHash` generation entirely (use `null`). Remove fake `gasUsed`/`gasPrice`. Add a `synthetic: true` flag so the UI can distinguish them.

3. Update the table rendering: remove the "Gas" columns or show `'-'` when gas data is unavailable. For synthetic entries without txHash, don't render a hash at all.

4. Update the subtitle from "Real-time TACo network transactions and ritual events" to "TACo network staking events and ritual activity" since these aren't real-time transactions.

**Commit:** `fix: remove fabricated transaction data from NetworkActivity (#network-activity)`

---

### Task 2: Fix XSS in SigningCohortDetail.jsx - replace dangerouslySetInnerHTML

**Files:**
- Modify: `src/pages/SigningCohortDetail.jsx`
- Modify: `src/pages/SigningCohortDetail.module.css`

The `formatJSON` function builds HTML strings with regex and renders via `dangerouslySetInnerHTML`. Replace with a safe React-based JSON renderer.

**Changes:**

1. Replace the `formatJSON` function and `dangerouslySetInnerHTML` with a recursive React component that renders JSON safely using `<span>` elements with CSS classes. Use `JSON.stringify(obj, null, 2)` to get indented text, then split into lines and apply syntax highlighting via regex on each line, but render as React elements (not raw HTML).

Simpler approach: since `JSON.stringify` output is deterministic and doesn't contain user HTML, we can use a simple line-by-line highlighter:

```jsx
const JsonSyntaxHighlight = ({ data }) => {
  const json = JSON.stringify(data, null, 2);
  const lines = json.split('\n');
  return (
    <pre className={styles.jsonContent}>
      {lines.map((line, i) => {
        // Apply highlighting via spans
        const highlighted = line
          .replace(/"([^"]+)":/g, (match, key) => `\x00KEY${key}\x01`)
          .replace(/: "([^"]*)"(,?)$/g, (match, val, comma) => `\x00STR${val}\x01${comma}`)
          .replace(/: (\d+\.?\d*)(,?)$/g, (match, num, comma) => `\x00NUM${num}\x01${comma}`)
          .replace(/: (true|false|null)(,?)$/g, (match, val, comma) => `\x00BOOL${val}\x01${comma}`);
        // Then split on markers and render spans
        // ... render as React elements
      })}
    </pre>
  );
};
```

Actually, the simplest safe approach: just render `<pre>{JSON.stringify(data, null, 2)}</pre>` with CSS styling on the `<pre>`. The syntax highlighting is nice-to-have but the XSS risk isn't worth it. Keep it simple - just remove `dangerouslySetInnerHTML` and render plain text JSON. The copy button already gives users the JSON.

2. Remove the `formatJSON` function entirely.
3. Remove unused CSS classes `.jsonKey`, `.jsonString`, `.jsonNumber`, `.jsonBoolean`, `.jsonNull` if they exist.

**Commit:** `fix: remove XSS-vulnerable dangerouslySetInnerHTML from JSON view`

---

### Task 3: Remove dead Goerli references and hardcoded API keys from Cons.jsx

**Files:**
- Modify: `src/utils/Cons.jsx`
- Modify: `src/pages/data.jsx` (check if Goerli constants are used)

**Changes:**

1. In `Cons.jsx`, remove:
   - `RPC_ETH_GOERLI` (hardcoded Alchemy key for deprecated Goerli testnet)
   - `GOERLI_API_BALANCE` (hardcoded Etherscan API key for Goerli)
   - `TESTNET_API` (Goerli subgraph URL)

2. In `data.jsx`, find where `RPC_ETH_GOERLI` and `GOERLI_API_BALANCE` are used (lines ~1161 and ~1189). These are in `getCurrentBlockNumber` and `getBalanceOfAddress` - both of which are unused exports (confirmed in audit). Remove these dead functions entirely (they're being deleted in Task 6 anyway).

3. If any other file references these constants, update accordingly.

**Commit:** `fix: remove hardcoded API keys and dead Goerli references`

---

### Task 4: Fix web3Cache.js race condition and memory leak

**Files:**
- Modify: `src/utils/web3Cache.js`

**Changes:**

The cache has two bugs:
1. The polling `setInterval` in the "wait for in-flight fetch" path uses a stale `now` value, so the TTL check can fail forever.
2. If the fetch fails or never completes, the interval runs forever (memory leak).

Fix by replacing the polling approach with a promise-based deduplication pattern:

```javascript
class Web3Cache {
  constructor() {
    this.cache = new Map();
    this.pending = new Map(); // Store pending promises instead of boolean flags
  }

  async get(key, fetchFn, ttl = 60000) {
    const cached = this.cache.get(key);
    if (cached && cached.timestamp + ttl > Date.now()) {
      return cached.value;
    }

    // If fetch is already in progress, return the same promise
    if (this.pending.has(key)) {
      return this.pending.get(key);
    }

    // Start fetch and store the promise
    const fetchPromise = fetchFn().then(value => {
      this.cache.set(key, { value, timestamp: Date.now() });
      this.pending.delete(key);
      return value;
    }).catch(error => {
      this.pending.delete(key);
      throw error;
    });

    this.pending.set(key, fetchPromise);
    return fetchPromise;
  }

  clear() {
    this.cache.clear();
    this.pending.clear();
  }

  delete(key) {
    this.cache.delete(key);
    this.pending.delete(key);
  }
}
```

This eliminates the `setInterval` entirely, uses fresh `Date.now()` for TTL checks, and properly shares in-flight promises.

**Commit:** `fix: eliminate race condition and memory leak in web3Cache`

---

### Task 5: Use BatchProcessor for getAllStakingProviders

**Files:**
- Modify: `src/utils/contractReader.js`

**Changes:**

Replace the sequential `for...of` loop in `getAllStakingProviders` (~line 360) with the existing `BatchProcessor`:

```javascript
import BatchProcessor from './batchProcessor';

// In getAllStakingProviders:
const batchProcessor = new BatchProcessor(5, 200); // 5 concurrent, 200ms between batches
const results = await batchProcessor.processBatch(stakingProviders, async (provider) => {
  const info = await getStakingProviderInfo(provider, network);
  return info ? { stakingProvider: provider, ...info } : null;
});
return results.filter(Boolean);
```

**Commit:** `perf: batch staking provider fetches for ~5x speedup`

---

### Task 6: Remove unused exports from data.jsx

**Files:**
- Modify: `src/pages/data.jsx`

**Remove these functions** (confirmed unused outside data.jsx, and internal callers are also dead):
- `formatStringEnd` (line 149)
- `formatSatoshi` (line 161)
- `formatGwei` (line 165) - called only by `getTotalMerkleDropReward` (also being deleted)
- `formatGweiFixedZero` (line 169) - called only by line 189 within `formatWeiDecimalNoSurplus` → wait, check this. `formatWeiDecimalNoSurplus` IS used by nodes.jsx. So `formatGweiFixedZero` might be needed. Check the call chain.
  - Actually line 189 is in `formatWeiDecimalNoSurplus` which uses `formatGweiFixedZero`. So keep `formatGweiFixedZero`.
  - But `formatGwei` is only used by `getTotalMerkleDropReward` (line 1286) which is dead. Safe to remove.
- `formatNumberToDecimal` (line 213)
- `formatNumber` (line 217)
- `formatTimestampToText` (line 276) - wait, this IS called internally at line 330 by `formatTimeToText`. Keep it if `formatTimeToText` is used. Check: `formatTimeToText` is imported by NetworkActivity.jsx. So `formatTimestampToText` is needed internally. Keep it, just remove the `export` keyword.
- `formatEntryDate` (line 295)
- `convertToLittleEndian` (line 353)
- `getRitualsByStakingProvider` (line 877)
- `getCurrentBlockNumber` (line 1156)
- `getBalanceOfAddress` (line 1182)
- `getTotalMerkleDropReward` (line 1268)

Summary: Delete 11 functions entirely, convert `formatTimestampToText` from `export` to non-exported.

**Commit:** `chore: remove 11 unused data functions`

---

### Task 7: Delete unused components and their assets

**Files:**
- Delete: `src/components/TacoLogo.jsx`
- Delete: `src/components/TacoLogo.module.css`
- Delete: `src/components/TacoLogoAnimated.jsx`
- Delete: `src/components/ui/CircularProgress.jsx`
- Delete: `src/components/ui/CircularProgress.module.css`
- Delete: `src/components/ui/TextField.jsx`
- Delete: `src/components/ui/TextField.module.css`
- Delete: `src/components/ui/Accordion.jsx`
- Delete: `src/components/ui/Accordion.module.css`
- Modify: `src/components/ui/index.js` (remove exports for deleted components)
- Modify: `src/components/ui/Icons.jsx` (remove unused icon exports: SettingsIcon, AccountBalanceWalletIcon, ExpandMoreIcon, CheckCircleIcon, PendingIcon, ErrorIcon)
- Modify: `src/components/ConditionRenderer.jsx` (remove the `export { ConditionCard }` line at end)

Before deleting, verify no imports reference these files.

**Commit:** `chore: remove unused UI components and icon exports`

---

### Task 8: Clean up home/styles.module.css

**Files:**
- Modify: `src/pages/home/styles.module.css`

The file has 60+ CSS classes but only `.table_content` is used by `ritual.jsx` and `nodes.jsx`. 

**Changes:** Replace the entire file with just the `.table_content` class and any classes it depends on. Read the file first to extract the full `.table_content` definition, then rewrite with only what's needed.

**Commit:** `chore: remove ~800 lines of unused CSS from home/styles.module.css`

---

### Task 9: Add response.ok checks to fetch calls

**Files:**
- Modify: `src/pages/data.jsx` (multiple fetch calls)
- Modify: `src/pages/NodeDetail.jsx` (GraphQL fetch)

**Changes:**

Find all `fetch()` calls that don't check `response.ok` and add validation:

```javascript
const response = await fetch(url, options);
if (!response.ok) {
  throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}
const data = await response.json();
```

Key locations in `data.jsx`:
- `loadBetaStakers` (~line 545) - fetch of `/beta_stakers.txt`
- `getAllNetworkEvents` (~line 940) - GraphQL fetch
- `getTotalMerkleDropReward` (~line 1268) - GitHub API fetch (being deleted in Task 6, skip)

In `NodeDetail.jsx`:
- GraphQL fetch (~line 22)

**Commit:** `fix: validate HTTP responses before parsing`
