/**
 * TACo Condition Interpreter - Formatters
 *
 * Utility functions for formatting values in condition interpretation.
 */

/**
 * Format an address with ellipsis truncation
 * @param {string} address - The address to format
 * @returns {string} Truncated address
 */
export function formatAddress(address) {
  if (!address || address.length < 10) {
    return address || '';
  }
  const first = address.slice(0, 7);
  const last = address.slice(-5);
  return `${first} ... ${last}`;
}

/**
 * Format a wei value to ETH
 * @param {string|number} weiValue - Value in wei
 * @param {number} [decimals=18] - Token decimals
 * @param {string} [unit='ETH'] - Unit label
 * @returns {{display: string, raw: string}}
 */
export function formatAmount(weiValue, decimals = 18, unit = 'ETH') {
  if (weiValue === null || weiValue === undefined) {
    return { display: '0', raw: '0' };
  }

  const raw = String(weiValue);
  const value = Number(weiValue);

  // If value is small enough, just show it directly
  if (value < 1e15 && decimals === 18) {
    return { display: raw, raw };
  }

  const divisor = Math.pow(10, decimals);
  const converted = value / divisor;

  // Format with appropriate precision
  let display;
  if (converted >= 1) {
    display = `${converted.toFixed(6)} ${unit}`;
  } else if (converted >= 0.001) {
    display = `${converted.toFixed(9)} ${unit}`;
  } else {
    display = `${raw} wei`;
  }

  return { display, raw };
}

/**
 * Format a timestamp to human-readable date with relative time
 * @param {number} timestamp - Unix timestamp in seconds
 * @returns {{absolute: string, relative: string, raw: number, isPast: boolean}}
 */
export function formatTimestamp(timestamp) {
  if (timestamp === null || timestamp === undefined) {
    return { absolute: '', relative: '', raw: 0, isPast: false };
  }

  const raw = Number(timestamp);
  const date = new Date(raw * 1000);
  const now = new Date();
  const diffMs = date - now;
  const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  const absolute = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;

  let relative;
  if (raw === 0) {
    relative = 'epoch';
  } else if (diffMs > 0) {
    if (diffDays > 0) {
      relative = `in ${diffDays} day${diffDays !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      relative = `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else {
      relative = 'soon';
    }
  } else {
    if (diffDays > 0) {
      relative = `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else if (diffHours > 0) {
      relative = `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else {
      relative = 'recently';
    }
  }

  return {
    absolute,
    relative,
    raw,
    isPast: diffMs < 0
  };
}

/**
 * Parse a function signature into name and parameters
 * @param {string} signature - Function signature like "transfer(address,uint256)"
 * @returns {{name: string, params: string, paramTypes: string[]}}
 */
export function parseFunctionSignature(signature) {
  if (!signature) {
    return { name: '', params: '', paramTypes: [] };
  }

  const match = signature.match(/^(\w+)\((.*)\)$/);
  if (!match) {
    return { name: signature, params: '', paramTypes: [] };
  }

  const name = match[1];
  const params = match[2];

  // Split parameters respecting nested parentheses (tuples)
  const paramTypes = [];
  let current = '';
  let depth = 0;

  for (const char of params) {
    if (char === '(') depth++;
    if (char === ')') depth--;

    if (char === ',' && depth === 0) {
      if (current.trim()) {
        paramTypes.push(current.trim());
      }
      current = '';
    } else {
      current += char;
    }
  }

  if (current.trim()) {
    paramTypes.push(current.trim());
  }

  return { name, params, paramTypes };
}

/**
 * Get chain name from chain ID
 * @param {number|string} chainId
 * @returns {string}
 */
export function getChainName(chainId) {
  const chains = {
    1: 'Ethereum',
    137: 'Polygon',
    11155111: 'Sepolia',
    80002: 'Polygon Amoy',
    84532: 'Base Sepolia'
  };
  return chains[Number(chainId)] || `Chain ${chainId}`;
}

/**
 * Format a value based on its apparent type
 * @param {*} value - The value to format
 * @param {string} [hint] - Type hint (address, amount, etc)
 * @returns {string}
 */
export function formatValue(value, hint) {
  if (value === null || value === undefined) {
    return '';
  }

  // Address hint
  if (hint === 'address' || (typeof value === 'string' && value.startsWith('0x') && value.length === 42)) {
    return formatAddress(value);
  }

  // Amount hint or large number
  if (hint === 'amount' || (!isNaN(value) && Number(value) > 1e15)) {
    return formatAmount(value).display;
  }

  // Boolean
  if (value === true || value === 'true') return 'True';
  if (value === false || value === 'false') return 'False';

  return String(value);
}

/**
 * Check if a value is a context variable reference (starts with :)
 * @param {*} value - The value to check
 * @returns {{isContextVar: boolean, varName?: string, rawValue?: string}}
 */
export function parseContextVariable(value) {
  if (typeof value === 'string' && value.startsWith(':')) {
    const varName = value.slice(1); // Remove leading colon
    return {
      isContextVar: true,
      varName,
      rawValue: value
    };
  }
  return {
    isContextVar: false,
    rawValue: String(value)
  };
}

/**
 * Format a comparator to a more readable symbol
 * @param {string} comparator - The raw comparator (==, <=, etc)
 * @returns {string} Human-readable comparator
 */
export function formatComparator(comparator) {
  const map = {
    '==': '=',
    '!=': '≠',
    '<': '<',
    '<=': '≤',
    '>': '>',
    '>=': '≥'
  };
  return map[comparator] || comparator;
}
