/**
 * Signing ABI Attribute Condition Interpreter
 *
 * Handles signing-abi-attribute conditions (calldata validation).
 * This is the most complex interpreter as it parses ABI validations.
 */

import { formatAddress, formatAmount, parseFunctionSignature, parseContextVariable, formatComparator } from '../formatters.js';

/**
 * Interpret a signing ABI attribute condition
 * @param {Object} condition
 * @param {number} [depth=0] - Nesting depth (unused but part of interface)
 * @param {number} [maxDepth=10] - Max depth (unused but part of interface)
 * @param {Object} [variableContext={}] - Map of variable names to their source info
 * @returns {InterpretedCondition}
 */
export function interpretSigningAbiAttribute(condition, depth = 0, maxDepth = 10, variableContext = {}) {
  const fields = [];
  const validations = [];

  // Process allowed ABI calls
  if (condition.abiValidation?.allowedAbiCalls) {
    for (const [signature, rules] of Object.entries(condition.abiValidation.allowedAbiCalls)) {
      const { name: funcName, params, paramTypes } = parseFunctionSignature(signature);

      fields.push({
        label: 'Function',
        value: `${funcName}(${params})`,
        type: 'function'
      });

      // Process each validation rule
      if (rules && rules.length > 0) {
        for (const rule of rules) {
          const validation = interpretValidationRule(rule, funcName, paramTypes, variableContext);
          if (validation) {
            validations.push(validation);
          }
        }
      }
    }
  }

  // Add validations as fields with full context info
  for (const v of validations) {
    const field = {
      label: v.label,
      operator: v.operator,
      value: v.value,
      type: v.type || 'text'
    };

    // Include context variable info and source info
    if (v.contextVar) {
      field.contextVar = v.contextVar;
      field.sourceInfo = v.sourceInfo;
    }
    if (v.fullAddress) {
      field.fullAddress = v.fullAddress;
    }
    if (v.children) {
      field.children = v.children;
    }

    fields.push(field);
  }

  return {
    type: 'signing-abi-attribute',
    label: 'Transaction Limit',
    fields,
    variableContext,
    raw: condition
  };
}

/**
 * Format a validation value, detecting context variables and looking up source info
 * @param {*} value - The raw value
 * @param {string} paramType - The parameter type (address, uint256, etc)
 * @param {Object} [variableContext={}] - Map of variable names to their source info
 * @returns {{display: string, contextVar?: string, sourceInfo?: Object, type: string, fullAddress?: string}}
 */
function formatValidationValue(value, paramType, variableContext = {}) {
  const ctxVar = parseContextVariable(value);

  if (ctxVar.isContextVar) {
    // Look up source info from the variable context
    const sourceInfo = variableContext[ctxVar.varName] || null;
    return {
      display: ctxVar.varName,
      contextVar: ctxVar.varName,
      sourceInfo,
      type: 'contextVar'
    };
  }

  // Format based on type
  if (paramType === 'address' || (typeof value === 'string' && value.startsWith('0x') && value.length === 42)) {
    return {
      display: formatAddress(value),
      fullAddress: value, // Keep full address for display
      type: 'address'
    };
  }

  if (paramType?.includes('uint') || paramType?.includes('int')) {
    const numVal = Number(value);
    if (numVal > 1e15) {
      const formatted = formatAmount(value);
      return {
        display: formatted.display,
        rawValue: value,
        type: 'amount'
      };
    }
    return {
      display: String(value),
      rawValue: value,
      type: 'amount'
    };
  }

  return {
    display: String(value),
    type: 'text'
  };
}

/**
 * Get a human-readable description of what a context variable represents
 * based on the field it's used in
 * @param {string} varName - The variable name
 * @param {string} fieldLabel - The field label where it's used
 * @returns {string}
 */
