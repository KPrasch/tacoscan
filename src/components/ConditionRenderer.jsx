/**
 * ConditionRenderer Component
 *
 * Renders interpreted TACo conditions from the conditionInterpreter module.
 * Fully unpacks all nested conditions including sequential steps.
 */

import React from 'react';
import { interpretCondition, categorizeCondition } from '../utils/conditionInterpreter';
import styles from '../pages/SigningCohortDetail.module.css';

/**
 * Get icon based on condition type
 */
const getIcon = (type) => {
  const icons = {
    'compound': '',
    'sequential': '',
    'ecdsa': '',
    'jwt': '',
    'time': '',
    'contract': '',
    'json': '',
    'rpc': '',
    'context': '',
    'signing-attribute': '',
    'signing-abi-attribute': ''
  };
  return icons[type] || '';
};

/**
 * Get style class based on condition type
 */
const getTypeClass = (type, stylesObj) => {
  if (type.includes('contract')) return stylesObj.typeContract;
  if (type.includes('time')) return stylesObj.typeTime;
  if (type.includes('compound') || type.includes('sequential')) return stylesObj.typeCompound;
  if (type.includes('jwt')) return stylesObj.typeJwt;
  if (type.includes('json')) return stylesObj.typeJson;
  if (type.includes('rpc')) return stylesObj.typeRpc;
  if (type.includes('context')) return stylesObj.typeContext;
  if (type.includes('signing')) return stylesObj.typeSigning;
  return stylesObj.typeDefault;
};

/**
 * Render a sequential condition with all its steps expanded
 */
