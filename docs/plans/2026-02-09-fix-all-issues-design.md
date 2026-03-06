# TACo Scan Bug Fixes & Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix all 7 open GitHub issues and clean up dead code in the tacoscan project.

**Architecture:** The app is a React+Vite blockchain explorer. Most bugs are configuration/data-layer issues (wrong chain IDs, duplicate env vars, split artifact files). UI fixes are CSS adjustments and adding missing components.

**Tech Stack:** React 18, Vite 4, Web3.js, React Router v6, CSS Modules

---

### Task 1: Fix DKG ritual loading - wrong chain IDs (Issue #5)

**Files:**
- Modify: `src/utils/contractReader.js:380-398` (getCoordinator function)
- Modify: `src/utils/contractReader.js:416-457` (getAllRituals function)

**Step 1: Fix getCoordinator chain IDs**

In `src/utils/contractReader.js`, the `getCoordinator()` function at line ~386 uses the wrong chain ID for testnets. The Coordinator contract lives on Polygon Amoy (80002), not Sepolia (11155111).

Change:
```javascript
case 'lynx':
  // Check if Lynx has a Coordinator contract
  artifacts = lynxArtifacts['11155111'];
  break;
case 'tapir':
  // Check if Tapir has a Coordinator contract
  artifacts = tapirArtifacts['11155111'];
  break;
```

To:
```javascript
case 'lynx':
  artifacts = lynxArtifacts['80002'];
  break;
case 'tapir':
  artifacts = tapirArtifacts['80002'];
  break;
```

**Step 2: Fix RPC URL for ritual reads**

The `getRpcUrl()` function at line ~152 returns Sepolia RPC for lynx/tapir, but ritual reads need Polygon Amoy RPC. Add a `getRpcUrlForChain()` helper or modify `getAllRituals()` to use the correct RPC.

In `getAllRituals()`, after getting the coordinator, use the Polygon RPC for testnets:

```javascript
// For testnets, rituals are on Polygon Amoy, not Sepolia
let rpcUrl;
if (network === 'lynx' || network === 'tapir') {
  rpcUrl = import.meta.env.VITE_RPC_ETH_POLYGON || 'https://polygon-amoy.infura.io/v3/demo';
} else if (network === 'polygon') {
  rpcUrl = import.meta.env.VITE_RPC_ETH_POLYGON || 'https://polygon-rpc.com';
} else {
  rpcUrl = getRpcUrl(network);
}
```

Note: mainnet rituals are also on Polygon (chain 137), so check the mainnet path too. Currently `getCoordinator('mainnet')` looks at `mainnetArtifacts['1']` which has no Coordinator. The Coordinator is at `mainnetArtifacts['137']`. The existing `case 'polygon'` handles this but the default `case 'mainnet'` does not. Fix the default case to fall through to polygon:

```javascript
case 'mainnet':
default:
  // Coordinator is on Polygon for mainnet
  artifacts = mainnetArtifacts['137'];
  break;
```

And update `getAllRituals` to use Polygon RPC for mainnet too:
```javascript
let rpcUrl;
if (network === 'mainnet' || network === 'polygon') {
  rpcUrl = import.meta.env.VITE_RPC_ETH_POLYGON || 'https://polygon-rpc.com';
} else {
  // Lynx and Tapir rituals are on Polygon Amoy
  rpcUrl = import.meta.env.VITE_RPC_ETH_POLYGON || 'https://polygon-amoy.infura.io/v3/demo';
}
```

**Step 3: Commit**

```
git add src/utils/contractReader.js
git commit -m "fix: use correct chain IDs and RPC for DKG ritual loading (#5)"
```

---

### Task 2: Merge lynx signing artifacts & fix contracts page (Issue #7)

**Files:**
- Modify: `src/artifacts/lynx.json` (merge in signing contracts)
- Modify: `src/utils/contractReader.js:2` (change import)
- Delete: `src/artifacts/lynx-signing.json`

**Step 1: Merge lynx-signing.json into lynx.json**

`lynx-signing.json` has these extra contracts not in `lynx.json`:

Chain 11155111 extras: `OpL1Sender`, `SigningCoordinator`, `SigningCoordinatorChild`, `SigningCoordinatorDispatcher`, `ThresholdSigningMultisigCloneFactory`

Chain 80002: identical to lynx.json (no merge needed)

