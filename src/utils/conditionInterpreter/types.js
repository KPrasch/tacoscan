/**
 * TACo Condition Interpreter - Type Definitions
 *
 * This module transforms TACo condition JSON into structured, human-readable data.
 */

/**
 * @typedef {'compound'|'sequential'|'ecdsa'|'jwt'|'time'|'contract'|'json'|'rpc'|'context'|'signing-attribute'|'signing-abi-attribute'} ConditionType
 */

/**
 * @typedef {'authorization'|'limits'|'mixed'} ConditionCategory
 */

/**
 * Field type hints for UI rendering
 * @typedef {'address'|'amount'|'timestamp'|'badge'|'text'|'publicKey'|'function'} FieldType
 */

/**
 * A key-value field in a condition
 * @typedef {Object} ConditionField
 * @property {string} label - Human-readable label
 * @property {string} value - Formatted display value
 * @property {FieldType} [type] - Type hint for special rendering
 */

/**
 * Return value test representation
 * @typedef {Object} ReturnValueTest
 * @property {string} comparator - Comparison operator (<, <=, ==, !=, >, >=)
 * @property {string} value - Formatted comparison value
 * @property {string} label - Human-readable label for what's being tested
 * @property {*} [rawValue] - Original value before formatting
 */

/**
 * Interpreted condition - the main output structure
 * @typedef {Object} InterpretedCondition
 * @property {string} type - The condition type identifier
 * @property {string} label - Human-readable type name
 * @property {ConditionField[]} fields - Key-value pairs for display
 * @property {ReturnValueTest} [test] - For conditions with returnValueTest
 * @property {'and'|'or'} [operator] - For compound conditions
 * @property {InterpretedCondition[]} [children] - Nested conditions (for compound/sequential)
 * @property {Object} raw - Original condition object for JSON view
 */

// Export empty object to make this a proper module
export {};