function SequentialConditionCard({ condition, depth = 0 }) {
  const children = condition.children || [];

  return (
    <div className={styles.sequentialContainer}>
      <div className={`${styles.conditionHeader} ${styles.typeSequential}`}>
        <span className={styles.conditionIcon}></span>
        <span className={styles.conditionTypeName}>{condition.label}</span>
        <span className={styles.stepCount}>{children.length} steps</span>
      </div>

      <div className={styles.sequentialSteps}>
        {children.map((child, idx) => (
          <div key={idx} className={styles.sequentialStep}>
            {/* Step number and connector */}
            <div className={styles.stepConnector}>
              <span className={styles.stepNumber}>{idx + 1}</span>
              {idx < children.length - 1 && <div className={styles.stepLine} />}
            </div>

            {/* Step content */}
            <div className={styles.stepContent}>
              {/* Render the child condition fully - variableName is shown in header */}
              <ConditionCard condition={child} depth={depth + 1} isSequentialStep={true} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Render a compound condition (AND/OR) with all operands expanded
 */
function CompoundConditionCard({ condition, depth = 0, groupByCategory = true }) {
  const children = condition.children || [];
  const operator = condition.operator || 'and';

  // At top level, group by category (authorization vs limits)
  if (groupByCategory && depth === 0) {
    const authConditions = [];
    const limitConditions = [];

    children.forEach((child, idx) => {
      const childCategory = categorizeCondition(child.raw);
      const childWithIndex = { ...child, displayIndex: idx + 1 };

      if (childCategory === 'limits') {
        limitConditions.push(childWithIndex);
      } else {
        authConditions.push(childWithIndex);
      }
    });

    return (
      <div className={styles.compoundContainer}>
        {/* Authorization Conditions */}
        {authConditions.length > 0 && (
          <>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryIcon}></span>
              <span className={styles.categoryLabel}>AUTHORIZATION</span>
              <span className={styles.categoryDescription}>Who can request & when</span>
            </div>
            {authConditions.map((child, idx) => (
              <React.Fragment key={child.displayIndex}>
                <div className={styles.conditionCard}>
                  <span className={styles.conditionCardNumber}>{child.displayIndex}</span>
                  <ConditionCard condition={child} depth={depth + 1} />
                </div>
                {idx < authConditions.length - 1 && (
                  <div className={styles.operatorDivider}>
                    <span className={styles.operatorText}>{operator.toUpperCase()}</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </>
        )}

        {/* Operator divider */}
        {authConditions.length > 0 && limitConditions.length > 0 && (
          <div className={styles.operatorDivider}>
            <span className={styles.operatorText}>{operator.toUpperCase()}</span>
          </div>
        )}

        {/* Transaction Limits */}
        {limitConditions.length > 0 && (
          <>
            <div className={styles.categoryHeader}>
              <span className={styles.categoryIcon}></span>
              <span className={styles.categoryLabel}>TRANSACTION LIMITS</span>
              <span className={styles.categoryDescription}>How much & how often</span>
            </div>
            {limitConditions.map((child, idx) => (
              <React.Fragment key={child.displayIndex}>
                <div className={styles.conditionCard}>
                  <span className={styles.conditionCardNumber}>{child.displayIndex}</span>
                  <ConditionCard condition={child} depth={depth + 1} />
                </div>
                {idx < limitConditions.length - 1 && (
                  <div className={styles.operatorDivider}>
                    <span className={styles.operatorText}>{operator.toUpperCase()}</span>
                  </div>
                )}
              </React.Fragment>
            ))}
          </>
        )}
      </div>
    );
  }

  // Nested compound - render all children with operator between them
  return (
    <div className={styles.nestedCompound}>
      <div className={`${styles.conditionHeader} ${styles.typeCompound}`}>
        <span className={styles.conditionIcon}></span>
        <span className={styles.conditionTypeName}>{operator.toUpperCase()} Condition</span>
        <span className={styles.stepCount}>{children.length} conditions</span>
      </div>

      <div className={styles.compoundOperands}>
        {children.map((child, idx) => (
          <React.Fragment key={idx}>
            <div className={styles.operandCard}>
              <ConditionCard condition={child} depth={depth + 1} />
            </div>
            {idx < children.length - 1 && (
              <div className={styles.operatorBadge}>
                <span>{operator.toUpperCase()}</span>
              </div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

/**
 * Render a single interpreted condition
 * @param {Object} props
 * @param {InterpretedCondition} props.condition - The interpreted condition
 * @param {number} [props.depth=0] - Nesting depth
 * @param {boolean} [props.isSequentialStep=false] - Whether this is a step in a sequential
 */
function ConditionCard({ condition, depth = 0, isSequentialStep = false }) {
  if (!condition) return null;

  const category = categorizeCondition(condition.raw);
  const isTransactionLimit = category === 'limits';

  // Handle sequential conditions - fully unpack
  if (condition.type === 'sequential' && condition.children && condition.children.length > 0) {
    return <SequentialConditionCard condition={condition} depth={depth} />;
  }

  // Handle compound conditions - fully unpack
  if (condition.type === 'compound' && condition.children && condition.children.length > 0) {
    return <CompoundConditionCard condition={condition} depth={depth} groupByCategory={depth === 0} />;
  }

  // Handle conditions that have children but aren't sequential/compound
  // (e.g., a json condition nested inside sequential)
  const hasNestedChildren = condition.children && condition.children.length > 0;

  const icon = getIcon(condition.type);
  const typeClass = getTypeClass(condition.type, styles);

  // Filter out "Assigns to" field from display if we're showing variableName separately
  const displayFields = isSequentialStep && condition.variableName
    ? (condition.fields || []).filter(f => f.label !== 'Assigns to')
    : (condition.fields || []);

  // Show header for all conditions, including transaction limits when in sequential steps
  const showHeader = !isTransactionLimit || isSequentialStep;

  return (
    <div className={styles.conditionBlock}>
      {/* Header */}
      {showHeader && (
        <div className={`${styles.conditionHeader} ${typeClass}`}>
          {/* Variable assignment badge inline with header for sequential steps */}
          {isSequentialStep && condition.variableName && (
            <>
              <span className={styles.headerLabel}>Assigns to:</span>
              <span className={styles.headerVarBadge}>:{condition.variableName}</span>
            </>
          )}
          <span className={styles.headerLabel}>Source:</span>
          <span className={styles.conditionIcon}>{icon}</span>
          <span className={styles.conditionTypeName}>{condition.label}</span>
        </div>
      )}

      {/* Fields Section */}
      {displayFields.length > 0 && (
        <div className={styles.conditionSection}>
          {/* Section titles based on type */}
          {condition.type === 'ecdsa' && (
            <div className={styles.sectionTitle}>SIGNATURE VERIFICATION</div>
          )}
          {condition.type === 'jwt' && (
            <div className={styles.sectionTitle}>JWT Requirements</div>
          )}
          {condition.type === 'time' && displayFields.some(f => f.label === 'Start' || f.label === 'End') && (
            <div className={styles.sectionTitle}>TIMEFRAME</div>
          )}
          {condition.type === 'context' && (
            <div className={styles.sectionTitle}>Context Variables</div>
          )}
          {condition.type === 'contract' && (
            <div className={styles.sectionTitle}>Contract Details</div>
          )}
          {(condition.type === 'json' || condition.type === 'rpc') && (
            <div className={styles.sectionTitle}>API Details</div>
          )}

          {/* Render fields */}
          {displayFields.map((field, idx) => (
            <ConditionField key={idx} field={field} isTransactionLimit={isTransactionLimit} />
          ))}
        </div>
      )}

      {/* Return Value Test */}
      {condition.test && (
        <div className={styles.conditionSection}>
          {!isTransactionLimit && <div className={styles.sectionTitle}>EXPECTED RESULT</div>}
          <div className={styles.testExpression}>
            <span className={styles.testLabel}>{condition.test.label}</span>
            <span className={styles.testOperator}>{condition.test.comparator}</span>
            <span className={styles.testValue}>{condition.test.value}</span>
          </div>
        </div>
      )}

      {/* Nested children for non-compound/sequential types */}
      {hasNestedChildren && (
        <div className={styles.nestedChildren}>
          {condition.children.map((child, idx) => (
            <div key={idx} className={styles.nestedChild}>
              <ConditionCard condition={child} depth={depth + 1} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Render a context variable reference with icon + name + description
 * @param {string} varName - The variable name
 * @param {boolean} showDescription - Whether to show the description
 * @param {Object} sourceInfo - Source info from the data layer (from earlier sequential step)
 */
function ContextVarDisplay({ varName, showDescription = false, sourceInfo = null }) {
  // Get icon based on variable name for visual hint
  const getVarIcon = (name) => {
    const nameLower = (name || '').toLowerCase();
    if (nameLower.includes('recipient') || nameLower.includes('to') || nameLower.includes('target')) {
      return '→';
    }
    if (nameLower.includes('amount') || nameLower.includes('value') || nameLower.includes('max')) {
      return '#';
    }
    if (nameLower.includes('token')) {
      return 'T';
    }
    if (nameLower.includes('sender') || nameLower.includes('from')) {
      return '@';
    }
    return '←';
  };

  const icon = getVarIcon(varName);

  // Use sourceInfo.description from data layer if available, otherwise fallback
  const description = sourceInfo?.description || 'from earlier step';

  return (
    <span className={styles.contextVarRef}>
      <span className={styles.contextVarIcon}>{icon}</span>
      <span className={styles.contextVarName}>{varName}</span>
      {showDescription && (
        <span className={styles.contextVarSource}>({description})</span>
      )}
    </span>
  );
}

/**
 * Render a value, handling context variables
 */
function ValueDisplay({ value, contextVar, type, fullAddress, sourceInfo }) {
  if (contextVar) {
    return <ContextVarDisplay varName={contextVar} showDescription={true} sourceInfo={sourceInfo} />;
  }

  if (type === 'address') {
    return (
      <span className={styles.addressLink} title={fullAddress || value}>
        {value}
      </span>
    );
  }

  if (type === 'amount') {
    return <span className={styles.amountValue}>{value}</span>;
  }

  return <span className={styles.fieldValue}>{value}</span>;
}

/**
 * Render a single field
 */
function ConditionField({ field, isTransactionLimit }) {
  // Context variable type - display with icon
  if (field.type === 'contextVar' || field.contextVar) {
    return (
      <div className={styles.conditionField}>
        <span className={styles.fieldLabel}>{field.label}:</span>
        {field.operator && <span className={styles.fieldOperator}>{field.operator}</span>}
        <ContextVarDisplay varName={field.contextVar || field.value} showDescription={true} sourceInfo={field.sourceInfo} />
      </div>
    );
  }

  // Badge type fields
  if (field.type === 'badge') {
    // Special styling for Signing Context
    if (field.label === 'Signing Context') {
      return (
        <div className={styles.signingContextField}>
          <span className={styles.signingContextLabel}>{field.label}:</span>
          <span className={styles.signingContextBadge}>{field.value}</span>
        </div>
      );
    }
    return (
      <div className={styles.conditionField}>
        <span className={styles.fieldLabel}>{field.label}:</span>
        <span className={styles.curveBadge}>{field.value}</span>
      </div>
    );
  }

  // Public key type
  if (field.type === 'publicKey') {
    return (
      <div className={styles.conditionField}>
        <span className={styles.fieldLabel}>{field.label}:</span>
        <span className={styles.publicKey}>{field.value}</span>
      </div>
    );
  }

  // Address type
  if (field.type === 'address') {
    return (
      <div className={styles.conditionField}>
        <span className={styles.fieldLabel}>{field.label}:</span>
        {field.operator && <span className={styles.fieldOperator}>{field.operator}</span>}
        <span className={styles.addressLink}>{field.value}</span>
      </div>
    );
  }

  // Function type
  if (field.type === 'function') {
    const match = field.value.match(/^(\w+)\((.*)\)$/);
    if (match) {
      return (
        <div className={styles.conditionField}>
          <span className={styles.fieldLabel}>{field.label}:</span>
          <span className={styles.functionSignature}>
            <span className={styles.functionName}>{match[1]}</span>
            <span className={styles.functionParams}>({match[2]})</span>
          </span>
        </div>
      );
    }
  }

  // Timestamp type
  if (field.type === 'timestamp') {
    return (
      <div className={styles.conditionField}>
        <span className={styles.fieldLabel}>{field.label}:</span>
        <span className={styles.timeValue}>{field.value}</span>
      </div>
    );
  }

  // Nested type (for inner call validations)
  if (field.type === 'nested' && field.children) {
    return (
      <div className={styles.nestedValidation}>
        <div className={styles.conditionField}>
          <span className={styles.fieldLabel}>{field.label}:</span>
          <span className={styles.curveBadge}>{field.value}</span>
        </div>
        <div className={styles.nestedChildren}>
          {field.children.map((child, idx) => (
            <ConditionField key={idx} field={child} isTransactionLimit={true} />
          ))}
        </div>
      </div>
    );
  }

  // Default text field
  return (
    <div className={styles.conditionField}>
      <span className={styles.fieldLabel}>{field.label}:</span>
      {field.operator && <span className={styles.fieldOperator}>{field.operator}</span>}
      <span className={styles.fieldValue}>{field.value}</span>
    </div>
  );
}

/**
 * Main component - interprets and renders condition data
 */
export default function ConditionRenderer({ conditionData }) {
  if (!conditionData) return null;

  const interpreted = interpretCondition(conditionData);

  if (!interpreted) {
    return <div className={styles.noData}>Unable to interpret condition</div>;
  }

  return <ConditionCard condition={interpreted} depth={0} />;
}

// Also export the card component for more granular usage