function getContextVarDescription(varName, fieldLabel) {
  // Try to infer meaning from variable name
  const nameLower = varName.toLowerCase();

  if (nameLower.includes('recipient') || nameLower.includes('to') || nameLower.includes('target')) {
    return 'recipient address from earlier step';
  }
  if (nameLower.includes('amount') || nameLower.includes('value')) {
    return 'amount extracted from earlier step';
  }
  if (nameLower.includes('token')) {
    return 'token address from earlier step';
  }
  if (nameLower.includes('sender') || nameLower.includes('from')) {
    return 'sender address from earlier step';
  }

  return 'value from earlier step';
}

/**
 * Interpret a single validation rule
 * @param {Object} rule
 * @param {string} funcName
 * @param {string[]} paramTypes
 * @param {Object} [variableContext={}] - Map of variable names to their source info
 * @returns {{label: string, operator: string, value: string, type?: string, contextVar?: string, sourceInfo?: Object}|null}
 */
function interpretValidationRule(rule, funcName, paramTypes, variableContext = {}) {
  const paramIndex = rule.parameterIndex;
  const paramType = paramTypes[paramIndex] || 'unknown';

  // Handle tuple parameters
  if (paramType.startsWith('(') && paramType.endsWith(')')) {
    return interpretTupleValidation(rule, funcName, paramType, variableContext);
  }

  // Handle execute-like functions with parameter comparisons
  if (isExecuteFunction(funcName) && rule.returnValueTest) {
    return interpretExecuteValidation(rule, paramIndex, rule.returnValueTest, variableContext);
  }

  // Token transfer patterns
  if ((funcName === 'transfer' || funcName === 'transferFrom') && rule.returnValueTest) {
    const amountIndex = funcName === 'transfer' ? 1 : 2;
    if (paramIndex === amountIndex) {
      const formatted = formatValidationValue(rule.returnValueTest.value, 'uint256', variableContext);
      return {
        label: 'Maximum Amount',
        operator: formatComparator(rule.returnValueTest.comparator),
        value: formatted.display,
        type: formatted.type,
        contextVar: formatted.contextVar,
        sourceInfo: formatted.sourceInfo
      };
    }
  }

  // Approve pattern
  if (funcName === 'approve' && paramIndex === 1 && rule.returnValueTest) {
    const formatted = formatValidationValue(rule.returnValueTest.value, 'uint256', variableContext);
    return {
      label: 'Approval Limit',
      operator: formatComparator(rule.returnValueTest.comparator),
      value: formatted.display,
      type: formatted.type,
      contextVar: formatted.contextVar,
      sourceInfo: formatted.sourceInfo
    };
  }

  // Swap patterns
  if ((funcName.includes('swap') || funcName.includes('Swap')) && rule.returnValueTest) {
    const label = paramType.includes('uint')
      ? (paramIndex === 0 ? 'Input Amount' : 'Min Output')
      : `Parameter [${paramIndex}]`;
    const formatted = formatValidationValue(rule.returnValueTest.value, paramType, variableContext);
    return {
      label,
      operator: formatComparator(rule.returnValueTest.comparator),
      value: formatted.display,
      type: formatted.type,
      contextVar: formatted.contextVar,
      sourceInfo: formatted.sourceInfo
    };
  }

  // Address parameter
  if (paramType === 'address' && rule.returnValueTest) {
    const formatted = formatValidationValue(rule.returnValueTest.value, 'address', variableContext);
    return {
      label: `Parameter [${paramIndex}] (address)`,
      operator: formatComparator(rule.returnValueTest.comparator),
      value: formatted.display,
      type: formatted.type,
      contextVar: formatted.contextVar,
      sourceInfo: formatted.sourceInfo
    };
  }

  // Numeric parameters
  if ((paramType.includes('uint') || paramType.includes('int')) && rule.returnValueTest) {
    const formatted = formatValidationValue(rule.returnValueTest.value, paramType, variableContext);
    return {
      label: `Parameter [${paramIndex}] (${paramType})`,
      operator: formatComparator(rule.returnValueTest.comparator),
      value: formatted.display,
      type: formatted.type,
      contextVar: formatted.contextVar,
      sourceInfo: formatted.sourceInfo
    };
  }

  // Generic fallback
  if (rule.returnValueTest) {
    const formatted = formatValidationValue(rule.returnValueTest.value, null, variableContext);
    return {
      label: `Parameter [${paramIndex}]`,
      operator: formatComparator(rule.returnValueTest.comparator),
      value: formatted.display,
      type: formatted.type,
      contextVar: formatted.contextVar,
      sourceInfo: formatted.sourceInfo
    };
  }

  // Nested ABI validation
  if (rule.nestedAbiValidation) {
    return interpretNestedAbiValidation(rule.nestedAbiValidation, paramIndex, variableContext);
  }

  return null;
}

