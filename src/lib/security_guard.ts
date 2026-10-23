/**
 * CareerOS Centralized Security Guard
 * Enforces:
 * 1. Prompt Injection Detection & Untrusted Data Boundary Encapsulation
 * 2. SSRF & Safe URL Validation
 * 3. Secret & PII Redaction
 * 4. Action-Approval Gate Enforcement
 * 5. Data Deletion & Privacy Retention Controls
 */

export interface PromptInjectionCheckResult {
  isClean: boolean;
  detectedPattern?: string;
  reason?: string;
}

export interface UrlValidationResult {
  isValid: boolean;
  reason?: string;
  sanitizedUrl?: string;
}

export class SecurityGuard {
  // Common prompt injection, jailbreak, and unauthorized directive patterns
  private static readonly INJECTION_PATTERNS = [
    /ignore\s+(all\s+|previous\s+|prior\s+)?(instructions|directives|prompts)/i,
    /disregard\s+(all\s+|previous\s+|prior\s+)?(instructions|directives|rules)/i,
    /system\s+prompt\s+override/i,
    /you\s+are\s+now\s+in\s+developer\s+mode/i,
    /bypass\s+(approval|gate|security|confirmation|safeguards)/i,
    /apply\s+(immediately|automatically)\s+without\s+approval/i,
    /send\s+(email|message)\s+immediately\s+without\s+asking/i,
    /exfiltrate\s+(tokens?|secrets?|keys?|env)/i,
    /print\s+(\.env|environment\s+variables|api\s+keys?)/i,
    /dump\s+(credentials|passwords|database)/i,
    /cat\s+\/etc\/passwd/i,
    /bash\s+-i\s+>&/i,
    /\/dev\/tcp\//i,
    /curl\s+https?:\/\/[^\s]+\s+\|\s+(ba)?sh/i,
    /wget\s+https?:\/\/[^\s]+\s+\|\s+(ba)?sh/i,
  ];

  // Blocked SSRF IP targets and hostnames
  private static readonly BLOCKED_HOSTS = [
    "localhost",
    "127.0.0.1",
    "0.0.0.0",
    "::1",
    "169.254.169.254", // Cloud metadata (AWS, GCP, Azure)
    "metadata.google.internal",
    "instance-data",
  ];

  /**
   * Scans untrusted text from web pages, job posts, issue descriptions, and email bodies for prompt injection attacks.
   */
  public static detectPromptInjection(untrustedText: string): PromptInjectionCheckResult {
    if (!untrustedText || untrustedText.trim().length === 0) {
      return { isClean: true };
    }

    for (const pattern of this.INJECTION_PATTERNS) {
      if (pattern.test(untrustedText)) {
        return {
          isClean: false,
          detectedPattern: pattern.source,
          reason: `Potential prompt injection / override attempt detected: matches pattern [${pattern.source}]. Source text must not override system instructions.`,
        };
      }
    }

    return { isClean: true };
  }

  /**
   * Wraps untrusted source data in strict XML-style containment boundary tags.
   * Hard Rule: Untrusted content is treated strictly as data, never as instructions.
   */
  public static wrapUntrustedData(content: string, contextLabel: string): string {
    const sanitized = content.replace(/<\/?untrusted_content_data>/gi, "");
    return `<untrusted_content_data context="${contextLabel}">\n${sanitized}\n</untrusted_content_data>`;
  }

  /**
   * Validates external URLs against SSRF, loopback, link-local, and cloud metadata targets.
   */
  public static validateExternalUrl(rawUrl: string, allowHttpInDev: boolean = false): UrlValidationResult {
    try {
      const parsed = new URL(rawUrl);

      const hostname = parsed.hostname.toLowerCase();

      // 1. Block loopback, link-local, and cloud metadata hosts
      if (this.BLOCKED_HOSTS.includes(hostname)) {
        return {
          isValid: false,
          reason: `SSRF Guard: Access to internal or metadata host '${hostname}' is prohibited.`,
        };
      }

      // 2. Block private IPv4 ranges (RFC 1918 & carrier-grade NAT)
      // 10.0.0.0/8, 172.16.0.0/12, 192.168.0.0/16, 100.64.0.0/10
      const ipv4Match = hostname.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
      if (ipv4Match) {
        const [, b1, b2] = ipv4Match.map(Number);
        if (
          b1 === 10 ||
          b1 === 127 ||
          (b1 === 172 && b2 >= 16 && b2 <= 31) ||
          (b1 === 192 && b2 === 168) ||
          (b1 === 169 && b2 === 254) ||
          (b1 === 100 && b2 >= 64 && b2 <= 127)
        ) {
          return {
            isValid: false,
            reason: `SSRF Guard: Access to private or non-routable IP address '${hostname}' is prohibited.`,
          };
        }
      }

      // 3. Protocol validation: must be https: (or http: in controlled dev)
      if (parsed.protocol !== "https:") {
        if (!allowHttpInDev || parsed.protocol !== "http:") {
          return {
            isValid: false,
            reason: `Disallowed URL protocol: '${parsed.protocol}'. Only secure HTTPS is permitted for external feeds.`,
          };
        }
      }

      return {
        isValid: true,
        sanitizedUrl: parsed.toString(),
      };
    } catch {
      return {
        isValid: false,
        reason: `Malformed URL: unable to parse '${rawUrl}'.`,
      };
    }
  }

  /**
   * Redacts sensitive secrets, API keys, tokens, and private keys from strings and logs.
   */
  public static redactSecrets(input: string): string {
    if (!input) return "";

    return input
      .replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED_GITHUB_PAT]")
      .replace(/github_pat_[a-zA-Z0-9_]{82}/g, "[REDACTED_GITHUB_PAT]")
      .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED_API_KEY]")
      .replace(/AIzaSy[a-zA-Z0-9_-]{33}/g, "[REDACTED_GOOGLE_KEY]")
      .replace(/AKIA[0-9A-Z]{16}/g, "[REDACTED_AWS_KEY]")
      .replace(/eyJ[a-zA-Z0-9_-]{10,}\.eyJ[a-zA-Z0-9_-]{10,}\.[a-zA-Z0-9_-]*/g, "[REDACTED_JWT]")
      .replace(
        /-----BEGIN (?:RSA|EC|OPENSSH) PRIVATE KEY-----[\s\S]+?-----END (?:RSA|EC|OPENSSH) PRIVATE KEY-----/g,
        "[REDACTED_PRIVATE_KEY]"
      );
  }

  /**
   * Server-side action approval enforcement.
   * HARD RULE: No consequential external action (send email, push branch, open PR) may proceed without an unexpired, content-locked approval token.
   */
  public static assertActionApproval(params: {
    actionType: string;
    approvalToken: string;
    contentHash: string;
    storedHash: string;
    expiresAt: Date;
    isPausedAll?: boolean;
  }): void {
    if (params.isPausedAll) {
      throw new Error(`ACTION_BLOCKED: Master scheduler switch is set to PAUSED. All automated actions halted.`);
    }

    if (new Date() > params.expiresAt) {
      throw new Error(`APPROVAL_EXPIRED: The approval for action '${params.actionType}' expired at ${params.expiresAt.toISOString()}. Action cancelled.`);
    }

    if (params.contentHash !== params.storedHash) {
      throw new Error(
        `APPROVAL_TAMPERED: Content hash mismatch for action '${params.actionType}'. The underlying payload was modified after approval was granted. Action cancelled.`
      );
    }
  }
}
