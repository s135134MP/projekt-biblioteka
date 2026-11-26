import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { REFRESH_TOKEN_TTL } from "@/utils/auth";
import { createAccessToken, createRefreshToken, hashRefreshToken } from "@/utils/tokens";
import { and, eq, gt } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";
import z from "zod";

const schema = z.object({
  refreshToken: z.string()
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const parsed = schema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      message: "Invalid request body",
      erros: parsed.error.flatten()
    });
  }

  const {refreshToken} = parsed.data;

  try {
    const tokenHash = hashRefreshToken(refreshToken);

    const [session] = await db.select()
      .from(sessions)
      .where(
        and(
          eq(sessions.refreshTokenHash, tokenHash),
          gt(sessions.expiresAt, new Date())
        )
      )
      .limit(1);
    
    if (!session) {
      return res.status(401).json({
        message: "Invalid or expired refresh token"
      });
    }

    const newRefreshToken = createRefreshToken();
    const newRefreshTokenHash = hashRefreshToken(newRefreshToken);
    const newExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL * 1000);

    const [updatedSession] = await db.update(sessions)
      .set({ refreshTokenHash: newRefreshTokenHash, expiresAt: newExpiresAt })
      .where(
        and(
          eq(sessions.id, session.id),
          eq(sessions.refreshTokenHash, tokenHash),
          gt(sessions.expiresAt, new Date())
        )
      )
      .returning();
    
    if (!updatedSession) {
      return res.status(401).json({
        message: "Invalid or expired refresh token"
      });
    }

    const [user] = await db.select().from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    
    if (!user || !user.isActive) {
      await db.delete(sessions).where(eq(sessions.id, session.id));

      return res.status(401).json({
        message: "User not found or inactive",
      });
    }

    const accessToken = await createAccessToken(user.id, session.id, user.role);

    return res.status(200).json({
      accessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("/api/auth/refresh", error);

    return res.status(500).json({ message: "Internal server error" });
  }
}