/**
 * Interpret nested ABI validation (inner calldata)
 * @param {Object} nestedValidation
 * @param {number} paramIndex
 * @param {Object} [variableContext={}] - Map of variable names to their source info
 * @returns {{label: string, operator: string, value: string, type: string, children?: Array}}
 */
function interpretNestedAbiValidation(nestedValidation, paramIndex, variableContext = {}) {
  if (!nestedValidation.allowedAbiCalls) {
    return {
      label: `Inner Call [${paramIndex}]`,
      operator: 'has',
      value: 'validation rules',
      type: 'badge'
    };
  }

  const innerFunctions = Object.keys(nestedValidation.allowedAbiCalls);
  const children = [];

  for (const sig of innerFunctions) {
    const { name: innerFuncName, paramTypes: innerParamTypes } = parseFunctionSignature(sig);
    const innerRules = nestedValidation.allowedAbiCalls[sig] || [];

    for (const innerRule of innerRules) {
      const interpreted = interpretValidationRule(innerRule, innerFuncName, innerParamTypes, variableContext);
      if (interpreted) {
        children.push(interpreted);
      }
    }
  }

  return {
    label: 'Inner Call Validation',
    operator: 'allows',
    value: innerFunctions.map(sig => parseFunctionSignature(sig).name).join(', '),
    type: 'nested',
    children
  };
}

/**
 * Interpret validation for tuple parameters
 * @param {Object} rule
 * @param {string} funcName
 * @param {string} paramType
 * @param {Object} [variableContext={}] - Map of variable names to their source info
 * @returns {{label: string, operator: string, value: string, type?: string, contextVar?: string, sourceInfo?: Object}|null}
 */