Chain 84532 (entirely new): `OpL2Receiver`, `SigningCoordinatorChild`, `ThresholdSigningMultisigCloneFactory`

Write a script or manually merge:
- Add the 5 extra contracts from `lynx-signing.json['11155111']` into `lynx.json['11155111']`
- Add the entire `lynx-signing.json['84532']` block into `lynx.json`
- Verify the chain 80002 entries are identical (they are)

**Step 2: Update contractReader.js import**

Change line 2:
```javascript
import lynxArtifacts from '../artifacts/lynx-signing.json';
```
To:
```javascript
import lynxArtifacts from '../artifacts/lynx.json';
```

**Step 3: Delete lynx-signing.json**

```
rm src/artifacts/lynx-signing.json
```

**Step 4: Verify no other imports reference lynx-signing.json**

Search the codebase for any remaining references.

**Step 5: Commit**

```
git add -A
git commit -m "fix: merge lynx signing artifacts into lynx.json (#7)"
```

---

### Task 3: Fix network switcher URLs (Issue #3)

**Files:**
- Modify: `.env.lynx` (remove duplicate URLs at lines 34-36)
- Modify: `.env.tapir` (remove duplicate URLs at lines 28-30)
- Modify: `src/components/NetworkSwitcher.jsx` (preserve path on switch)

**Step 1: Remove duplicate env vars**

In `.env.lynx`, delete these lines (34-36):
```
VITE_MAINNET_URL=https://tacoscan-7th5b.ondigitalocean.app/
VITE_LYNX_URL=https://tacoscan-lynx-3f5rb.ondigitalocean.app/contracts
VITE_TAPIR_URL=https://tacoscan-tapir-l92h3.ondigitalocean.app/
```

In `.env.tapir`, delete these lines (28-30):
```
VITE_MAINNET_URL=https://tacoscan-7th5b.ondigitalocean.app/
VITE_LYNX_URL=https://tacoscan-lynx-3f5rb.ondigitalocean.app/contracts
VITE_TAPIR_URL=https://tacoscan-tapir-l92h3.ondigitalocean.app/
```

**Step 2: Preserve current path on network switch**

In `src/components/NetworkSwitcher.jsx`, change `handleNetworkSwitch`:

```javascript
const handleNetworkSwitch = (url) => {
  // Preserve the current page path when switching networks
  const currentPath = window.location.pathname;
  const baseUrl = url.endsWith('/') ? url.slice(0, -1) : url;
  window.location.href = baseUrl + currentPath;
};
```

**Step 3: Commit**

```
git add .env.lynx .env.tapir src/components/NetworkSwitcher.jsx
git commit -m "fix: network switcher preserves path and uses correct URLs (#3)"
```

---

### Task 4: Fix network switcher fixed positioning (Issue #2)

**Files:**
- Modify: `src/App.css` or `src/index.css` (check for transform/will-change on ancestors)

**Step 1: Investigate the CSS**

The NetworkSwitcher CSS already has `position: fixed`. The issue is likely that the `.app` container or some ancestor has a CSS property that creates a new containing block (e.g., `transform`, `will-change`, `filter`, `perspective`). Check `src/index.css` - the `zoom: 0.9` on `html` may be the culprit. CSS `zoom` can affect fixed positioning in some browsers.

The zoom fix in Task 6 (removing `zoom: 0.9`) should resolve this. If it doesn't, we may need to move `<NetworkSwitcher />` to a portal or outside the `.app` div.

**Step 2: Verify after zoom removal**

After removing the zoom in Task 6, test that the network switcher stays fixed at bottom-right when scrolling.

**Step 3: Commit**

This will be committed together with Task 6 since the root cause is the same (`zoom: 0.9`).

---

### Task 5: Add copy button for conditions JSON (Issue #8)

**Files:**
- Modify: `src/pages/SigningCohortDetail.jsx:355-375` (JSON view section)

**Step 1: Add copy button to JSON container**

In `SigningCohortDetail.jsx`, find the JSON display section (the `if (showRawJson[chainId] && conditionData)` block around line 355). Add a copy button in the `jsonContainer` div:

