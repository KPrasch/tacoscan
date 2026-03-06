/**
 * ConditionRenderer — two-column interactive condition view
 *
 * Left column: human-readable explanation per clause
 * Right column: compact pseudocode block per clause
 * Hover highlights both sides simultaneously.
 */

import React, { useState } from 'react';
import styles from './ConditionRenderer.module.css';

// ── Type accent colors ────────────────────────────────────────────────────────
const TYPE_COLOR = {
  'ecdsa':                  '#9b7fe8',
  'jwt':                    '#b07fe8',
  'time':                   '#d4915a',
  'json':                   '#5b9bd5',
  'json-rpc':               '#5b9bd5',
  'context-variable':       '#888',
  'context':                '#888',
  'signing-attribute':      '#3a7d5e',
  'signing-abi-attribute':  '#c0564a',
  'contract':               '#c0564a',
  'compound':               '#999',
  'sequential':             '#5baaaa',
};

const typeColor = (t) => TYPE_COLOR[t] || '#999';

// Dominant accent color for a clause (first non-compound leaf type)
function accentColor(cond) {
  const t = cond?.conditionType || '';
  if (t === 'compound') {
    const first = (cond.operands || [])[0];
    return accentColor(first);
  }
  if (t === 'sequential') {
    const first = (cond.conditionVariables || [])[0]?.condition;
    return accentColor(first);
  }
  return typeColor(t);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const short = (addr) =>
  addr && addr.length > 12 ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : (addr || '');

const testStr = (rvt) => (rvt ? ` ${rvt.comparator} ${rvt.value}` : '');

const opsStr = (operations) =>
  (operations || [])
    .map((o) => {
      if (o.operation === 'create2') {
        return `create2(${short(o.value?.deployerAddress || '')})`;
      }
      const v = typeof o.value === 'string' ? o.value.slice(0, 20) : (o.value ?? '');
      return `${o.operation}${v}`;
    })
    .join(' ');

// ── Compact one-line pseudocode per leaf ──────────────────────────────────────
function leafLine(cond) {
  const t = cond.conditionType || '';
  if (t === 'ecdsa') {
    const msg = cond.message ? `  ${cond.message}` : '';
    return `ecdsa(${cond.curve || 'Ed25519'}, ${short(cond.verifyingKey)}${msg})`;
  }
  if (t === 'json' || t === 'json-rpc') {
    const q = (cond.query || cond.endpoint || '').slice(0, 40);
    const ops = opsStr(cond.operations);
    return `json(${q}${ops ? ', ' + ops : ''})${testStr(cond.returnValueTest)}`;
  }
  if (t === 'time') {
    return `time(${opsStr(cond.operations)})${testStr(cond.returnValueTest)}`;
  }
  if (t === 'context-variable' || t === 'context') {
    const ops = opsStr(cond.operations);
    return `ctx(${cond.contextVariable || ''})${ops ? '  ' + ops : ''}`;
  }
  if (t === 'signing-attribute') {
    return `signing.${cond.attributeName || ''}${testStr(cond.returnValueTest)}`;
  }
  if (t === 'signing-abi-attribute') {
    const fn = Object.keys(cond.abiValidation?.allowedAbiCalls || {})[0] || 'execute(…)';
    return `txlimit.${fn.replace(/\s+/g, '')}`;
  }
  if (t === 'jwt') return `jwt(${cond.parameterPath || ''})${testStr(cond.returnValueTest)}`;
  if (t === 'contract') {
    return `contract(${short(cond.contractAddress)}.${cond.functionAbi?.name || ''})${testStr(cond.returnValueTest)}`;
  }
  return t || 'condition';
}

const typeLabel = (t) =>
  t.replace('signing-abi-attribute', 'txlimit')
   .replace('signing-attribute', 'signing')
   .replace('context-variable', 'ctx')
   .replace('json-rpc', 'json');

// ── Pseudocode block components ───────────────────────────────────────────────
function SeqBlock({ cond, forceOpen }) {
  const [open, setOpen] = useState(true);
  const steps = cond.conditionVariables || [];
  const isOpen = forceOpen !== undefined ? forceOpen : open;

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={() => setOpen((o) => !o)}>
        <span className={styles.keyword} style={{ color: typeColor('sequential') }}>seq</span>
        <span className={styles.opBrace}>{isOpen ? '{' : '{ '}</span>
        {!isOpen && <span className={styles.collapsedPreview}>{steps.length} steps</span>}
        {!isOpen && <span className={styles.opBrace}>}</span>}
        <span className={styles.chevron}>{isOpen ? '▾' : '▸'}</span>
      </div>
      {isOpen && (
        <div className={styles.blockBody}>
          {steps.map((step, i) => {
            const sc = step.condition || step;
            const t = sc.conditionType || '';
            return (
              <div key={i} className={styles.seqStep}>
                <span className={styles.stepNum}>{i + 1}</span>
                <span className={styles.varName}>:{step.varName}</span>
                <span className={styles.stepSummary} style={{ color: typeColor(t) }}>
                  {leafLine(sc)}
                </span>
              </div>
            );
          })}
          <div className={styles.closeBrace}><span className={styles.opBrace}>{'}'}</span></div>
        </div>
      )}
    </div>
  );
}

