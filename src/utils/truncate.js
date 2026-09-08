/**
 * Truncate a value to `max` characters, appending an ellipsis when clipped.
 *
 * Option/message values come from untyped backend data (numbers, booleans,
 * null/undefined and objects are all possible), so coerce to string before
 * measuring/slicing. Without the guard, calling .length/.substring on
 * null/undefined throws and blanks the surrounding row.
 *
 * @param {*} value - the value to truncate; coerced to string
 * @param {number} [max=60] - maximum length before truncation
 * @returns {string} the original (stringified) value, or a clipped form + "..."
 */
export default function truncate(value, max = 60) {
  const str = value == null ? "" : String(value);
  return str.length > max ? `${str.substring(0, max)}...` : str;
}