```jsx
return (
  <div className={styles.jsonContainer}>
    <div className={styles.jsonHeader}>
      <button
        className={styles.copyJsonButton}
        onClick={() => {
          navigator.clipboard.writeText(JSON.stringify(conditionData, null, 2));
        }}
        title="Copy JSON to clipboard"
      >
        Copy JSON
      </button>
    </div>
    <pre
      className={styles.jsonContent}
      dangerouslySetInnerHTML={{ __html: formatJSON(conditionData) }}
    />
  </div>
);
```

**Step 2: Add CSS for the copy button**

In `src/pages/SigningCohortDetail.module.css`, add styles for `.jsonHeader` and `.copyJsonButton`:

```css
.jsonHeader {
  display: flex;
  justify-content: flex-end;
  padding: 8px 12px 0;
}

.copyJsonButton {
  padding: 4px 12px;
  background: var(--color-primary-bg, #FFFFFF);
  border: 1px solid var(--color-border-default, #E5E7EB);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.75rem;
  color: var(--color-secondary-text, #6B7280);
  cursor: pointer;
  transition: all 0.2s ease;
}

.copyJsonButton:hover {
  background: rgba(150, 255, 94, 0.1);
  border-color: var(--color-primary-accent, #96FF5E);
  color: var(--color-primary-text, #0A0A0A);
}
```

**Step 3: Commit**

```
git add src/pages/SigningCohortDetail.jsx src/pages/SigningCohortDetail.module.css
git commit -m "feat: add copy button for conditions JSON (#8)"
```

---

### Task 6: Fix full-width layout (Issue #4)

**Files:**
- Modify: `src/index.css` (remove zoom hack)
- Modify: `src/App.css` (widen container)
- Modify: Multiple `*.module.css` files (widen containers)

**Step 1: Remove the zoom hack**

In `src/index.css`, delete the media query block:
```css
/* Apply 90% zoom on desktop only */
@media (min-width: 1024px) {
  html {
    zoom: 0.9;
    -moz-transform: scale(0.9);
    -moz-transform-origin: 0 0;
  }
}
```

**Step 2: Widen max-width containers**

In `src/App.css`, change `.container` max-width from `1400px` to `1600px`.

Do the same in all page module CSS files that have their own `.container`:
- `src/pages/Dashboard.module.css`
- `src/pages/RitualDetail.module.css`
- `src/pages/SigningCohortDetail.module.css`
- `src/pages/SigningCohorts.module.css`
- `src/pages/NetworkActivity.module.css`
- `src/pages/NodeDetail.module.css`
- `src/pages/SmartContracts.module.css`
- `src/components/layout/Header.module.css`
- `src/components/layout/Footer.module.css`

Also check `src/pages/home/ritual.jsx` and `src/pages/home/nodes.jsx` - they use inline `maxWidth: "1400px"` which should be updated to `"1600px"`.

**Step 3: Commit**

```
git add -A
git commit -m "fix: remove zoom hack and widen layout to 1600px (#4, #2)"
```

---

### Task 7: Fix condition interpreter context variables (Issue #1)

**Files:**
- Modify: `src/utils/conditionInterpreter/interpreters/contract.js`
- Modify: `src/utils/conditionInterpreter/interpreters/time.js`
- Modify: `src/utils/conditionInterpreter/interpreters/jsonRpc.js`

**Step 1: Add context variable detection to contract interpreter**

In `src/utils/conditionInterpreter/interpreters/contract.js`, import `parseContextVariable` from formatters:

```javascript
import { formatAddress, formatAmount, getChainName, parseContextVariable } from '../formatters.js';
```

Then in the parameters loop and return value test, check for context variables before formatting:

In the parameters loop (around line 60), before the existing formatting:
```javascript
// Check if this is a context variable reference
const ctxVar = parseContextVariable(param);
if (ctxVar.isContextVar) {
  fields.push({
    label: paramName,
    value: `:${ctxVar.varName}`,
    type: 'context-variable'
  });
  return; // skip normal formatting for this param
}
```

In the return value test section (around line 85), before formatting the value:
```javascript
const ctxVar = parseContextVariable(val);
if (ctxVar.isContextVar) {
  formattedValue = `:${ctxVar.varName}`;
} else if (typeof val === 'string' && val.startsWith('0x') && val.length === 42) {
  // ... existing address formatting
```

**Step 2: Add context variable detection to time interpreter**

In `src/utils/conditionInterpreter/interpreters/time.js`, import `parseContextVariable`:

```javascript
import { formatTimestamp, parseContextVariable } from '../formatters.js';
```

