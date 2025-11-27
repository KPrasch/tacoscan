/**
 * TACo Condition Interpreter - Main Entry Point
 *
 * Transforms TACo condition JSON into structured, human-readable data.
 */

import { interpretCompound } from './interpreters/compound.js';
import { interpretEcdsa } from './interpreters/ecdsa.js';
import { interpretJwt } from './interpreters/jwt.js';
import { interpretTime } from './interpreters/time.js';
import { interpretContract } from './interpreters/contract.js';
import { interpretJsonRpc } from './interpreters/jsonRpc.js';
import { interpretContext } from './interpreters/context.js';
import { interpretSigningAttribute } from './interpreters/signingAttribute.js';
import { interpretSigningAbiAttribute } from './interpreters/signingAbiAttribute.js';

/**
 * Interpreter registry - maps condition types to their interpreters
 * Order matters: more specific types should come before general ones
 */
const interpreterRegistry = [
  { canHandle: (c) => c.conditionType === 'compound' || c.conditionType === 'sequential', interpret: interpretCompound },
  { canHandle: (c) => c.conditionType?.toLowerCase().includes('ecdsa'), interpret: interpretEcdsa },
  { canHandle: (c) => c.conditionType?.toLowerCase().includes('jwt'), interpret: interpretJwt },
  { canHandle: (c) => c.conditionType?.toLowerCase().includes('time') || c.timeframe, interpret: interpretTime },
  { canHandle: (c) => c.conditionType === 'signing-abi-attribute' || (c.attributeName === 'call_data' && c.abiValidation), interpret: interpretSigningAbiAttribute },
  { canHandle: (c) => c.conditionType === 'signing-attribute' || (c.attributeName && !c.abiValidation), interpret: interpretSigningAttribute },
  { canHandle: (c) => c.conditionType?.toLowerCase().includes('contract') || c.contractAddress, interpret: interpretContract },
  { canHandle: (c) => c.conditionType?.toLowerCase().includes('json') || c.conditionType?.toLowerCase().includes('rpc') || c.endpoint, interpret: interpretJsonRpc },
  { canHandle: (c) => c.conditionType?.toLowerCase().includes('context') || c.contextVariables, interpret: interpretContext },
];

/**
 * Categorize a condition as authorization or limits
 * @param {Object} condition - The condition object
 * @returns {'authorization'|'limits'|'mixed'}
 */
export function categorizeCondition(condition) {
  if (!condition || !condition.conditionType) {
    return 'authorization';
  }

  const type = condition.conditionType.toLowerCase();

  // Authorization conditions
  if (
    type.includes('ecdsa') ||
    type.includes('jwt') ||
    (type.includes('time') && !condition.returnValueTest) ||
    type.includes('context') ||
    (type.includes('json-rpc') && condition.endpoint?.includes('auth'))
  ) {
    return 'authorization';
  }

  // Transaction/Usage limits
  if (
    type.includes('signing-abi-attribute') ||
    (type.includes('contract') && condition.returnValueTest?.comparator?.includes('<')) ||
    (condition.attributeName === 'call_data' && condition.abiValidation) ||
    (condition.functionAbi?.name && ['transfer', 'approve', 'execute'].includes(condition.functionAbi.name))
  ) {
    return 'limits';
  }

  // Compound conditions - check operands
  if ((type === 'compound' || type === 'sequential') && condition.operands) {
    const categories = condition.operands
      .map((op) => categorizeCondition(op))
      .filter(Boolean);
    if (categories.every((c) => c === 'authorization')) return 'authorization';
    if (categories.every((c) => c === 'limits')) return 'limits';
    return 'mixed';
  }

  // Sequential conditions with conditionVariables
  if (type === 'sequential' && condition.conditionVariables) {
    const categories = condition.conditionVariables
      .map((cv) => categorizeCondition(cv.condition))
      .filter(Boolean);
    if (categories.every((c) => c === 'authorization')) return 'authorization';
    if (categories.every((c) => c === 'limits')) return 'limits';
    return 'mixed';
  }

  return 'authorization'; // Default
}

/**
 * Find the appropriate interpreter for a condition
 * @param {Object} condition
 * @returns {Function|null}
 */
function findInterpreter(condition) {
  for (const entry of interpreterRegistry) {
    if (entry.canHandle(condition)) {
      return entry.interpret;
    }
  }
  return null;
}

/**
 * Interpret a condition object recursively
 * @param {Object} condition - The condition object
 * @param {number} [depth=0] - Current nesting depth
 * @param {number} [maxDepth=10] - Maximum depth to interpret
 * @param {Object} [variableContext={}] - Map of variable names to their source info
 * @returns {InterpretedCondition}
 */
export function interpretConditionObject(condition, depth = 0, maxDepth = 10, variableContext = {}) {
  if (!condition || typeof condition !== 'object') {
    return {
      type: 'unknown',
      label: 'Unknown',
      fields: [],
      variableContext,
      raw: condition
    };
  }

  // Depth limit
  if (depth > maxDepth) {
    return {
      type: 'nested',
      label: 'Nested Policies',
      fields: [{ label: 'Note', value: 'Additional nested policies', type: 'text' }],
      variableContext,
      raw: condition
    };
  }

  // Find appropriate interpreter
  const interpret = findInterpreter(condition);

  if (interpret) {
    const result = interpret(condition, depth, maxDepth, variableContext);
    // Ensure variableContext is attached to the result
    result.variableContext = result.variableContext || variableContext;
    return result;
  }

  // Fallback: generic object rendering
  const result = interpretGeneric(condition);
  result.variableContext = variableContext;
  return result;
}

/**
 * Generic interpreter for unknown condition types
 * @param {Object} condition
 * @returns {InterpretedCondition}
 */
function interpretGeneric(condition) {
  const type = condition.conditionType || 'unknown';
  const fields = [];

  // Extract known simple fields
  for (const [key, value] of Object.entries(condition)) {
    if (key === 'conditionType' || key === 'raw') continue;
    if (typeof value !== 'object' && value !== null && value !== undefined) {
      fields.push({
        label: key,
        value: String(value),
        type: 'text'
      });
    }
  }

  return {
    type,
    label: type,
    fields,
    raw: condition
  };
}

/**
 * Main entry point - interpret a condition (or ConditionExpression wrapper)
 * @param {Object} conditionData - Raw condition JSON or ConditionExpression
 * @returns {InterpretedCondition|null}
 */
export function interpretCondition(conditionData) {
  if (!conditionData) return null;

  // Handle ConditionExpression wrapper
  const condition = conditionData.condition || conditionData;

  return interpretConditionObject(condition, 0, 10);
}

/**
 * Flatten a condition tree into a list of all conditions
 * @param {InterpretedCondition} condition
 * @returns {InterpretedCondition[]}
 */
export function flattenConditions(condition) {
  if (!condition) return [];

  const result = [condition];

  if (condition.children && condition.children.length > 0) {
    for (const child of condition.children) {
      result.push(...flattenConditions(child));
    }
  }

  return result;
}

/**
 * Group conditions by category
 * @param {InterpretedCondition[]} conditions
 * @returns {{authorization: InterpretedCondition[], limits: InterpretedCondition[]}}
 */
export function groupByCategory(conditions) {
  const authorization = [];
  const limits = [];

  for (const condition of conditions) {
    const category = categorizeCondition(condition.raw);
    if (category === 'limits') {
      limits.push(condition);
    } else {
      authorization.push(condition);
    }
  }

  return { authorization, limits };
}
