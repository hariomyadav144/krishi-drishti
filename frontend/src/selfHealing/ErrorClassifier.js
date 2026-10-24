/**
 * Fasal Drishti — Production-Safe Self-Healing System
 * Error Classifier & Root-Cause Analyzer
 * 
 * Classifies raw exceptions, HTTP errors, GPS failures, and runtime crashes
 * into standardized, actionable domain categories.
 */

export const ErrorCategory = {
  UI_ERROR: 'UI_ERROR',
  NAVIGATION_ERROR: 'NAVIGATION_ERROR',
  AUTHENTICATION_ERROR: 'AUTHENTICATION_ERROR',
  SESSION_ERROR: 'SESSION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  PERMISSION_ERROR: 'PERMISSION_ERROR',
  GPS_ERROR: 'GPS_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  DATA_VALIDATION_ERROR: 'DATA_VALIDATION_ERROR',
  PARSING_ERROR: 'PARSING_ERROR',
  AI_PROVIDER_ERROR: 'AI_PROVIDER_ERROR',
  TRANSLATION_ERROR: 'TRANSLATION_ERROR',
  MAP_ERROR: 'MAP_ERROR',
  RUNTIME_EXCEPTION: 'RUNTIME_EXCEPTION',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
};

export const LogLevel = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
};

/**
 * Sanitizes any object or string to remove sensitive credentials, passwords, or tokens.
 */
export function sanitizeData(data) {
  if (!data) return data;
  if (typeof data === 'string') {
    return data
      .replace(/Bearer\s+[A-Za-z0-9._-]+/gi, 'Bearer [REDACTED_TOKEN]')
      .replace(/("?password"?\s*[:=]\s*)"[^"]+"/gi, '$1"[REDACTED]"')
      .replace(/("?token"?\s*[:=]\s*)"[^"]+"/gi, '$1"[REDACTED]"')
      .replace(/("?apiKey"?\s*[:=]\s*)"[^"]+"/gi, '$1"[REDACTED]"');
  }

  if (typeof data === 'object') {
    try {
      const cloned = Array.isArray(data) ? [...data] : { ...data };
      const sensitiveKeys = ['password', 'token', 'jwt', 'apiKey', 'secret', 'authorization'];
      for (const k of Object.keys(cloned)) {
        if (sensitiveKeys.some(sk => k.toLowerCase().includes(sk))) {
          cloned[k] = '[REDACTED]';
        } else if (typeof cloned[k] === 'object' && cloned[k] !== null) {
          cloned[k] = sanitizeData(cloned[k]);
        }
      }
      return cloned;
    } catch (_) {
      return '[SANITIZATION_FALLBACK]';
    }
  }

  return data;
}

/**
 * Classifies an error and extracts structured root-cause metadata.
 */