In the return value test section, check for context variables:
```javascript
const ctxVar = parseContextVariable(val);
if (ctxVar.isContextVar) {
  formattedValue = `:${ctxVar.varName}`;
} else if (!isNaN(val) && val >= 0) {
  // ... existing timestamp formatting
```

**Step 3: Add context variable detection to jsonRpc interpreter**

In `src/utils/conditionInterpreter/interpreters/jsonRpc.js`, import `parseContextVariable`:

```javascript
import { parseContextVariable } from '../formatters.js';
```

In the return value test section, check for context variables:
```javascript
let formattedValue = condition.returnValueTest.value;
const ctxVar = parseContextVariable(formattedValue);
if (ctxVar.isContextVar) {
  formattedValue = `:${ctxVar.varName}`;
}
```

**Step 4: Commit**

```
git add src/utils/conditionInterpreter/interpreters/
git commit -m "fix: detect context variable references in all condition interpreters (#1)"
```

---

### Task 8: Delete dead code and unused files

**Files:**
- Delete: `src/pages/home/index.jsx` (unused legacy page)
- Delete: `src/pages/home/ritualDetail.jsx` (unused - modern one is at `src/pages/RitualDetail.jsx`)
- Delete: `src/pages/home/nodeDetail.jsx` (unused - modern one is at `src/pages/NodeDetail.jsx`)
- Delete: `src/pages/home/userDetail.jsx` (unused)
- Delete: `src/pages/home/about.jsx` (unused)
- Delete: `src/artifacts/new-susbcription-mainnet.json` (unused, also misspelled)
- Delete: `src/artifacts/dashboard.json` (unused)
- Delete: `update-to-taco-style.sh` (one-off migration script)
- Delete: `update-colors.sh` (one-off migration script)
- Delete: `scripts/use-env.js` (unused - env switching is done via npm scripts)

**Step 1: Verify no imports reference the files being deleted**

Search for imports of each file. We already confirmed:
- `home/index.jsx`, `home/ritualDetail.jsx`, `home/nodeDetail.jsx`, `home/userDetail.jsx`, `home/about.jsx` - no imports from outside their directory
- `new-susbcription-mainnet.json`, `dashboard.json` - no imports
- Shell scripts - not referenced in code

Keep `src/pages/home/ritual.jsx`, `src/pages/home/nodes.jsx`, and `src/pages/home/styles.module.css` - these ARE actively used by App.jsx.

**Step 2: Delete the files**

```bash
rm src/pages/home/index.jsx
rm src/pages/home/ritualDetail.jsx
rm src/pages/home/nodeDetail.jsx
rm src/pages/home/userDetail.jsx
rm src/pages/home/about.jsx
rm src/artifacts/new-susbcription-mainnet.json
rm src/artifacts/dashboard.json
rm update-to-taco-style.sh
rm update-colors.sh
rm scripts/use-env.js
```

**Step 3: Commit**

```
git add -A
git commit -m "chore: remove unused legacy pages, artifacts, and scripts"
```

---

### Task 9: Fix contractRegistry.js (bonus cleanup)

**Files:**
- Modify: `src/utils/contractRegistry.js`

**Step 1: Fix registry loading**

The `contractRegistry.js` iterates `lynxArtifacts` entries but treats chain ID keys (like `'11155111'`) as contract names. The top-level keys are chain IDs, not contract names. It needs to iterate the nested structure:

Currently it does:
```javascript
Object.entries(lynxArtifacts).forEach(([name, data]) => {
  if (data && data.address) { ... }
});
```

But `lynxArtifacts` is `{ "11155111": { "TACoApplication": {...}, ... }, "80002": { ... } }` - the top-level values are chain objects, not contract objects. Fix to properly iterate:

```javascript
// Load Lynx contracts (all chains)
Object.entries(lynxArtifacts).forEach(([chainId, chainData]) => {
  if (chainData && typeof chainData === 'object') {
    Object.entries(chainData).forEach(([name, data]) => {
      if (data && data.address) {
        const info = extractContractInfo(data, name);
        if (info) {
          contractRegistry.lynx[info.address] = info;
        }
      }
    });
  }
});
```

Same fix for tapir and mainnet entries.

**Step 2: Commit**

```
git add src/utils/contractRegistry.js
git commit -m "fix: correctly iterate nested chain structure in contract registry"
```
