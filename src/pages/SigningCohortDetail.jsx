import React, { useEffect, useState, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './SigningCohortDetail.module.css';
import { formatString, formatDate, calculateTimeMoment } from './data';
import { getSigningCohortDetails } from '../utils/contractReader';
import { getCurrentNetwork } from '../utils/dataSource';

// Helper function to render condition details
const renderConditionDetails = (conditionData) => {
  if (!conditionData) return null;

  // If it has a condition property (from ConditionExpression)
  if (conditionData.condition) {
    return renderConditionObject(conditionData.condition);
  }

  // Otherwise render the object directly
  return renderConditionObject(conditionData);
};

// Recursively render condition objects with depth limit
const renderConditionObject = (obj, depth = 0) => {
  if (!obj || typeof obj !== 'object') {
    return <span className={styles.conditionValue}>{String(obj)}</span>;
  }

  // Limit nesting depth to prevent overwhelming UI
  const MAX_DEPTH = 1;  // Reduced from 3 to 1 for much flatter display
  if (depth > MAX_DEPTH) {
    return (
      <div className={styles.depthLimited}>
        <span className={styles.depthLimitedMessage}>
          [+ More conditions]
        </span>
      </div>
    );
  }

  // Special handling for known condition types
  if (obj.conditionType) {
    const conditionType = obj.conditionType;

    // Get condition icon and color based on type
    const getConditionStyle = (type) => {
      if (type.includes('contract')) return { icon: '📜', color: styles.typeContract };
      if (type.includes('time')) return { icon: '⏰', color: styles.typeTime };
      if (type.includes('compound')) return { icon: '🔗', color: styles.typeCompound };
      if (type.includes('jwt')) return { icon: '🔑', color: styles.typeJwt };
      if (type.includes('json')) return { icon: '📊', color: styles.typeJson };
      if (type.includes('rpc')) return { icon: '🌐', color: styles.typeRpc };
      if (type.includes('context')) return { icon: '📍', color: styles.typeContext };
      if (type.includes('signing')) return { icon: '✍️', color: styles.typeSigning };
      return { icon: '📋', color: styles.typeDefault };
    };

    const style = getConditionStyle(conditionType.toLowerCase());

    // Get human-readable description of what the condition checks
    const getConditionDescription = () => {
      const descriptions = [];

      // ECDSA conditions
      if (conditionType.toLowerCase().includes('ecdsa')) {
        if (obj.verifyingKey) {
          descriptions.push(`Verifying signature from key: ${formatString(obj.verifyingKey)}`);
        }
        if (obj.curve) {
          descriptions.push(`Using curve: ${obj.curve}`);
        }
      }

      // Signing attribute conditions
      if (conditionType === 'signing-attribute' || obj.attributeName) {
        const attrName = obj.attributeName;
        if (attrName === 'sender') {
          descriptions.push('Checking transaction sender address');
        } else if (attrName === 'nonce') {
          descriptions.push('Checking account nonce value');
        } else if (attrName === 'balance') {
          descriptions.push('Checking ETH balance');
        } else if (attrName) {
          descriptions.push(`Checking attribute: ${attrName}`);
        }
      }

      // Signing ABI attribute conditions (calldata checks)
      if (conditionType === 'signing-abi-attribute' || obj.abiValidation) {
        if (obj.attributeName === 'call_data' && obj.abiValidation?.allowedAbiCalls) {
          const abiCalls = Object.entries(obj.abiValidation.allowedAbiCalls);
          if (abiCalls.length > 0) {
            const [signature, validations] = abiCalls[0];

            // Parse function signature
            const funcMatch = signature.match(/^(\w+)\(/);
            const funcName = funcMatch ? funcMatch[1] : signature;

            // Check for common patterns
            if (funcName === 'transfer' || funcName === 'transferFrom') {
              descriptions.push('Limiting transfer amount');
            } else if (funcName === 'approve') {
              descriptions.push('Limiting approval amount');
            } else if (funcName === 'swap' || funcName.includes('swap')) {
              descriptions.push('Setting swap limits');
            } else if (funcName === 'withdraw') {
              descriptions.push('Limiting withdrawal amount');
            } else if (funcName === 'stake' || funcName === 'unstake') {
              descriptions.push(`Limiting ${funcName} amount`);
            } else if (funcName === 'execute' || funcName === 'execTransaction') {
              // Multi-sig or proxy execution patterns
              if (validations && validations.length > 0) {
                // Check if limiting value in tuple
                const hasValueLimit = validations.some(v =>
                  v.indexWithinTuple === 1 || // uint256 value in tuple
                  (v.parameterIndex === 0 && v.returnValueTest) // or checking the whole tuple
                );
                if (hasValueLimit) {
                  descriptions.push('Limiting transaction value/amount');
                } else {
                  descriptions.push('Validating execution parameters');
                }
              }
            } else if (funcName === 'multicall' || funcName === 'batchExecute') {
              descriptions.push('Validating batch operations');
            } else {
              descriptions.push(`Validating ${funcName} parameters`);
            }
          }
        } else if (obj.attributeName === 'call_data') {
          descriptions.push('Validating transaction calldata');
        }
      }

      // Contract conditions with specific functions
      if (obj.functionAbi?.name) {
        const funcName = obj.functionAbi.name;
        if (funcName === 'balanceOf') {
          descriptions.push('Checking token balance');
        } else if (funcName === 'ownerOf') {
          descriptions.push('Checking NFT ownership');
        } else if (funcName === 'hasRole') {
          descriptions.push('Checking role-based access');
        } else if (funcName === 'allowance') {
          descriptions.push('Checking token allowance');
        } else if (funcName === 'totalSupply') {
          descriptions.push('Checking total supply');
        } else if (funcName === 'isMember' || funcName === 'members') {
          descriptions.push('Checking membership status');
        }
      }

      // Time-based conditions
      if (obj.timeframe || conditionType.toLowerCase().includes('time')) {
        if (obj.timeframe?.start && obj.timeframe?.end) {
          descriptions.push('Checking time window validity');
        } else if (obj.timeframe?.start) {
          descriptions.push('Checking if time has passed');
        } else if (obj.timeframe?.end) {
          descriptions.push('Checking if before deadline');
        }
      }

      // JWT conditions
      if (conditionType.toLowerCase().includes('jwt')) {
        if (obj.issuer) {
          descriptions.push(`JWT issuer must be: ${obj.issuer}`);
        }
        if (obj.audience) {
          descriptions.push(`JWT audience must include: ${obj.audience}`);
        }
      }

      return descriptions;
    };

    const descriptions = getConditionDescription();

    return (
      <div className={styles.conditionBlock}>
        <div className={`${styles.conditionHeader} ${style.color}`}>
          <span className={styles.conditionIcon}>{style.icon}</span>
          <span className={styles.conditionTypeName}>{conditionType}</span>
        </div>

        {/* ECDSA-specific fields */}
        {obj.verifyingKey && (
          <div className={styles.conditionSection}>
            {descriptions.length > 0 && (
              <div className={styles.conditionDescription}>
                {descriptions[0]}
              </div>
            )}
            <div className={styles.sectionTitle}>SIGNATURE VERIFICATION</div>
            <div className={styles.conditionField}>
              <span className={styles.fieldLabel}>Public Key:</span>
              <span className={styles.publicKey}>{formatString(obj.verifyingKey)} ... {formatString(obj.verifyingKey)}</span>
            </div>
            {obj.curve && (
              <div className={styles.conditionField}>
                <span className={styles.fieldLabel}>Curve:</span>
                <span className={styles.curveBadge}>{obj.curve}</span>
              </div>
            )}
            {obj.message && (
              <div className={styles.conditionField}>
                <span className={styles.fieldLabel}>Message:</span>
                <span className={styles.fieldValue}>{obj.message}</span>
              </div>
            )}
          </div>
        )}

        {/* Signing Attribute fields */}
        {obj.attributeName && !obj.abiValidation && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>Signing Attribute Check</div>
            <div className={styles.conditionField}>
              <span className={styles.fieldLabel}>Attribute:</span>
              <span className={styles.attributeBadge}>{obj.attributeName}</span>
            </div>
            {obj.returnValueTest && (
              <div className={styles.testExpression}>
                <span className={styles.testLabel}>{obj.attributeName}</span>
                <span className={styles.testOperator}>{obj.returnValueTest.comparator}</span>
                <span className={styles.testValue}>
                  {obj.attributeName === 'balance' ?
                    `${obj.returnValueTest.value / 1e18} ETH` :
                    obj.returnValueTest.value}
                </span>
              </div>
            )}
          </div>
        )}

        {/* Signing ABI Attribute fields (calldata validation) */}
        {obj.abiValidation?.allowedAbiCalls && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>
              {obj.attributeName === 'call_data' ? 'Transaction Calldata Validation' : 'ABI Validation'}
            </div>
            {Object.entries(obj.abiValidation.allowedAbiCalls).map(([signature, validations]) => {
              // Parse the function signature
              const funcMatch = signature.match(/^(\w+)\((.*)\)$/);
              const funcName = funcMatch ? funcMatch[1] : signature;
              const funcParams = funcMatch ? funcMatch[2] : '';

              // Helper to properly split parameters respecting nested parentheses (tuples)
              const splitParams = (params) => {
                const result = [];
                let current = '';
                let depth = 0;

                for (let char of params) {
                  if (char === '(') depth++;
                  if (char === ')') depth--;

                  if (char === ',' && depth === 0) {
                    result.push(current.trim());
                    current = '';
                  } else {
                    current += char;
                  }
                }

                if (current.trim()) {
                  result.push(current.trim());
                }

                return result;
              };

              // Determine what's being limited based on function name and validations
              const getValidationDescription = () => {
                if (!validations || validations.length === 0) return null;

                const descriptions = [];

                for (const validation of validations) {
                  const paramIndex = validation.parameterIndex;
                  const paramTypes = splitParams(funcParams);
                  const paramType = paramTypes[paramIndex] || 'unknown';


                  // Handle tuple parameters (common in execute functions)
                  if (paramType.startsWith('(') && paramType.endsWith(')')) {
                    const tupleTypes = paramType.slice(1, -1).split(',').map(t => t.trim());

                    if (validation.indexWithinTuple !== undefined) {
                      const tupleFieldType = tupleTypes[validation.indexWithinTuple] || 'unknown';

                      // Smart detection for execute patterns
                      if (funcName === 'execute' || funcName === 'execTransaction') {
                        if (validation.indexWithinTuple === 0 && tupleFieldType === 'address') {
                          descriptions.push({
                            label: 'Target Contract',
                            operator: validation.returnValueTest?.comparator || '==',
                            value: validation.returnValueTest ? formatString(validation.returnValueTest.value) : 'restricted'
                          });
                        } else if (validation.indexWithinTuple === 1 && tupleFieldType.includes('uint')) {
                          const amount = validation.returnValueTest?.value || 0;
                          const formattedAmount = `${(amount / 1e18).toFixed(6)} ETH`;
                          descriptions.push({
                            label: 'Maximum Value',
                            operator: validation.returnValueTest?.comparator || '<=',
                            value: formattedAmount
                          });
                        } else if (validation.indexWithinTuple === 2 && tupleFieldType === 'bytes') {
                          descriptions.push({
                            label: 'Calldata',
                            operator: 'is',
                            value: 'validated'
                          });
                        }
                      } else {
                        // Generic tuple handling
                        const fieldLabel = `Tuple[${validation.indexWithinTuple}]`;
                        if (tupleFieldType.includes('uint') && validation.returnValueTest) {
                          const val = validation.returnValueTest.value;
                          const formattedVal = val > 1e15 ? `${(val / 1e18).toFixed(4)}` : val;
                          descriptions.push({
                            label: fieldLabel,
                            operator: validation.returnValueTest.comparator,
                            value: formattedVal
                          });
                        } else if (validation.returnValueTest) {
                          descriptions.push({
                            label: fieldLabel,
                            operator: validation.returnValueTest.comparator,
                            value: validation.returnValueTest.value
                          });
                        }
                      }
                    } else if (validation.returnValueTest) {
                      // Checking the entire tuple parameter
                      // For execute functions, when checking the whole tuple with < operator,
                      // this is checking the value (uint256) field of the tuple
                      if ((funcName === 'execute' || funcName === 'execTransaction' || funcName === 'executeCall') &&
                          (validation.returnValueTest.comparator === '<' ||
                           validation.returnValueTest.comparator === '<=' ||
                           validation.returnValueTest.comparator === '==')) {

                        const amount = validation.returnValueTest.value;
                        // Format the amount properly
                        let formattedAmount;
                        if (typeof amount === 'string' && amount.length > 15) {
                          // Large number, likely in wei
                          const ethValue = parseInt(amount) / 1e18;
                          formattedAmount = `${ethValue.toFixed(6)} ETH`;
                        } else {
                          // Always use ETH denomination
                          formattedAmount = `${(amount / 1e18).toFixed(9)} ETH`;
                        }

                        descriptions.push({
                          label: 'Maximum Transaction Value',
                          operator: validation.returnValueTest.comparator,
                          value: formattedAmount
                        });
                      } else if (paramType.includes('uint') && validation.returnValueTest.comparator === '<') {
                        // Generic uint comparison that's likely an amount
                        const amount = validation.returnValueTest.value;
                        const formattedAmount = `${(amount / 1e18).toFixed(9)} ETH`;
                        descriptions.push({
                          label: 'Maximum Value',
                          operator: validation.returnValueTest.comparator,
                          value: formattedAmount
                        });
                      } else {
                        descriptions.push({
                          label: 'Transaction Parameters',
                          operator: validation.returnValueTest.comparator,
                          value: validation.returnValueTest.value
                        });
                      }
                    }
                  }
                  // Common token function patterns
                  else if ((funcName === 'transfer' || funcName === 'transferFrom') &&
                           paramIndex === (funcName === 'transfer' ? 1 : 2)) {
                    if (validation.returnValueTest) {
                      const amount = validation.returnValueTest.value;
                      const formattedAmount = amount > 1e15 ? `${(amount / 1e18).toFixed(4)} tokens` : amount;
                      descriptions.push({
                        label: 'Maximum Amount',
                        operator: validation.returnValueTest.comparator,
                        value: formattedAmount
                      });
                    }
                  } else if (funcName === 'approve' && paramIndex === 1) {
                    if (validation.returnValueTest) {
                      const amount = validation.returnValueTest.value;
                      const formattedAmount = amount > 1e15 ? `${(amount / 1e18).toFixed(4)} tokens` : amount;
                      descriptions.push({
                        label: 'Approval Limit',
                        operator: validation.returnValueTest.comparator,
                        value: formattedAmount
                      });
                    }
                  }
                  // DeFi patterns
                  else if ((funcName.includes('swap') || funcName.includes('Swap')) && validation.returnValueTest) {
                    const label = paramType.includes('uint') ?
                      (paramIndex === 0 ? 'Input Amount' : 'Min Output') :
                      `Parameter [${paramIndex}]`;
                    const val = validation.returnValueTest.value;
                    const formattedVal = paramType.includes('uint') && val > 1e15 ?
                      `${(val / 1e18).toFixed(4)} tokens` : val;
                    descriptions.push({
                      label,
                      operator: validation.returnValueTest.comparator,
                      value: formattedVal
                    });
                  }
                  // Special case: execute/execTransaction functions where parameter[0] < value is checking transaction amount
                  // This applies when:
                  // 1. It's an execute-like function
                  // 2. We're checking parameter 0 with a numeric comparison
                  // 3. The value looks like a wei amount
                  else if ((funcName === 'execute' || funcName === 'execTransaction' || funcName === 'executeCall') &&
                           paramIndex === 0 &&
                           validation.returnValueTest &&
                           (validation.returnValueTest.comparator === '<' ||
                            validation.returnValueTest.comparator === '<=' ||
                            validation.returnValueTest.comparator === '>' ||
                            validation.returnValueTest.comparator === '>=' ||
                            validation.returnValueTest.comparator === '==') &&
                           validation.returnValueTest.value) {
                    // This is checking the transaction value
                    const amount = validation.returnValueTest.value;
                    let formattedAmount;
                    if (typeof amount === 'string' && amount.length > 15) {
                      const ethValue = parseInt(amount) / 1e18;
                      formattedAmount = `${ethValue.toFixed(6)} ETH`;
                    } else {
                      // Always use ETH denomination
                      formattedAmount = `${(amount / 1e18).toFixed(9)} ETH`;
                    }

                    descriptions.push({
                      label: 'Maximum Transaction Value',
                      operator: validation.returnValueTest.comparator,
                      value: formattedAmount
                    });
                  }
                  // Generic parameter handling
                  else if (paramType === 'address' && validation.returnValueTest) {
                    descriptions.push({
                      label: `Parameter [${paramIndex}] (address)`,
                      operator: validation.returnValueTest.comparator,
                      value: formatString(validation.returnValueTest.value)
                    });
                  } else if ((paramType.includes('uint') || paramType.includes('int')) && validation.returnValueTest) {
                    const val = validation.returnValueTest.value;
                    const formattedVal = val > 1e15 ? `${(val / 1e18).toFixed(4)}` : val;
                    descriptions.push({
                      label: `Parameter [${paramIndex}] (${paramType})`,
                      operator: validation.returnValueTest.comparator,
                      value: formattedVal
                    });
                  } else if (validation.returnValueTest) {
                    descriptions.push({
                      label: `Parameter [${paramIndex}]`,
                      operator: validation.returnValueTest.comparator,
                      value: validation.returnValueTest.value
                    });
                  }

                  // Handle nested validations
                  if (validation.nestedAbiValidation) {
                    descriptions.push({
                      label: `Nested validation at [${paramIndex}]`,
                      operator: 'has',
                      value: 'additional checks'
                    });
                  }
                }

                return descriptions;
              };

              const validationDescriptions = getValidationDescription();

              return (
                <div key={signature} className={styles.abiCallValidation}>
                  <div className={styles.functionSignature}>
                    <span className={styles.functionName}>{funcName}</span>
                    <span className={styles.functionParams}> ({funcParams})</span>
                  </div>

                  {validationDescriptions && validationDescriptions.length > 0 && (
                    <div className={styles.validationsList}>
                      {validationDescriptions.map((desc, idx) => (
                        <div key={idx} className={styles.validationItem}>
                          <span className={styles.validationLabel}>{desc.label}:</span>
                          <span className={styles.validationOperator}> {desc.operator} </span>
                          <span className={styles.validationValue}>{desc.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Contract-specific fields */}
        {obj.contractAddress && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>Contract Details</div>
            <div className={styles.conditionField}>
              <span className={styles.fieldLabel}>Address:</span>
              <a
                href={`https://etherscan.io/address/${obj.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.addressLink}
              >
                {formatString(obj.contractAddress)}
              </a>
            </div>
            {obj.chain && (
              <div className={styles.conditionField}>
                <span className={styles.fieldLabel}>Chain:</span>
                <span className={styles.chainBadge}>
                  {obj.chain === 1 ? 'Ethereum' :
                   obj.chain === 137 ? 'Polygon' :
                   obj.chain === 11155111 ? 'Sepolia' :
                   obj.chain === 80002 ? 'Polygon Amoy' :
                   obj.chain === 84532 ? 'Base Sepolia' :
                   `Chain ${obj.chain}`}
                </span>
              </div>
            )}
            {obj.standardContractType && (
              <div className={styles.conditionField}>
                <span className={styles.fieldLabel}>Standard:</span>
                <span className={styles.standardBadge}>{obj.standardContractType}</span>
              </div>
            )}
          </div>
        )}

        {/* Function ABI */}
        {obj.functionAbi && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>Function Call</div>
            <div className={styles.functionSignature}>
              <span className={styles.functionName}>{obj.functionAbi.name}</span>
              {obj.functionAbi.inputs && obj.functionAbi.inputs.length > 0 && (
                <span className={styles.functionParams}>
                  ({obj.functionAbi.inputs.map(i => `${i.type} ${i.name || ''}`).join(', ')})
                </span>
              )}
            </div>
            {obj.parameters && obj.parameters.length > 0 && (
              <div className={styles.parametersList}>
                <div className={styles.fieldLabel}>Parameters:</div>
                {obj.parameters.map((param, idx) => {
                  const input = obj.functionAbi?.inputs?.[idx];
                  const paramName = input?.name || `param${idx}`;
                  const paramType = input?.type || 'unknown';

                  // Format parameter value based on type
                  let displayValue = param;
                  if (paramType === 'address' && typeof param === 'string') {
                    displayValue = formatString(param);
                  } else if (paramType.includes('uint') && !isNaN(param)) {
                    // Check if it's likely a token amount (18 decimals)
                    if (param > 1e15) {
                      displayValue = `${(param / 1e18).toFixed(4)} (wei: ${param})`;
                    }
                  }

                  return (
                    <div key={idx} className={styles.parameter}>
                      <span className={styles.paramName}>{paramName}:</span>
                      <span className={styles.paramValue}>
                        {typeof displayValue === 'object' ? JSON.stringify(displayValue) : String(displayValue)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Return Value Test */}
        {obj.returnValueTest && !obj.attributeName && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>EXPECTED RESULT</div>
            <div className={styles.testExpression}>
              <span className={styles.testLabel}>
                {(() => {
                  // Check if this is a time-related condition
                  const condType = conditionType.toLowerCase();
                  if (condType.includes('time')) {
                    // For time conditions, interpret the comparison
                    const comp = obj.returnValueTest.comparator;

                    if (comp === '<' || comp === '<=') {
                      return 'Before';
                    } else if (comp === '>' || comp === '>=') {
                      return 'After';
                    }
                    return 'Time';
                  }

                  // Other function-specific labels
                  if (obj.functionAbi?.name === 'balanceOf') return 'Balance';
                  if (obj.functionAbi?.name === 'ownerOf') return 'Owner';
                  if (obj.functionAbi?.name === 'hasRole') return 'Has Role';
                  if (obj.functionAbi?.name === 'allowance') return 'Allowance';
                  return 'Result';
                })()}
              </span>
              <span className={styles.testOperator}>{obj.returnValueTest.comparator}</span>
              <span className={styles.testValue}>
                {(() => {
                  const val = obj.returnValueTest.value;
                  const condType = conditionType.toLowerCase();

                  // Special handling for time conditions
                  if (condType.includes('time')) {
                    // Handle all numeric values as timestamps, including 0
                    if (!isNaN(val) && val >= 0) {
                      const date = new Date(val * 1000);

                      // For epoch 0, just show the date without relative time
                      if (val === 0) {
                        return `0 (${date.toLocaleDateString()} ${date.toLocaleTimeString()})`;
                      }

                      const now = new Date();
                      const diffMs = date - now;
                      const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
                      const diffHours = Math.floor((Math.abs(diffMs) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

                      // Show both relative and absolute time
                      let relative = '';
                      if (diffMs > 0) {
                        if (diffDays > 0) {
                          relative = `in ${diffDays} day${diffDays !== 1 ? 's' : ''}, ${diffHours}h`;
                        } else if (diffHours > 0) {
                          relative = `in ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
                        } else {
                          relative = 'soon';
                        }
                      } else {
                        if (diffDays < 0) {
                          relative = `${Math.abs(diffDays)} day${Math.abs(diffDays) !== 1 ? 's' : ''} ago`;
                        } else if (diffHours < 0) {
                          relative = `${Math.abs(diffHours)} hour${Math.abs(diffHours) !== 1 ? 's' : ''} ago`;
                        } else {
                          relative = 'recently';
                        }
                      }

                      return (
                        <span title={date.toLocaleString()}>
                          {val} ({date.toLocaleDateString()} - {relative})
                        </span>
                      );
                    }
                  }

                  // Format addresses
                  if (typeof val === 'string' && val.startsWith('0x') && val.length === 42) {
                    return formatString(val);
                  }
                  // Format large numbers (likely token amounts)
                  if (!isNaN(val) && val > 1e15) {
                    return `${(val / 1e18).toFixed(4)} tokens`;
                  }
                  // Format boolean results
                  if (val === true || val === 'true') return '✓ True';
                  if (val === false || val === 'false') return '✗ False';
                  return val;
                })()}
              </span>
            </div>
          </div>
        )}

        {/* Time conditions */}
        {obj.timeframe && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>TIMEFRAME</div>
            <div className={styles.timeRange}>
              {obj.timeframe.start && (
                <div className={styles.conditionField}>
                  <span className={styles.fieldLabel}>Start:</span>
                  <span className={styles.timeValue}>
                    {(() => {
                      const date = new Date(obj.timeframe.start * 1000);
                      const now = new Date();
                      const diffMs = date - now;
                      const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

                      const relative = diffMs > 0 ?
                        `in ${diffDays} days` :
                        `${diffDays} days ago`;

                      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()} (${relative})`;
                    })()}
                  </span>
                </div>
              )}
              {obj.timeframe.end && (
                <div className={styles.conditionField}>
                  <span className={styles.fieldLabel}>End:</span>
                  <span className={styles.timeValue}>
                    {(() => {
                      const date = new Date(obj.timeframe.end * 1000);
                      const now = new Date();
                      const diffMs = date - now;
                      const diffDays = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));

                      const relative = diffMs > 0 ?
                        `in ${diffDays} days` :
                        `${diffDays} days ago`;

                      return `${date.toLocaleDateString()} ${date.toLocaleTimeString()} (${relative})`;
                    })()}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Context variables */}
        {obj.contextVariables && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>Context Variables</div>
            {Object.entries(obj.contextVariables).map(([key, value]) => (
              <div key={key} className={styles.conditionField}>
                <span className={styles.fieldLabel}>{key}:</span>
                <span className={styles.contextValue}>
                  {key === ':userAddress' || key === ':signerAddress' ?
                    formatString(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* JWT specific fields */}
        {(obj.issuer || obj.audience || obj.subject) && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>JWT Requirements</div>
            {obj.issuer && (
              <div className={styles.conditionField}>
                <span className={styles.fieldLabel}>Issuer:</span>
                <span className={styles.fieldValue}>{obj.issuer}</span>
              </div>
            )}
            {obj.audience && (
              <div className={styles.conditionField}>
                <span className={styles.fieldLabel}>Audience:</span>
                <span className={styles.fieldValue}>{obj.audience}</span>
              </div>
            )}
            {obj.subject && (
              <div className={styles.conditionField}>
                <span className={styles.fieldLabel}>Subject:</span>
                <span className={styles.fieldValue}>{obj.subject}</span>
              </div>
            )}
          </div>
        )}

        {/* Compound condition operands - show with operator between */}
        {obj.operands && obj.operands.length > 0 && (
          <div className={styles.conditionSection}>
            {depth === 0 ? (
              // Top level - show full operands with operator between
              <div className={styles.compoundContainer}>
                {obj.operands.map((operand, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <div className={styles.operatorDivider}>
                        <span className={styles.operatorText}>
                          {obj.operator ? obj.operator.toUpperCase() : 'AND'}
                        </span>
                      </div>
                    )}
                    <div className={styles.operandBlock}>
                      <span className={styles.operandNumber}>{idx + 1}</span>
                      <div className={styles.operandConditionContent}>
                        {renderConditionObject(operand, depth + 1)}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            ) : (
              // Nested - show compact inline display
              <div className={styles.compactCompound}>
                {obj.operands.map((operand, idx) => (
                  <React.Fragment key={idx}>
                    {idx > 0 && (
                      <span className={styles.inlineOperator}>
                        {obj.operator ? obj.operator.toLowerCase() : 'and'}
                      </span>
                    )}
                    <span className={styles.compactCondition}>
                      {operand.conditionType || 'condition'}
                    </span>
                  </React.Fragment>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Method and endpoint for RPC/JSON conditions */}
        {obj.endpoint && (
          <div className={styles.conditionSection}>
            <div className={styles.sectionTitle}>API Details</div>
            <div className={styles.conditionField}>
              <span className={styles.fieldLabel}>Endpoint:</span>
              <span className={styles.endpointUrl}>{obj.endpoint}</span>
            </div>
            {obj.method && (
              <div className={styles.conditionField}>
                <span className={styles.fieldLabel}>Method:</span>
                <span className={styles.methodBadge}>{obj.method}</span>
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Default object rendering
  return (
    <div className={styles.conditionsList}>
      {Object.entries(obj).map(([key, value]) => (
        <div key={key} className={styles.conditionItem}>
          <span className={styles.conditionKey}>{key}:</span>
          {typeof value === 'object' ? (
            <div className={styles.nestedValue}>
              {renderConditionObject(value)}
            </div>
          ) : (
            <span className={styles.conditionValue}>{String(value)}</span>
          )}
        </div>
      ))}
    </div>
  );
};

const SigningCohortDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cohort, setCohort] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showRawJson, setShowRawJson] = useState({});

  useEffect(() => {
    const fetchCohortDetails = async () => {
      try {
        const network = getCurrentNetwork();
        console.log(`Fetching cohort ${id} details for ${network}...`);

        const cohortData = await getSigningCohortDetails(id, network);

        if (!cohortData) {
          setError('Cohort not found');
        } else {
          setCohort(cohortData);
        }
      } catch (error) {
        console.error('Error fetching cohort details:', error);
        setError('Failed to load cohort details');
      } finally {
        setLoading(false);
      }
    };

    fetchCohortDetails();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.cohortDetail}>
        <div className={styles.container}>
          <div className={styles.loading}>Loading cohort details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.cohortDetail}>
        <div className={styles.container}>
          <div className={styles.error}>
            <h2>Error</h2>
            <p>{error}</p>
            <button onClick={() => navigate('/cohorts')} className={styles.backButton}>
              Back to Cohorts
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.cohortDetail}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <div className={styles.breadcrumb}>
              <a href="/cohorts" className={styles.breadcrumbLink}>Signing Cohorts</a>
              <span className={styles.breadcrumbSeparator}>/</span>
              <span className={styles.breadcrumbCurrent}>Cohort #{id}</span>
            </div>
            <h1 className={styles.title}>Signing Cohort #{id}</h1>
            <div className={styles.headerStats}>
              <div className={styles.headerStat}>
                <span className={styles.headerStatLabel}>Status</span>
                <span className={`${styles.status} ${cohort?.isActive ? styles.active : styles.inactive}`}>
                  {cohort?.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.headerStatLabel}>State</span>
                <span className={styles.headerStatValue}>{cohort?.state || 'Unknown'}</span>
              </div>
              <div className={styles.headerStat}>
                <span className={styles.headerStatLabel}>Threshold</span>
                <span className={styles.headerStatValue}>
                  {cohort?.threshold} of {cohort?.signersCount}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className={styles.mainContent}>
          {/* Overview Card */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Overview</h2>
            <div className={styles.cardContent}>
              <div className={styles.infoGrid}>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Cohort ID</span>
                  <span className={styles.infoValue}>{cohort?.id}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Total Signers</span>
                  <span className={styles.infoValue}>{cohort?.signersCount}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Signature Threshold</span>
                  <span className={styles.infoValue}>{cohort?.threshold}</span>
                </div>
                <div className={styles.infoItem}>
                  <span className={styles.infoLabel}>Active Status</span>
                  <span className={styles.infoValue}>
                    {cohort?.isActive ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Chains Card */}
          {cohort?.chains && cohort.chains.length > 0 && (
            <div className={styles.card}>
              <h2 className={styles.cardTitle}>Supported Chains</h2>
              <div className={styles.cardContent}>
                <div className={styles.chainsList}>
                  {cohort.chains.map((chain, index) => (
                    <div key={index} className={styles.chainItem}>
                      <span className={styles.chainId}>Chain ID: {chain}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Conditions Card */}
          {cohort?.conditions && Object.keys(cohort.conditions).length > 0 && (
            <div className={styles.card}>
              <div className={styles.cardHeader}>
                <h2 className={styles.cardTitle}>On-Chain Conditions</h2>
                <button
                  className={styles.globalJsonToggle}
                  onClick={() => {
                    const allChainIds = Object.keys(cohort.conditions);
                    const allShowing = allChainIds.every(id => showRawJson[id]);
                    const newState = {};
                    allChainIds.forEach(id => {
                      newState[id] = !allShowing;
                    });
                    setShowRawJson(newState);
                  }}
                  title="Toggle all JSON views"
                >
                  <svg className={styles.jsonIcon} viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                  </svg>
                  {Object.values(showRawJson).some(v => v) ? 'Hide All JSON' : 'Show All JSON'}
                </button>
              </div>
              <div className={styles.cardContent}>
                {Object.entries(cohort.conditions).map(([chainId, chainConditions]) => {
                  const chainName =
                    chainId === '11155111' ? 'Sepolia' :
                    chainId === '80002' ? 'Polygon Amoy' :
                    chainId === '84532' ? 'Base Sepolia' :
                    chainId === '1' ? 'Ethereum Mainnet' :
                    `Chain ${chainId}`;

                  return (
                    <div key={chainId} className={styles.chainConditions}>
                      <div className={styles.chainConditionsHeader}>
                        <h3 className={styles.chainTitle}>{chainName}</h3>
                        {chainConditions?.decoded && (
                          <button
                            className={styles.jsonToggle}
                            onClick={() => setShowRawJson(prev => ({
                              ...prev,
                              [chainId]: !prev[chainId]
                            }))}
                            title={showRawJson[chainId] ? "Show formatted view" : "Show raw JSON"}
                          >
                            {showRawJson[chainId] ? (
                              <>
                                <svg className={styles.jsonIcon} viewBox="0 0 20 20" fill="currentColor">
                                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z"/>
                                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd"/>
                                </svg>
                                View
                              </>
                            ) : (
                              <>
                                <svg className={styles.jsonIcon} viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"/>
                                </svg>
                                JSON
                              </>
                            )}
                          </button>
                        )}
                      </div>
                      <div className={styles.conditionsContainer}>
                        {(() => {
                          const conditionData = chainConditions?.decoded || chainConditions;

                          // Show raw JSON if toggle is active
                          if (showRawJson[chainId] && conditionData) {
                            // Format JSON with custom replacer for better readability
                            const formatJSON = (obj) => {
                              const json = JSON.stringify(obj, null, 2);
                              // Highlight property names and values
                              return json
                                .replace(/"([^"]+)":/g, '<span class="' + styles.jsonKey + '">"$1"</span>:')
                                .replace(/:"([^"]+)"/g, ': <span class="' + styles.jsonString + '">"$1"</span>')
                                .replace(/:(\d+)/g, ': <span class="' + styles.jsonNumber + '">$1</span>')
                                .replace(/:(true|false)/g, ': <span class="' + styles.jsonBoolean + '">$1</span>')
                                .replace(/:(null)/g, ': <span class="' + styles.jsonNull + '">$1</span>');
                            };

                            return (
                              <div className={styles.jsonContainer}>
                                <pre
                                  className={styles.jsonContent}
                                  dangerouslySetInnerHTML={{ __html: formatJSON(conditionData) }}
                                />
                              </div>
                            );
                          }

                          // Show formatted view
                          if (conditionData && typeof conditionData === 'object') {
                            return renderConditionDetails(conditionData);
                          }

                          if (typeof conditionData === 'string' && conditionData.length > 0) {
                            // If it's a string, display it
                            return (
                              <div className={styles.conditionsRaw}>
                                <pre>{conditionData}</pre>
                              </div>
                            );
                          }

                          if (chainConditions?.raw && chainConditions.raw !== '0x') {
                            // If we only have raw hex data, display it
                            return (
                              <div className={styles.conditionsRaw}>
                                <pre>{chainConditions.raw.slice(0, 100)}...</pre>
                              </div>
                            );
                          }

                          return <div className={styles.noData}>No conditions set</div>;
                        })()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Signers Table */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Signers ({cohort?.signersCount || 0})</h2>
            <div className={styles.cardContent}>
              {cohort?.signers && cohort.signers.length > 0 ? (
                <div className={styles.tableContainer}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Provider</th>
                        <th>Operator</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cohort.signers.map((signer, index) => (
                        <tr key={index}>
                          <td className={styles.indexCell}>{index + 1}</td>
                          <td className={styles.addressCell}>
                            <a
                              href={`/address/${signer.provider || signer.address || signer}`}
                              className={styles.addressLink}
                            >
                              {formatString(signer.provider || signer.address || signer)}
                            </a>
                          </td>
                          <td className={styles.addressCell}>
                            {signer.operator ? (
                              <a
                                href={`/address/${signer.operator}`}
                                className={styles.addressLink}
                              >
                                {formatString(signer.operator)}
                              </a>
                            ) : (
                              <span className={styles.noData}>-</span>
                            )}
                          </td>
                          <td className={styles.statusCell}>
                            <span className={styles.signerStatus}>
                              Active
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className={styles.noData}>No signers found</div>
              )}
            </div>
          </div>

          {/* Technical Details */}
          <div className={styles.card}>
            <h2 className={styles.cardTitle}>Technical Details</h2>
            <div className={styles.cardContent}>
              <div className={styles.technicalDetails}>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Cohort State</span>
                  <span className={styles.detailValue}>{cohort?.state}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Is Active</span>
                  <span className={styles.detailValue}>{String(cohort?.isActive)}</span>
                </div>
                {cohort?.dataHash && (
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Data Hash</span>
                    <span className={styles.detailValue}>{cohort.dataHash}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className={styles.footer}>
          <button onClick={() => navigate('/cohorts')} className={styles.backButton}>
            ← Back to Cohorts
          </button>
        </div>
      </div>
    </div>
  );
};

export default SigningCohortDetail;