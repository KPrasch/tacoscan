/**
 * Contract Condition Interpreter
 *
 * Handles smart contract call conditions.
 */

import {
  formatAddress,
  formatAmount,
  getChainName,
  parseContextVariable,
} from "../formatters.js";

/**
 * Interpret a contract condition
 * @param {Object} condition
 * @returns {InterpretedCondition}
 */
export function interpretContract(condition) {
  const fields = [];
  let test = null;

  if (condition.contractAddress) {
    fields.push({
      label: "Address",
      value: formatAddress(condition.contractAddress),
      type: "address",
    });
  }

  if (condition.chain) {
    fields.push({
      label: "Chain",
      value: getChainName(condition.chain),
      type: "badge",
    });
  }

  if (condition.standardContractType) {
    fields.push({
      label: "Standard",
      value: condition.standardContractType,
      type: "badge",
    });
  }

  // Function ABI information
  if (condition.functionAbi) {
    const funcName = condition.functionAbi.name || "unknown";
    const inputs = condition.functionAbi.inputs || [];
    const params = inputs.map((i) => `${i.type} ${i.name || ""}`).join(", ");

    fields.push({
      label: "Function",
      value: `${funcName}(${params})`,
      type: "function",
    });
  }

  // Parameters
  if (
    condition.parameters &&
    condition.parameters.length > 0 &&
    condition.functionAbi?.inputs
  ) {
    condition.parameters.forEach((param, idx) => {
      const input = condition.functionAbi.inputs[idx];
      const paramName = input?.name || `param${idx}`;
      const paramType = input?.type || "unknown";

      // Check if this is a context variable reference
      const ctxVar = parseContextVariable(param);
      if (ctxVar.isContextVar) {
        fields.push({
          label: paramName,
          value: `:${ctxVar.varName}`,
          type: "context-variable",
        });
        return;
      }

      let displayValue = param;
      if (paramType === "address" && typeof param === "string") {
        displayValue = formatAddress(param);
      } else if (paramType.includes("uint") && !isNaN(param)) {
        if (param > 1e15) {
          const formatted = formatAmount(param);
          displayValue = `${formatted.display} (wei: ${param})`;
        }
      } else if (typeof param === "object") {
        displayValue = JSON.stringify(param);
      }

      fields.push({
        label: paramName,
        value: String(displayValue),
        type: paramType === "address" ? "address" : "text",
      });
    });
  }

  // Return value test
  if (condition.returnValueTest) {
    const val = condition.returnValueTest.value;
    let label = "Result";

    // Function-specific labels
    if (condition.functionAbi?.name === "balanceOf") label = "Balance";
    else if (condition.functionAbi?.name === "ownerOf") label = "Owner";
    else if (condition.functionAbi?.name === "hasRole") label = "Has Role";
    else if (condition.functionAbi?.name === "allowance") label = "Allowance";

    let formattedValue;
    const ctxVar = parseContextVariable(val);
    if (ctxVar.isContextVar) {
      formattedValue = `:${ctxVar.varName}`;
    } else if (
      typeof val === "string" &&
      val.startsWith("0x") &&
      val.length === 42
    ) {
      formattedValue = formatAddress(val);
    } else if (!isNaN(val) && val > 1e15) {
      formattedValue = `${formatAmount(val).display}`;
    } else if (val === true || val === "true") {
      formattedValue = "True";
    } else if (val === false || val === "false") {
      formattedValue = "False";
    } else {
      formattedValue = String(val);
    }

    test = {
      comparator: condition.returnValueTest.comparator,
      value: formattedValue,
      label,
      rawValue: val,
    };
  }

  const result = {
    type: "contract",
    label: "Contract Call",
    fields,
    raw: condition,
  };

  if (test) {
    result.test = test;
  }

  return result;
}