function interpretTupleValidation(rule, funcName, paramType, variableContext = {}) {
  const tupleTypes = paramType.slice(1, -1).split(',').map(t => t.trim());

  if (rule.indexWithinTuple !== undefined) {
    const tupleFieldType = tupleTypes[rule.indexWithinTuple] || 'unknown';

    // Execute function patterns
    if (isExecuteFunction(funcName)) {
      // Index 0: target address
      if (rule.indexWithinTuple === 0 && tupleFieldType === 'address') {
        if (rule.returnValueTest) {
          const formatted = formatValidationValue(rule.returnValueTest.value, 'address', variableContext);
          return {
            label: 'Destination Address',
            operator: formatComparator(rule.returnValueTest.comparator),
            value: formatted.display,
            type: formatted.type,
            contextVar: formatted.contextVar,
            sourceInfo: formatted.sourceInfo,
            fullAddress: formatted.fullAddress
          };
        }
        return {
          label: 'Address',
          operator: '=',
          value: 'restricted',
          type: 'badge'
        };
      }

      // Index 1: value (uint256)
      if (rule.indexWithinTuple === 1 && tupleFieldType.includes('uint')) {
        if (rule.returnValueTest) {
          const formatted = formatValidationValue(rule.returnValueTest.value, 'uint256', variableContext);
          return {
            label: 'Max ETH per Transaction',
            operator: formatComparator(rule.returnValueTest.comparator),
            value: formatted.display,
            type: formatted.type,
            contextVar: formatted.contextVar,
            sourceInfo: formatted.sourceInfo
          };
        }
        return {
          label: 'Max ETH per Transaction',
          operator: '≤',
          value: '0',
          type: 'amount'
        };
      }

      // Index 2: calldata
      if (rule.indexWithinTuple === 2 && tupleFieldType === 'bytes') {
        // Check for nested ABI validation
        if (rule.nestedAbiValidation) {
          return interpretNestedAbiValidation(rule.nestedAbiValidation, rule.parameterIndex, variableContext);
        }
        return {
          label: 'Inner Call Data',
          operator: 'is',
          value: 'validated',
          type: 'badge'
        };
      }
    }

    // Generic tuple handling
    if (tupleFieldType.includes('uint') && rule.returnValueTest) {
      const formatted = formatValidationValue(rule.returnValueTest.value, tupleFieldType, variableContext);
      return {
        label: `Tuple[${rule.indexWithinTuple}]`,
        operator: formatComparator(rule.returnValueTest.comparator),
        value: formatted.display,
        type: formatted.type,
        contextVar: formatted.contextVar,
        sourceInfo: formatted.sourceInfo
      };
    }

    if (rule.returnValueTest) {
      const formatted = formatValidationValue(rule.returnValueTest.value, tupleFieldType, variableContext);
      return {
        label: `Tuple[${rule.indexWithinTuple}]`,
        operator: formatComparator(rule.returnValueTest.comparator),
        value: formatted.display,
        type: formatted.type,
        contextVar: formatted.contextVar,
        sourceInfo: formatted.sourceInfo
      };
    }
  }

  // Whole tuple comparison (often for execute functions)
  if (rule.returnValueTest && isExecuteFunction(funcName)) {
    const comp = rule.returnValueTest.comparator;
    if (comp === '<' || comp === '<=' || comp === '==') {
      const formatted = formatValidationValue(rule.returnValueTest.value, 'uint256', variableContext);
      return {
        label: 'Max Transaction Value',
        operator: formatComparator(comp),
        value: formatted.display,
        type: formatted.type,
        contextVar: formatted.contextVar,
        sourceInfo: formatted.sourceInfo
      };
    }
  }

  if (rule.returnValueTest) {
    const formatted = formatValidationValue(rule.returnValueTest.value, null, variableContext);
    return {
      label: 'Transaction Parameters',
      operator: formatComparator(rule.returnValueTest.comparator),
      value: formatted.display,
      type: formatted.type,
      contextVar: formatted.contextVar,
      sourceInfo: formatted.sourceInfo
    };
  }

  return null;
}

/**
 * Interpret validation for execute-like functions
 * @param {Object} rule
 * @param {number} paramIndex
 * @param {Object} returnValueTest
 * @param {Object} [variableContext={}] - Map of variable names to their source info
 * @returns {{label: string, operator: string, value: string, type?: string, contextVar?: string, sourceInfo?: Object}|null}
 */
function interpretExecuteValidation(rule, paramIndex, returnValueTest, variableContext = {}) {
  const comp = returnValueTest.comparator;
  const val = returnValueTest.value;

  // Parameter 0 with numeric comparison is often the value/amount
  if (paramIndex === 0 && (comp === '<' || comp === '<=' || comp === '>' || comp === '>=' || comp === '==')) {
    const formatted = formatValidationValue(val, 'uint256', variableContext);
    return {
      label: 'Max Transaction Value',
      operator: formatComparator(comp),
      value: formatted.display,
      type: formatted.type,
      contextVar: formatted.contextVar,
      sourceInfo: formatted.sourceInfo
    };
  }

  return null;
}

/**
 * Check if function name is an execute-like function
 * @param {string} funcName
 * @returns {boolean}
 */
function isExecuteFunction(funcName) {
  return ['execute', 'execTransaction', 'executeCall', 'exec'].includes(funcName);
}
