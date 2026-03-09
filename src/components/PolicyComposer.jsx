import React, { useState } from 'react';
import styles from './PolicyComposer.module.css';

// Common transaction limit templates
const LIMIT_TEMPLATES = {
  contractAddress: {
    name: 'Contract Allow List',
    icon: 'ACL',
    description: 'Limit transactions to specific contracts',
    function: 'execute',
    signature: 'execute((address,uint256,bytes))',
    parameterIndex: 0,
    indexWithinTuple: 0,
    defaultComparator: '==',
    unit: 'address',
    requiresAddress: true
  },
  recipientAddress: {
    name: 'Recipient Allow List',
    icon: 'RCP',
    description: 'Limit transfers to specific addresses',
    function: 'transfer',
    signature: 'transfer(address,uint256)',
    parameterIndex: 0,
    defaultComparator: '==',
    unit: 'address',
    requiresAddress: true
  },
  transfer: {
    name: 'Token Transfer Limit',
    icon: 'TXF',
    description: 'Limit the maximum amount for token transfers',
    function: 'transfer',
    signature: 'transfer(address,uint256)',
    parameterIndex: 1,
    defaultComparator: '<',
    unit: 'tokens'
  },
  approve: {
    name: 'Approval Limit',
    icon: 'APR',
    description: 'Limit the maximum approval amount for tokens',
    function: 'approve',
    signature: 'approve(address,uint256)',
    parameterIndex: 1,
    defaultComparator: '<=',
    unit: 'tokens'
  },
  execute: {
    name: 'Transaction Value Limit',
    icon: 'VAL',
    description: 'Limit the maximum ETH value for transactions',
    function: 'execute',
    signature: 'execute((address,uint256,bytes))',
    parameterIndex: 0,
    indexWithinTuple: 1,
    defaultComparator: '<',
    unit: 'ETH'
  },
  withdraw: {
    name: 'Withdrawal Limit',
    icon: 'WDR',
    description: 'Limit withdrawal amounts',
    function: 'withdraw',
    signature: 'withdraw(uint256)',
    parameterIndex: 0,
    defaultComparator: '<=',
    unit: 'ETH'
  },
  swap: {
    name: 'Swap Limit',
    icon: 'SWP',
    description: 'Limit swap input amounts',
    function: 'swap',
    signature: 'swap(uint256,uint256,address[],address,uint256)',
    parameterIndex: 0,
    defaultComparator: '<=',
    unit: 'tokens'
  },
  custom: {
    name: 'Custom Limit',
    icon: 'CST',
    description: 'Create a custom transaction limit',
    function: '',
    signature: '',
    parameterIndex: 0,
    defaultComparator: '<',
    unit: ''
  }
};

const COMPARATORS = [
  { value: '<', label: 'Less than' },
  { value: '<=', label: 'Less than or equal' },
  { value: '>', label: 'Greater than' },
  { value: '>=', label: 'Greater than or equal' },
  { value: '==', label: 'Equal to' },
  { value: '!=', label: 'Not equal to' }
];