function CompoundBlock({ cond, depth = 0 }) {
  const [open, setOpen] = useState(true);
  const op = (cond.operator || 'and').toLowerCase();
  const operands = cond.operands || [];

  return (
    <div className={styles.block}>
      <div className={styles.blockHeader} onClick={() => setOpen((o) => !o)}>
        <span className={styles.keyword} style={{ color: depth === 0 ? '#888' : typeColor('compound') }}>
          {op}
        </span>
        <span className={styles.opBrace}>{open ? '{' : '{ '}</span>
        {!open && <span className={styles.collapsedPreview}>{operands.length} conditions</span>}
        {!open && <span className={styles.opBrace}>}</span>}
        <span className={styles.chevron}>{open ? '▾' : '▸'}</span>
      </div>
      {open && (
        <div className={styles.blockBody}>
          {operands.map((operand, i) => (
            <CondNode key={i} cond={operand} depth={depth + 1} />
          ))}
          <div className={styles.closeBrace}><span className={styles.opBrace}>{'}'}</span></div>
        </div>
      )}
    </div>
  );
}

function LeafNode({ cond }) {
  const t = cond.conditionType || '';
  return (
    <div className={styles.leafLine}>
      <span className={styles.typeBadge} style={{ color: typeColor(t) }}>{typeLabel(t)}</span>
      <span className={styles.leafText}>{leafLine(cond)}</span>
    </div>
  );
}

function CondNode({ cond, depth = 0 }) {
  if (!cond) return null;
  const t = cond.conditionType || '';
  if (t === 'compound') return <CompoundBlock cond={cond} depth={depth} />;
  if (t === 'sequential') return <SeqBlock cond={cond} />;
  return <LeafNode cond={cond} />;
}

// ── Human-readable summarizer ─────────────────────────────────────────────────

// Extract token symbol from a variable name like "amountUSDC", "amountETH", "amountSend"
function extractToken(varName) {
  const upper = varName.toUpperCase();
  const known = ['USDC', 'USDT', 'ETH', 'DAI', 'WETH', 'WBTC', 'BTC'];
  for (const t of known) if (upper.includes(t)) return t;
  return null;
}

// Get minimum amount from a json-type step's returnValueTest
function extractAmount(step) {
  const rvt = step?.condition?.returnValueTest;
  if (!rvt) return null;
  const comp = rvt.comparator;
  if (comp === '>=' || comp === '>' || comp === '==') return `${comp} ${rvt.value}`;
  return null;
}

// Classify recipient derivation method from a sequential block
function recipientPath(steps) {
  const hasContract = steps.some((s) => s.condition?.conditionType === 'contract');
  const hasSalt = steps.some((s) => (s.varName || '').toLowerCase().includes('salt'));
  if (hasContract || hasSalt) return 'contract-derived';
  return 'direct';
}

function summarizeSeq(cond) {
  const steps = cond.conditionVariables || [];
  const varNames = steps.map((s) => (s.varName || '').toLowerCase());
  const types = steps.map((s) => s.condition?.conditionType || '');

  if (types.includes('signing-abi-attribute')) {
    // Find amount step
    const amtStep = steps.find((s) => {
      const v = (s.varName || '').toLowerCase();
      return v.includes('amount') || v.includes('value');
    });
    const token = amtStep ? extractToken(amtStep.varName || '') : null;
    const amt = amtStep ? extractAmount(amtStep) : null;
    const path = recipientPath(steps);
    const hasRecipient = steps.some((s) => {
      const v = (s.varName || '').toLowerCase();
      return v.includes('recipient') || v.includes('receiver') || v.includes('to');
    });

    const tokenStr = token ? `${token} transfer` : 'Token transfer';
    const amtStr = amt ? ` ${amt}` : '';
    const pathStr = hasRecipient ? `, ${path} recipient` : '';

    return {
      title: `${tokenStr}${amtStr}`,
      detail: `Whitelisted execute call${pathStr}`,
    };
  }

  if (
    types.includes('time') &&
    varNames.some((v) => v.includes('account') || v.includes('sender') || v.includes('discord') || v.includes('age'))
  ) {
    return {
      title: 'Signatory identity verified',
      detail: 'Discord account age check, sender address authenticated',
    };
  }

  if (types.includes('time')) {
    return { title: 'Time-bounded access', detail: 'Valid within a defined time window' };
  }

  return { title: `${steps.length}-step verification`, detail: 'Sequential data checks' };
}

