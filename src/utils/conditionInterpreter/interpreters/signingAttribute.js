/**
 * Signing Attribute Condition Interpreter
 *
 * Handles signing attribute conditions (sender, nonce, balance checks).
 */

import { formatAmount, formatAddress } from '../formatters.js';

/**
 * Interpret a signing attribute condition
 * @param {Object} condition
 * @returns {InterpretedCondition}
 */
export function interpretSigningAttribute(condition) {
  const fields = [];
  let test = null;

  const attrName = condition.attributeName;

  if (attrName) {
    fields.push({
      label: 'Attribute',
      value: attrName,
      type: 'badge'
    });
  }

  // Return value test
  if (condition.returnValueTest) {
    let label = attrName || 'Value';
    let formattedValue = condition.returnValueTest.value;

    // Format based on attribute type
    if (attrName === 'balance') {
      const formatted = formatAmount(condition.returnValueTest.value);
      formattedValue = formatted.display;
      label = 'Balance';
    } else if (attrName === 'sender') {
      formattedValue = formatAddress(condition.returnValueTest.value);
      label = 'Sender';
    } else if (attrName === 'nonce') {
      label = 'Nonce';
    }

    test = {
      comparator: condition.returnValueTest.comparator,
      value: String(formattedValue),
      label,
      rawValue: condition.returnValueTest.value
    };
  }

  const result = {
    type: 'signing-attribute',
    label: 'Signing Attribute',
    fields,
    raw: condition
  };

  if (test) {
    result.test = test;
  }

  return result;
}
