import { db } from "@/db";
import { createAccessToken, createRefreshToken, hashRefreshToken } from "./tokens";
import { sessions } from "@/db/schema";
import { eq } from "drizzle-orm";

export const REFRESH_TOKEN_TTL = 14 * 24 * 60 * 60;

export const createSession = async (userId: string, role: "user" | "admin") => {
  const refreshToken = createRefreshToken();
  const refreshTokenHash = hashRefreshToken(refreshToken);

  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000)

  const [session] = await db.insert(sessions).values({
    userId, refreshTokenHash, expiresAt
  }).returning();

  const sessionId = session.id;

  const accessToken = await createAccessToken(userId, sessionId, role);

  return { accessToken, refreshToken, expiresAt }
}

export const deleteSession = async (sessionId: string) => {
  await db
    .delete(sessions)
    .where(eq(sessions.id, sessionId));
}
