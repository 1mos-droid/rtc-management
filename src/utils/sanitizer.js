import DOMPurify from 'dompurify';

/**
 * Sanitizes a string or an entire object's string properties
 * to prevent XSS and malicious script injection.
 */
export const sanitize = (input) => {
  if (typeof input === 'string') {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [], // No HTML allowed in standard text inputs
      ALLOWED_ATTR: []
    }).trim();
  }

  if (Array.isArray(input)) {
    return input.map(item => sanitize(item));
  }

  if (typeof input === 'object' && input !== null) {
    const sanitizedObj = {};
    for (const [key, value] of Object.entries(input)) {
      sanitizedObj[key] = sanitize(value);
    }
    return sanitizedObj;
  }

  return input;
};

/**
 * Specifically checks if a string contains common attack patterns
 * like <script>, javascript:, onerror=, etc.
 */
export const containsMaliciousPattern = (input) => {
  if (typeof input !== 'string') return false;
  
  const patterns = [
    /<script/i,
    /javascript:/i,
    /onerror=/i,
    /onload=/i,
    /onclick=/i,
    /eval\(/i,
    /document\.cookie/i,
    /window\.location/i
  ];

  return patterns.some(pattern => pattern.test(input));
};
