/**
 * Compound and Sequential Condition Interpreter
 *
 * Handles compound (AND/OR) and sequential condition types.
 */

import { interpretConditionObject } from '../interpreter.js';

/**
 * Build source info describing where a variable's value comes from.
 * This is generic and doesn't assume specific implementations (like Discord).
 * It describes the condition type and any transformations applied.
 * @param {Object} condition - The condition that produces the variable
 * @param {Array} operations - Operations applied to the value
 * @param {string} varName - The variable name being assigned
 * @returns {{type: string, conditionType: string, operations: string, description: string}}
 */
function buildSourceInfo(condition, operations = [], varName = '') {
  const opNames = operations.map(op => op.operation).join(', ');
  const opSuffix = opNames ? `, ${opNames}` : '';
  const condType = condition.conditionType || 'unknown';

  // JSON/JSON-API condition
  if (condType === 'json' || condType === 'json-api') {
    return {
      type: 'json',
      conditionType: condType,
      operations: opNames,
      description: `JSON query result${opSuffix}`
    };
  }

  // RPC condition
  if (condType === 'rpc' || condition.endpoint) {
    return {
      type: 'rpc',
      conditionType: 'rpc',
      operations: opNames,
      description: `RPC call result${opSuffix}`
    };
  }

  // Contract condition
  if (condType === 'contract' || condition.contractAddress) {
    const funcName = condition.functionAbi?.name;
    const funcDesc = funcName ? ` (${funcName})` : '';
    return {
      type: 'contract',
      conditionType: 'contract',
      operations: opNames,
      description: `contract call${funcDesc}${opSuffix}`
    };
  }

  // Signing attribute
  if (condType === 'signing-attribute' || condition.attributeName) {
    const attr = condition.attributeName || '';
    const attrDesc = attr ? ` (${attr})` : '';
    return {
      type: 'signing',
      conditionType: 'signing-attribute',
      operations: opNames,
      description: `transaction attribute${attrDesc}${opSuffix}`
    };
  }

  // ECDSA signature
  if (condType.includes('ecdsa')) {
    return {
      type: 'ecdsa',
      conditionType: condType,
      operations: opNames,
      description: `signature verification${opSuffix}`
    };
  }

  // JWT
  if (condType.includes('jwt')) {
    return {
      type: 'jwt',
      conditionType: condType,
      operations: opNames,
      description: `JWT claim${opSuffix}`
    };
  }

  // Default fallback - just describe as step result
  return {
    type: 'step',
    conditionType: condType,
    operations: opNames,
    description: `step result${opSuffix}`
  };
}

/**
 * Interpret a compound or sequential condition
 * @param {Object} condition
 * @param {number} depth
 * @param {number} maxDepth
 * @param {Object} [variableContext={}] - Map of variable names to their source info
 * @returns {InterpretedCondition}
 */
export function interpretCompound(condition, depth, maxDepth, variableContext = {}) {
  const type = condition.conditionType || 'compound';
  const isSequential = type === 'sequential';

  // Handle sequential conditions with conditionVariables
  if (isSequential && condition.conditionVariables) {
    return interpretSequentialCondition(condition, depth, maxDepth, variableContext);
  }

  // Standard compound with operands
  const operator = condition.operator || 'and';
  const operands = condition.operands || [];

  const children = operands.map((operand, idx) => {
    const child = interpretConditionObject(operand, depth + 1, maxDepth, variableContext);
    child.index = idx + 1;
    return child;
  });

  const label = isSequential
    ? 'Sequential Check'
    : `${operator.toUpperCase()} Condition`;

  return {
    type,
    label,
    fields: [
      {
        label: 'Conditions',
        value: `${children.length} ${children.length === 1 ? 'condition' : 'conditions'}`,
        type: 'text'
      }
    ],
    operator: operator.toLowerCase(),
    children,
    variableContext,
    raw: condition
  };
}

/**
 * Interpret a sequential condition with conditionVariables
 * Sequential conditions define variables that can be used in subsequent conditions.
 * Builds a variableContext map that is passed to child conditions so they can
 * resolve where context variable references come from.
 * @param {Object} condition
 * @param {number} depth
 * @param {number} maxDepth
 * @param {Object} [parentContext={}] - Variable context from parent
 * @returns {InterpretedCondition}
 */
function interpretSequentialCondition(condition, depth, maxDepth, parentContext = {}) {
  const variables = condition.conditionVariables || [];
  const children = [];

  // Build variable context map - accumulates as we process each variable
  // This allows later steps to reference variables defined in earlier steps
  const variableContext = { ...parentContext };

  for (const varDef of variables) {
    const varName = varDef.varName || 'unknown';
    const innerCondition = varDef.condition;
    const operations = varDef.operations || [];

    if (innerCondition) {
      // Build source info for this variable BEFORE interpreting
      // so the variable context is available for the current step's children
      const sourceInfo = buildSourceInfo(innerCondition, operations);
      variableContext[varName] = sourceInfo;

      // Interpret the inner condition with the accumulated context
      const interpreted = interpretConditionObject(innerCondition, depth + 1, maxDepth, variableContext);

      // Add variable context
      interpreted.variableName = varName;
      interpreted.sourceInfo = sourceInfo;

      // Add operations if present
      if (operations.length > 0) {
        const opLabels = operations.map(op => op.operation).join(' → ');
        interpreted.fields.push({
          label: 'Operations',
          value: opLabels,
          type: 'badge'
        });
      }

      // Add variable assignment info
      interpreted.fields.unshift({
        label: 'Assigns to',
        value: `:${varName}`,
        type: 'badge'
      });

      children.push(interpreted);
    }
  }

  return {
    type: 'sequential',
    label: 'Sequential Check',
    fields: [
      {
        label: 'Steps',
        value: `${children.length} ${children.length === 1 ? 'step' : 'steps'}`,
        type: 'text'
      }
    ],
    operator: 'sequential',
    variableContext, // Include the full context for downstream use
    children,
    raw: condition
  };
}
