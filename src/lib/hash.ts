import crypto from "node:crypto";

export function hashIp(ip: string): string {
  const salt = process.env.AUTH_SECRET ?? "linky-default-salt";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 24);
}

export function sha256(value: string): string {
  return crypto.createHash("sha256").update(value).digest("hex");
}
