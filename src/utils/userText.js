// Strip executable script/style blocks and HTML tags before text is stored or searched.
// React still escapes output; this is an additional input and persistence boundary.
export function sanitizeUserText(value, { field = 'Text', maxLength, allowNewlines = true, trim = true } = {}) {
  let text = String(value ?? '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style\s*>/gi, '')
    .replace(/<(script|style)\b[^>]*>[\s\S]*$/gi, '')
    .replace(/<!--[\s\S]*?(?:-->|$)/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/[<>]/g, '');

  if (!allowNewlines) text = text.replace(/[\r\n\t]+/g, ' ');
  if (trim) text = text.trim();
  if (maxLength !== undefined && text.length > maxLength) {
    throw new Error(`${field} must be ${maxLength} characters or fewer.`);
  }
  return text;
}
