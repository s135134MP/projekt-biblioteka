import { db } from "@/db";
import { sessions } from "@/db/schema";
import { requireAuth } from "@/middleware/requireAuth";
import { verifyAccessToken } from "@/utils/tokens";
import { and, eq } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const user = await requireAuth(req);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const token = req.headers.authorization?.slice(7).trim() ?? "";

    const payload = await verifyAccessToken(token);

    if (!payload) {
      return res.status(401).json({ message: "Invalid access token" });
    }

    await db.delete(sessions).where(and(eq(sessions.id, payload.sessionId), eq(sessions.userId, payload.sub)));

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("/api/auth/logout", error);

    return res.status(500).json({ message: "Internal server error" });
  }

}