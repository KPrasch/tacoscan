/**
 * JSON-RPC Condition Interpreter
 *
 * Handles JSON and RPC API call conditions.
 */

import { parseContextVariable } from "../formatters.js";

/**
 * Interpret a JSON-RPC condition
 * @param {Object} condition
 * @returns {InterpretedCondition}
 */
export function interpretJsonRpc(condition) {
  const fields = [];
  let test = null;

  if (condition.endpoint) {
    fields.push({
      label: "Endpoint",
      value: condition.endpoint,
      type: "text",
    });
  }

  if (condition.method) {
    fields.push({
      label: "Method",
      value: condition.method,
      type: "badge",
    });
  }

  // JSON query path
  if (condition.query) {
    fields.push({
      label: "Query",
      value: condition.query,
      type: "text",
    });
  }

  // Data source
  if (condition.data) {
    fields.push({
      label: "Data",
      value: condition.data,
      type: "text",
    });
  }

  // Return value test
  if (condition.returnValueTest) {
    let formattedValue = condition.returnValueTest.value;
    const ctxVar = parseContextVariable(formattedValue);
    if (ctxVar.isContextVar) {
      formattedValue = `:${ctxVar.varName}`;
    }

    // Handle operations
    if (condition.returnValueTest.operations) {
      const ops = condition.returnValueTest.operations
        .map((o) => o.operation)
        .join(", ");
      fields.push({
        label: "Operations",
        value: ops,
        type: "badge",
      });
    }

    test = {
      comparator: condition.returnValueTest.comparator,
      value: String(formattedValue),
      label: "Result",
      rawValue: condition.returnValueTest.value,
    };
  }

  const type = condition.conditionType?.toLowerCase().includes("rpc")
    ? "rpc"
    : "json";

  const result = {
    type,
    label: type === "rpc" ? "RPC Call" : "JSON Query",
    fields,
    raw: condition,
  };

  if (test) {
    result.test = test;
  }

  return result;
}
