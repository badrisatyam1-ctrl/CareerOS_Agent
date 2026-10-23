type LogLevel = "info" | "warn" | "error" | "debug";

const SENSITIVE_PATTERNS = [
  "token",
  "password",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "privateresume",
  "private_key",
  "emailbody",
  "bodytext",
  "rawmessage",
  "accesstoken",
  "refreshtoken",
  "clientsecret",
  "authorizationcode",
];

const TOKEN_REGEX_PATTERNS = [
  /ghp_[a-zA-Z0-9_]{36,}/g,
  /github_pat_[a-zA-Z0-9_]{22,}/g,
  /Bearer\s+[A-Za-z0-9._-]+/g,
  /ya29\.[a-zA-Z0-9_-]{50,}/g,
];

export function redactString(str: string): string {
  let cleaned = str;
  for (const regex of TOKEN_REGEX_PATTERNS) {
    cleaned = cleaned.replace(regex, "[REDACTED_CREDENTIAL]");
  }
  return cleaned;
}

export function redactSensitiveData(data: unknown): unknown {
  if (!data) {
    return data;
  }

  if (typeof data === "string") {
    return redactString(data);
  }

  if (typeof data !== "object") {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(redactSensitiveData);
  }

  const redacted: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const lowerKey = key.toLowerCase();
    const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
      lowerKey.includes(pattern)
    );

    if (isSensitive) {
      redacted[key] = "[REDACTED]";
    } else if (typeof value === "string") {
      redacted[key] = redactString(value);
    } else if (typeof value === "object" && value !== null) {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }

  return redacted;
}

export function logMessage(
  level: LogLevel,
  module: string,
  message: string,
  metadata?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const safeMeta = metadata ? redactSensitiveData(metadata) : undefined;

  const logPayload: Record<string, unknown> = {
    timestamp,
    level: level.toUpperCase(),
    module,
    message,
  };

  if (safeMeta !== undefined) {
    logPayload.data = safeMeta;
  }

  const output = JSON.stringify(logPayload);

  switch (level) {
    case "error":
      console.error(output);
      break;
    case "warn":
      console.warn(output);
      break;
    case "debug":
      if (process.env.NODE_ENV !== "production") {
        console.debug(output);
      }
      break;
    case "info":
    default:
      console.log(output);
      break;
  }
}

export const logger = {
  info: (module: string, msg: string, meta?: Record<string, unknown>) =>
    logMessage("info", module, msg, meta),
  warn: (module: string, msg: string, meta?: Record<string, unknown>) =>
    logMessage("warn", module, msg, meta),
  error: (module: string, msg: string, meta?: Record<string, unknown>) =>
    logMessage("error", module, msg, meta),
  debug: (module: string, msg: string, meta?: Record<string, unknown>) =>
    logMessage("debug", module, msg, meta),
};
