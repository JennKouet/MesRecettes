import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "mr_google_switch";
const TTL_SECONDS = 10 * 60;

type SwitchPayload = {
  userId: string;
  exp: number;
};

function getSecret() {
  return process.env.AUTH_SECRET ?? "dev-only-secret";
}

function signPayload(payloadBase64: string) {
  return createHmac("sha256", getSecret()).update(payloadBase64).digest("base64url");
}

export function buildGoogleSwitchCookieValue(userId: string) {
  const payload: SwitchPayload = {
    userId,
    exp: Math.floor(Date.now() / 1000) + TTL_SECONDS,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = signPayload(payloadBase64);
  return `${payloadBase64}.${signature}`;
}

export function readGoogleSwitchCookieValue(value: string | undefined) {
  if (!value) return null;
  const [payloadBase64, signature] = value.split(".");
  if (!payloadBase64 || !signature) return null;

  const expected = signPayload(payloadBase64);
  const validSignature =
    expected.length === signature.length &&
    timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
  if (!validSignature) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(payloadBase64, "base64url").toString("utf8"),
    ) as SwitchPayload;
    if (!parsed.userId || parsed.exp < Math.floor(Date.now() / 1000)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export const googleSwitchCookieName = COOKIE_NAME;