const PolicyComposer = ({ onSave, chainId = '11155111' }) => {
  const [selectedTemplate, setSelectedTemplate] = useState('contractAddress');
  const [functionName, setFunctionName] = useState(LIMIT_TEMPLATES.contractAddress.function);
  const [functionSignature, setFunctionSignature] = useState(LIMIT_TEMPLATES.contractAddress.signature);
  const [parameterIndex, setParameterIndex] = useState(LIMIT_TEMPLATES.contractAddress.parameterIndex);
  const [indexWithinTuple, setIndexWithinTuple] = useState(LIMIT_TEMPLATES.contractAddress.indexWithinTuple);
  const [comparator, setComparator] = useState(LIMIT_TEMPLATES.contractAddress.defaultComparator);
  const [limitValue, setLimitValue] = useState('');
  const [unit, setUnit] = useState(LIMIT_TEMPLATES.contractAddress.unit);

  const handleTemplateChange = (templateKey) => {
    const template = LIMIT_TEMPLATES[templateKey];
    setSelectedTemplate(templateKey);
    setFunctionName(template.function);
    setFunctionSignature(template.signature);
    setParameterIndex(template.parameterIndex);
    setIndexWithinTuple(template.indexWithinTuple || null);
    setComparator(template.defaultComparator);
    setUnit(template.unit);

    // Clear value when template changes
    setLimitValue('');
  };

  const handleSave = () => {
    // Convert value based on unit type
    let value = limitValue;
    if (unit === 'ETH') {
      value = (parseFloat(limitValue) * 1e18).toString();
    } else if (unit === 'tokens' && limitValue.includes('.')) {
      // Assume 18 decimals for tokens
      value = (parseFloat(limitValue) * 1e18).toString();
    } else if (unit === 'address') {
      // Keep address as-is, ensure it's lowercase for consistency
      value = limitValue.toLowerCase();
    }

    // Construct the policy object in TACo format
    const policy = {
      conditionType: 'signing-abi-attribute',
      signingObjectContextVar: ':signingConditionObject',
      attributeName: 'call_data',
      abiValidation: {
        allowedAbiCalls: {
          [functionSignature]: [
            {
              parameterIndex: parseInt(parameterIndex),
              ...(indexWithinTuple !== null && { indexWithinTuple: parseInt(indexWithinTuple) }),
              returnValueTest: {
                comparator,
                value
              }
            }
          ]
        }
      }
    };

    onSave({
      chainId,
      policy,
      summary: {
        template: selectedTemplate,
        function: functionName,
        limit: `${comparator} ${limitValue} ${unit}`,
        icon: LIMIT_TEMPLATES[selectedTemplate].icon
      }
    });
  };

  const isValid = functionSignature && limitValue && comparator;

  return (
    <div className={styles.composer}>
      <div className={styles.content}>
        {/* Template Selection */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Choose a Template</h3>
          <div className={styles.templateGrid}>
            {Object.entries(LIMIT_TEMPLATES).map(([key, template]) => (
              <button
                key={key}
                className={`${styles.templateCard} ${selectedTemplate === key ? styles.selected : ''}`}
                onClick={() => handleTemplateChange(key)}
              >
                <span className={styles.templateIcon}>{template.icon}</span>
                <span className={styles.templateName}>{template.name}</span>
                <span className={styles.templateDescription}>{template.description}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Configuration */}
        <div className={styles.section}>
          <h3 className={styles.sectionTitle}>Configure Limit</h3>

          {selectedTemplate === 'custom' && (
            <>
              <div className={styles.field}>
                <label className={styles.label}>Function Name</label>
                <input
                  type="text"
                  value={functionName}
                  onChange={(e) => setFunctionName(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., transfer"
                />
              </div>

              <div className={styles.field}>
                <label className={styles.label}>Function Signature</label>
                <input
                  type="text"
                  value={functionSignature}
                  onChange={(e) => setFunctionSignature(e.target.value)}
                  className={styles.input}
                  placeholder="e.g., transfer(address,uint256)"
                />
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label className={styles.label}>Parameter Index</label>
                  <input
                    type="number"
                    value={parameterIndex}
                    onChange={(e) => setParameterIndex(e.target.value)}
                    className={styles.input}
                    min="0"
                  />
                </div>

                {functionSignature.includes('(') && functionSignature.includes(',') && (
                  <div className={styles.field}>
                    <label className={styles.label}>Tuple Index (optional)</label>
                    <input
                      type="number"
                      value={indexWithinTuple || ''}
                      onChange={(e) => setIndexWithinTuple(e.target.value || null)}
                      className={styles.input}
                      min="0"
                    />
                  </div>
                )}
              </div>
            </>
          )}

          <div className={styles.fieldRow}>
            <div className={styles.field}>
              <label className={styles.label}>
                {unit === 'address' ? 'Restriction Type' : 'Comparator'}
              </label>
              <select
                value={comparator}
                onChange={(e) => setComparator(e.target.value)}
                className={styles.select}
              >
                {unit === 'address' ? (
                  <>
                    <option value="==">Allow list (only allow)</option>
                    <option value="!=">Deny list (exclude)</option>
                  </>
                ) : (
                  COMPARATORS.map(comp => (
                    <option key={comp.value} value={comp.value}>
                      {comp.label}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className={styles.field}>
              <label className={styles.label}>
                {unit === 'address' ? 'Contract Address' : `Limit Value ${unit && `(${unit})`}`}
              </label>
              <input
                type={unit === 'address' ? 'text' : 'number'}
                value={limitValue}
                onChange={(e) => setLimitValue(e.target.value)}
                className={styles.input}
                placeholder={
                  unit === 'address' ? '0x...' :
                  unit === 'ETH' ? '0.001' :
                  '1000'
                }
                step={unit === 'address' ? undefined : (unit === 'ETH' ? '0.001' : '1')}
                pattern={unit === 'address' ? '^0x[a-fA-F0-9]{40}$' : undefined}
              />
            </div>

            {selectedTemplate === 'custom' && (
              <div className={styles.field}>
                <label className={styles.label}>Unit</label>
                <input
                  type="text"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={styles.input}
                  placeholder="ETH, tokens, etc."
                />
              </div>
            )}
          </div>
        </div>

        {/* Preview */}
        {isValid && (
          <div className={styles.section}>
            <h3 className={styles.sectionTitle}>Preview</h3>
            <div className={styles.preview}>
              <div className={styles.previewItem}>
                <span className={styles.previewIcon}>
                  {LIMIT_TEMPLATES[selectedTemplate].icon}
                </span>
                <span className={styles.previewFunction}>{functionName}()</span>
                <span className={styles.previewCondition}>
                  {unit === 'address' ? (
                    comparator === '==' ? `→ ${limitValue.slice(0,6)}...${limitValue.slice(-4)}` : `≠ ${limitValue.slice(0,6)}...${limitValue.slice(-4)}`
                  ) : (
                    `${comparator} ${limitValue} ${unit}`
                  )}
                </span>
              </div>
              <div className={styles.previewDescription}>
                {unit === 'address' ? (
                  <>This policy will restrict {functionName} calls to {comparator === '==' ? 'only' : 'exclude'} contract address: {limitValue}</>
                ) : (
                  <>
                    This policy will restrict {functionName} calls where the
                    {indexWithinTuple !== null ? ` value at position ${indexWithinTuple} in parameter ${parameterIndex}` : ` parameter at position ${parameterIndex}`}
                    {' '}must be {COMPARATORS.find(c => c.value === comparator)?.label.toLowerCase()} {limitValue} {unit}.
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className={styles.footer}>
        <button
          onClick={handleSave}
          className={styles.saveButton}
          disabled={!isValid}
        >
          Add Limit
        </button>
      </div>
    </div>
  );
};

export default PolicyComposer;