import crypto from 'crypto';

// Secret key for CSRF token encryption with secure fallback
let CSRF_SECRET: string;
const isProduction = process.env.NODE_ENV === 'production';

// In production, require a real secret
if (!process.env.CSRF_SECRET && isProduction) {
  console.error(
    'CRITICAL SECURITY ERROR: CSRF_SECRET environment variable is required in production!' +
    ' Set this variable with a strong random value.'
  );
  // Don't crash the server, but log a serious error
  // In a real production environment, consider throwing an error to prevent startup without proper security
  CSRF_SECRET = crypto.randomBytes(32).toString('hex');
} else if (!process.env.CSRF_SECRET) {
  // In development, generate a random secret per server start, but warn
  console.warn(
    'WARNING: CSRF_SECRET environment variable not set. ' +
    'Using a randomly generated secret. ' +
    'This is acceptable for development but NOT for production.'
  );
  CSRF_SECRET = crypto.randomBytes(32).toString('hex');
} else {
  // Use the provided secret
  CSRF_SECRET = process.env.CSRF_SECRET;
}

// If the secret is too short, warn about it
if (CSRF_SECRET.length < 32) {
  console.warn(
    'WARNING: CSRF_SECRET is too short. ' +
    'It should be at least 32 characters long for adequate security.'
  );
}

// Token expiration in seconds (30 minutes)
const TOKEN_EXPIRATION = 30 * 60;

/**
 * Generate a CSRF token containing an expiration time
 * @returns An encrypted token string
 */
export function generateCsrfToken(): string {
  const timestamp = Math.floor(Date.now() / 1000) + TOKEN_EXPIRATION;
  const randomValue = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}:${randomValue}`;
  
  // Create HMAC for verification
  const hmac = crypto
    .createHmac('sha256', CSRF_SECRET)
    .update(payload)
    .digest('hex');
  
  // Return the payload and hmac combined
  return Buffer.from(`${payload}:${hmac}`).toString('base64');
}

/**
 * Validate a CSRF token
 * @param token The token to validate
 * @returns Boolean indicating if the token is valid
 */
export function validateCsrfToken(token: string | null): boolean {
  if (!token) return false;
  
  try {
    // Decode the token
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const [timestampStr, randomValue, hmac] = decoded.split(':');
    
    if (!timestampStr || !randomValue || !hmac) {
      return false;
    }
    
    // Check if token has expired
    const timestamp = parseInt(timestampStr, 10);
    const now = Math.floor(Date.now() / 1000);
    if (isNaN(timestamp) || timestamp < now) {
      return false;
    }
    
    // Verify HMAC
    const payload = `${timestampStr}:${randomValue}`;
    const expectedHmac = crypto
      .createHmac('sha256', CSRF_SECRET)
      .update(payload)
      .digest('hex');
    
    return hmac === expectedHmac;
  } catch (error) {
    console.error('Error validating CSRF token:', error);
    return false;
  }
}

/**
 * Get CSRF token - either validate existing or generate new
 * @param existingToken Optional existing token to validate
 * @returns A valid CSRF token
 */
export function getCsrfToken(existingToken?: string | null): string {
  if (existingToken && validateCsrfToken(existingToken)) {
    return existingToken;
  }
  return generateCsrfToken();
}

/**
 * Parse the CSRF token from request headers
 * @param request Request object
 * @returns Boolean indicating if token is valid
 */
export function validateRequestCsrfToken(request: Request | { headers: { get(name: string): string | null } }): boolean {
  const token = request.headers.get('X-CSRF-Token');
  return validateCsrfToken(token);
} 