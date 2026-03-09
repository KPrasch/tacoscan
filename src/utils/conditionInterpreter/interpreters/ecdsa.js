/**
 * ECDSA Condition Interpreter
 *
 * Handles ECDSA signature verification conditions.
 */

import { formatAddress } from '../formatters.js';

/**
 * Interpret an ECDSA condition
 * @param {Object} condition
 * @returns {InterpretedCondition}
 */
export function interpretEcdsa(condition) {
  const fields = [];

  if (condition.verifyingKey) {
    fields.push({
      label: 'Public Key',
      value: `${formatAddress(condition.verifyingKey)} ... ${formatAddress(condition.verifyingKey)}`,
      type: 'publicKey'
    });
  }

  if (condition.curve) {
    fields.push({
      label: 'Curve',
      value: condition.curve,
      type: 'badge'
    });
  }

  if (condition.message) {
    fields.push({
      label: 'Message',
      value: condition.message,
      type: 'text'
    });
  }

  return {
    type: 'ecdsa',
    label: 'ECDSA Signature',
    fields,
    raw: condition
  };
}
