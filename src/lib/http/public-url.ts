/** Public site origin. Localhost and 127.0.0.1 are ignored so production never follows a dev URL. */

function hostnameOf(value: string): string {
  try {
    return new URL(value).hostname.toLowerCase();
  } catch {
    return "";
  }
}

export function isLocalHost(hostname: string): boolean {
  const host = hostname.split(":")[0].replace(/^\[|\]$/g, "").toLowerCase();
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

export function isLocalUrl(value: string): boolean {
  return isLocalHost(hostnameOf(value));
}

/** Env origin when it is a real public URL. Relative paths stay relative. */
export function configuredPublicOrigin(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL?.trim().replace(/\/$/, "") || "";
  if (!raw || isLocalUrl(raw)) return "";
  try {
    return new URL(raw).origin;
  } catch {
    return "";
  }
}

export function requestPublicOrigin(req: Request): string {
  const configured = configuredPublicOrigin();
  if (configured) return configured;

  const forwardedHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const host = forwardedHost.split(",")[0]?.trim() || "";
  if (!host || isLocalHost(host)) return "";

  const proto = (req.headers.get("x-forwarded-proto") || "https").split(",")[0]?.trim() || "https";
  return `${proto}://${host}`;
}

/**
 * Absolute URL on the current site. In-app navigations should stay relative.
 * A localhost env value is ignored. With no request, the path stays relative.
 */
export function publicUrl(path: string, req?: Request): string {
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const configured = configuredPublicOrigin();
  if (configured) return `${configured}${normalized}`;
  if (!req) return normalized;
  return `${new URL(req.url).origin}${normalized}`;
}