function summarizeClause(cond) {
  if (!cond) return { title: '?', detail: '' };
  const t = cond.conditionType || '';

  if (t === 'compound') {
    const op = (cond.operator || 'and').toLowerCase();
    const operands = cond.operands || [];
    if (op === 'or') {
      // All ECDSA
      const allEcdsa = operands.length > 0 && operands.every((o) => o.conditionType === 'ecdsa');
      if (allEcdsa) {
        const msg = (operands[0]?.message || '').toLowerCase();
        const src = msg.includes('discord') ? 'Discord' : '';
        return {
          title: `${src ? src + ' s' : 'S'}ignatories — any ${operands.length} of ${operands.length}`,
          detail: `Valid signature from any one of ${operands.length} authorized keys`,
        };
      }
      // All sequential tx-limit blocks — describe the shared token + diverging paths
      const allSeqTx = operands.every((o) => {
        const steps = o.conditionVariables || [];
        return o.conditionType === 'sequential' &&
          steps.some((s) => s.condition?.conditionType === 'signing-abi-attribute');
      });
      if (allSeqTx) {
        // Find token from first operand
        const firstSteps = operands[0].conditionVariables || [];
        const amtStep = firstSteps.find((s) => {
          const v = (s.varName || '').toLowerCase();
          return v.includes('amount') || v.includes('value');
        });
        const token = amtStep ? extractToken(amtStep.varName || '') : null;
        const amt = amtStep ? extractAmount(amtStep) : null;
        const paths = operands.map((o) => recipientPath(o.conditionVariables || []));
        const uniquePaths = [...new Set(paths)];
        const tokenStr = token ? `${token} transfer` : 'Token transfer';
        const amtStr = amt ? ` ${amt}` : '';
        return {
          title: `${tokenStr}${amtStr}`,
          detail: `${uniquePaths.join(' or ')} recipient — any valid path`,
        };
      }
      const parts = operands.map((o) => summarizeClause(o).title);
      return { title: `Any of ${operands.length} conditions`, detail: parts.join(' or ') };
    }
    // AND
    const parts = operands.map((o) => summarizeClause(o).title);
    return { title: 'All conditions must pass', detail: parts.join(', ') };
  }

  if (t === 'sequential') return summarizeSeq(cond);

  if (t === 'ecdsa') {
    const msg = (cond.message || '').toLowerCase();
    const src = msg.includes('discord') ? 'Discord ' : '';
    return { title: `${src}ECDSA signature`, detail: short(cond.verifyingKey) };
  }

  if (t === 'json' || t === 'json-rpc') {
    const q = cond.query || cond.endpoint || '';
    if (q.includes('user.id')) return { title: 'Discord member check', detail: 'Membership status verified via API' };
    return { title: 'Data query', detail: q.slice(0, 40) };
  }

  if (t === 'time') return { title: 'Time window', detail: 'Access bounded by time constraints' };

  if (t === 'signing-attribute') {
    const attr = cond.attributeName || '';
    return { title: `Signing check: ${attr}`, detail: `${attr} ${cond.returnValueTest?.comparator || '=='} ${cond.returnValueTest?.value || ''}` };
  }

  if (t === 'signing-abi-attribute') {
    const fn = Object.keys(cond.abiValidation?.allowedAbiCalls || {})[0] || '';
    return { title: 'Transaction whitelist', detail: fn };
  }

  if (t === 'jwt') return { title: 'JWT token required', detail: cond.parameterPath || '' };
  if (t === 'contract') return { title: 'On-chain check', detail: short(cond.contractAddress) };

  return { title: t, detail: '' };
}

// ── Two-column clause row ─────────────────────────────────────────────────────
function ClauseRow({ cond, index, accent }) {
  const [hovered, setHovered] = useState(false);
  const { title, detail } = summarizeClause(cond);

  return (
    <div
      className={`${styles.clauseRow} ${hovered ? styles.clauseRowHovered : ''}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Left: explanation */}
      <div className={styles.explainCol}>
        <span className={styles.clauseDot} style={{ background: accent }} />
        <div className={styles.explainContent}>
          <div className={styles.explainTitle}>{title}</div>
          {detail && <div className={styles.explainDetail}>{detail}</div>}
        </div>
      </div>

      {/* Right: pseudocode */}
      <div className={styles.codeCol}>
        <CondNode cond={cond} depth={0} />
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ConditionRenderer({ conditionData }) {
  if (!conditionData) return null;
  const condition = conditionData.condition || conditionData;
  const t = condition.conditionType || '';

  // Top-level AND: each operand gets its own paired row
  if (t === 'compound' && (condition.operator || 'and').toLowerCase() === 'and') {
    const operands = condition.operands || [];
    return (
      <div className={styles.root}>
        {operands.map((operand, i) => (
          <ClauseRow
            key={i}
            cond={operand}
            index={i}
            accent={accentColor(operand)}
          />
        ))}
      </div>
    );
  }

  // Single clause
  return (
    <div className={styles.root}>
      <ClauseRow cond={condition} index={0} accent={accentColor(condition)} />
    </div>
  );
}
