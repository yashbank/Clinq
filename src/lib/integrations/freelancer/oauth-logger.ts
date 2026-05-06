import "server-only";

const NS = "[integration_oauth_tokens]";

export function logOAuthTokenInfo(message: string, context?: Record<string, unknown>): void {
  if (context && Object.keys(context).length > 0) {
    console.info(`${NS} ${message}`, context);
  } else {
    console.info(`${NS} ${message}`);
  }
}

export function logOAuthTokenWarn(message: string, context?: Record<string, unknown>): void {
  if (context && Object.keys(context).length > 0) {
    console.warn(`${NS} ${message}`, context);
  } else {
    console.warn(`${NS} ${message}`);
  }
}

export function logOAuthTokenError(message: string, context?: Record<string, unknown>): void {
  if (context && Object.keys(context).length > 0) {
    console.error(`${NS} ${message}`, context);
  } else {
    console.error(`${NS} ${message}`);
  }
}
