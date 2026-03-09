/**
 * Context Condition Interpreter
 *
 * Handles context variable conditions.
 */

import { formatAddress } from '../formatters.js';

/**
 * Interpret a context condition
 * @param {Object} condition
 * @returns {InterpretedCondition}
 */
export function interpretContext(condition) {
  const fields = [];

  if (condition.contextVariables) {
    for (const [key, value] of Object.entries(condition.contextVariables)) {
      // Format addresses specially
      const isAddress = key === ':userAddress' || key === ':signerAddress' ||
                       (typeof value === 'string' && value.startsWith('0x') && value.length === 42);

      fields.push({
        label: key,
        value: isAddress ? formatAddress(value) : String(value),
        type: isAddress ? 'address' : 'text'
      });
    }
  }

  return {
    type: 'context',
    label: 'Context Variables',
    fields,
    raw: condition
  };
}
