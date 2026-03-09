/**
 * Time Condition Interpreter
 *
 * Handles time-based conditions with timeframes.
 */

import { formatTimestamp, parseContextVariable } from "../formatters.js";

/**
 * Interpret a time condition
 * @param {Object} condition
 * @returns {InterpretedCondition}
 */
export function interpretTime(condition) {
  const fields = [];
  let test = null;

  // Handle timeframe object
  if (condition.timeframe) {
    if (condition.timeframe.start) {
      const formatted = formatTimestamp(condition.timeframe.start);
      fields.push({
        label: "Start",
        value: `${formatted.absolute} (${formatted.relative})`,
        type: "timestamp",
      });
    }

    if (condition.timeframe.end) {
      const formatted = formatTimestamp(condition.timeframe.end);
      fields.push({
        label: "End",
        value: `${formatted.absolute} (${formatted.relative})`,
        type: "timestamp",
      });
    }
  }

  // Handle return value test for time comparisons
  if (condition.returnValueTest) {
    const comp = condition.returnValueTest.comparator;
    const val = condition.returnValueTest.value;

    let label = "Time";
    if (comp === "<" || comp === "<=") {
      label = "Before";
    } else if (comp === ">" || comp === ">=") {
      label = "After";
    }

    let formattedValue;
    const ctxVar = parseContextVariable(val);
    if (ctxVar.isContextVar) {
      formattedValue = `:${ctxVar.varName}`;
    } else if (!isNaN(val) && val >= 0) {
      const formatted = formatTimestamp(val);
      formattedValue =
        val === 0
          ? `0 (${formatted.absolute})`
          : `${val} (${formatted.absolute} - ${formatted.relative})`;
    } else {
      formattedValue = String(val);
    }

    test = {
      comparator: comp,
      value: formattedValue,
      label,
      rawValue: val,
    };
  }

  const result = {
    type: "time",
    label: "Time Condition",
    fields,
    raw: condition,
  };

  if (test) {
    result.test = test;
  }

  return result;
}
