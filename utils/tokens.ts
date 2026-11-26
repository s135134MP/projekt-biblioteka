import { createHash, randomBytes } from "crypto";
import { SignJWT, jwtVerify } from "jose";

const secret = process.env.JWT_SECRET;

if (!secret || Buffer.from(secret).length < 32) {
  throw new Error("JWT_SECRET not found");
}

const JWT_SECRET = new TextEncoder().encode(secret);

export const createAccessToken = async (userId: string, sessionId: string, role: string) => {
  return new SignJWT({sessionId, role})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(userId)
    .setExpirationTime("1h")
    .sign(JWT_SECRET)
}

export type JWT_PAYLOAD = {
  sessionId: string,
  role: "user" | "admin",
  sub: string,
  exp: number
}

export const verifyAccessToken = async (token: string): Promise<JWT_PAYLOAD | null> => {
  const { payload } = await jwtVerify(token, JWT_SECRET, {
    algorithms: ["HS256"]
  });

  if (!payload.sub) {
    throw new Error("Invalid token");
  }

  return payload as JWT_PAYLOAD;
}

export const createRefreshToken = () => {
  return randomBytes(32).toString("base64url");
}

export const hashRefreshToken = (token: string) => {
  return createHash("sha256").update(token).digest("hex");
}