/**
 * TACo Condition Interpreter
 *
 * A module for transforming TACo condition JSON into structured, human-readable data.
 *
 * @example
 * import { interpretCondition, categorizeCondition } from './utils/conditionInterpreter';
 *
 * const condition = { conditionType: 'ecdsa', verifyingKey: '0x...', curve: 'secp256k1' };
 * const interpreted = interpretCondition(condition);
 * // {
 * //   type: 'ecdsa',
 * //   label: 'ECDSA Signature',
 * //   fields: [
 * //     { label: 'Public Key', value: '0x04abc ... xyz', type: 'publicKey' },
 * //     { label: 'Curve', value: 'secp256k1', type: 'badge' }
 * //   ],
 * //   raw: { ... }
 * // }
 */

// Main interpreter functions
export {
  interpretCondition,
  interpretConditionObject,
  categorizeCondition,
  flattenConditions,
  groupByCategory
} from './interpreter.js';

// Formatters for custom rendering
export {
  formatAddress,
  formatAmount,
  formatTimestamp,
  parseFunctionSignature,
  getChainName,
  formatValue
} from './formatters.js';

// Individual interpreters (for advanced usage)
export { interpretCompound } from './interpreters/compound.js';
export { interpretEcdsa } from './interpreters/ecdsa.js';
export { interpretJwt } from './interpreters/jwt.js';
export { interpretTime } from './interpreters/time.js';
export { interpretContract } from './interpreters/contract.js';
export { interpretJsonRpc } from './interpreters/jsonRpc.js';
export { interpretContext } from './interpreters/context.js';
export { interpretSigningAttribute } from './interpreters/signingAttribute.js';
export { interpretSigningAbiAttribute } from './interpreters/signingAbiAttribute.js';