export function classifyError(error, context = {}) {
  const message = error?.message || (typeof error === 'string' ? error : '') || 'Unknown error occurred';
  const stack = error?.stack || '';
  const status = error?.response?.status || error?.status;
  const code = error?.code || error?.response?.data?.code;
  const url = error?.config?.url || context?.url || '';
  const module = context?.module || detectModuleFromContext(error, context);

  let category = ErrorCategory.UNKNOWN_ERROR;
  let rootCause = 'Unspecified system event';
  let logLevel = LogLevel.ERROR;
  let canAutoRecover = true;

  // 1. GPS / Geolocation Errors
  if (
    context?.module === 'GPS' ||
    context?.module === 'FieldMapping' ||
    error?.code === 1 || error?.code === 2 || error?.code === 3 ||
    message.toLowerCase().includes('geolocation') ||
    message.toLowerCase().includes('position_unavailable') ||
    message.toLowerCase().includes('location permission') ||
    message.toLowerCase().includes('gps')
  ) {
    category = ErrorCategory.GPS_ERROR;
    if (error?.code === 1 || message.toLowerCase().includes('denied')) {
      category = ErrorCategory.PERMISSION_ERROR;
      rootCause = 'Location permission is denied by the farmer or OS.';
      canAutoRecover = true;
    } else if (error?.code === 2) {
      rootCause = 'GPS satellite signal unavailable or device location service disabled.';
    } else if (error?.code === 3) {
      rootCause = 'GPS satellite lock acquisition timed out.';
    } else {
      rootCause = 'Inaccurate or interrupted GPS telemetry.';
    }
  }

  // 2. Authentication & Session Errors
  else if (
    status === 401 ||
    message.toLowerCase().includes('unauthorized') ||
    message.toLowerCase().includes('jwt') ||
    message.toLowerCase().includes('token expired') ||
    url.includes('/auth/login') ||
    url.includes('/auth/register') ||
    url.includes('/auth/me')
  ) {
    if (url.includes('/auth/login') || url.includes('/auth/register')) {
      category = ErrorCategory.AUTHENTICATION_ERROR;
      rootCause = 'Invalid farmer credentials, phone number format, or authentication rejection.';
      canAutoRecover = false; // Requires user correction of credentials
    } else {
      category = ErrorCategory.SESSION_ERROR;
      rootCause = 'JWT session token expired or invalidated by server.';
      canAutoRecover = true;
    }
  }

  // 3. AI Provider / LLM Errors
  else if (
    url.includes('/ai/') ||
    url.includes('/ai-advice') ||
    url.includes('/recommendations/ask') ||
    url.includes('/analysis/scan') ||
    message.toLowerCase().includes('gemini') ||
    message.toLowerCase().includes('llm') ||
    message.toLowerCase().includes('ai model')
  ) {
    category = ErrorCategory.AI_PROVIDER_ERROR;
    if (status === 429) {
      rootCause = 'AI provider rate-limit reached. Server is throttled.';
    } else if (status === 502 || status === 503) {
      rootCause = 'Upstream AI model service is waking up, unavailable, or key missing.';
    } else {
      rootCause = 'AI generation failed during query formulation or network response.';
    }
  }

  // 4. Network / Connectivity Failures
  else if (
    code === 'ECONNABORTED' ||
    code === 'ERR_NETWORK' ||
    !error?.response && (
      message.toLowerCase().includes('network error') ||
      message.toLowerCase().includes('failed to fetch') ||
      message.toLowerCase().includes('timeout') ||
      (typeof navigator !== 'undefined' && !navigator.onLine)
    )
  ) {
    category = ErrorCategory.NETWORK_ERROR;
    rootCause = typeof navigator !== 'undefined' && !navigator.onLine
      ? 'Device is currently offline (no active internet connection).'
      : 'Network socket failure, DNS resolution failure, or server cold-start timeout.';
  }

  // 5. General HTTP / API Errors
  else if (status) {
    category = ErrorCategory.API_ERROR;
    if (status >= 500) {
      rootCause = `Backend server encountered HTTP ${status} internal error.`;
    } else if (status === 404) {
      rootCause = `API endpoint ${url} was not found on active backend.`;
    } else if (status === 403) {
      rootCause = 'Access forbidden to requested resource.';
    } else {
      rootCause = `API request failed with HTTP ${status}: ${message}`;
    }
  }

  // 6. Storage & JSON Parsing
  else if (
    message.toLowerCase().includes('localstorage') ||
    message.toLowerCase().includes('quotaexceeded') ||
    message.toLowerCase().includes('json.parse') ||
    message.toLowerCase().includes('unexpected token') ||
    error instanceof SyntaxError
  ) {
    category = error instanceof SyntaxError ? ErrorCategory.PARSING_ERROR : ErrorCategory.STORAGE_ERROR;
    rootCause = message.toLowerCase().includes('quota')
      ? 'Storage quota exceeded on client device.'
      : 'Corrupted JSON data in local cache or storage.';
  }

  // 7. Map & Leaflet Rendering
  else if (
    message.toLowerCase().includes('leaflet') ||
    message.toLowerCase().includes('map container') ||
    message.toLowerCase().includes('layer') ||
    context?.module === 'Map'
  ) {
    category = ErrorCategory.MAP_ERROR;
    rootCause = 'Map container was not ready or tile layer rendering failed.';
  }

  // 8. UI Rendering & React Component Crashes
  else if (
    context?.isReactErrorBoundary ||
    message.toLowerCase().includes('rendered more hooks') ||
    message.toLowerCase().includes('cannot read properties of undefined') ||
    message.toLowerCase().includes('cannot read properties of null') ||
    error instanceof TypeError ||
    error instanceof ReferenceError
  ) {
    category = ErrorCategory.UI_ERROR;
    rootCause = 'Component render crashed due to null pointer or unexpected widget state.';
  }

  return {
    category,
    module,
    rootCause,
    message: sanitizeData(message),
    stack: sanitizeData(stack),
    status,
    code,
    url,
    canAutoRecover,
    logLevel,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Helper to infer module name from stack, URL, or caller context
 */
function detectModuleFromContext(error, context) {
  if (context?.module) return context.module;
  const url = error?.config?.url || '';
  if (url.includes('/auth')) return 'Authentication';
  if (url.includes('/ai')) return 'AiAdvisor';
  if (url.includes('/weather')) return 'Weather';
  if (url.includes('/crops')) return 'CropManagement';
  if (url.includes('/farmer/fields') || url.includes('/field-monitoring')) return 'FieldMonitoring';
  if (url.includes('/mandi')) return 'MandiPrices';
  if (url.includes('/tools')) return 'Tools';

  const stack = error?.stack || '';
  if (stack.includes('FieldMapping')) return 'FieldMapping';
  if (stack.includes('AiAdvisor')) return 'AiAdvisor';
  if (stack.includes('FarmerDashboard')) return 'FarmerDashboard';
  if (stack.includes('ScanCrop')) return 'ScanCrop';
  if (stack.includes('AuthContext')) return 'Authentication';

  return 'ApplicationCore';
}
