/**
 * JWT Condition Interpreter
 *
 * Handles JWT token validation conditions.
 */

/**
 * Interpret a JWT condition
 * @param {Object} condition
 * @returns {InterpretedCondition}
 */
export function interpretJwt(condition) {
  const fields = [];

  if (condition.issuer) {
    fields.push({
      label: 'Issuer',
      value: condition.issuer,
      type: 'text'
    });
  }

  if (condition.audience) {
    fields.push({
      label: 'Audience',
      value: condition.audience,
      type: 'text'
    });
  }

  if (condition.subject) {
    fields.push({
      label: 'Subject',
      value: condition.subject,
      type: 'text'
    });
  }

  return {
    type: 'jwt',
    label: 'JWT Validation',
    fields,
    raw: condition
  };
}
