import { db } from "@/db";
import { sessions, users } from "@/db/schema";
import { verifyAccessToken } from "@/utils/tokens";
import { and, eq, gt } from "drizzle-orm";
import { NextApiRequest } from "next";

export const requireAuth = async (req: NextApiRequest) => {
  try {
    const authorization = req.headers.authorization;
  
    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    const token = authorization.slice(7).trim();

    const payload = await verifyAccessToken(token);
    
    if (!payload) return null;
    
    const [session] = await db.select()
      .from(sessions)
      .where(
        and
          (
            eq(sessions.id, payload.sessionId),
            eq(sessions.userId, payload.sub),
            gt(sessions.expiresAt, new Date())
          )
        )
      .limit(1);
    
    if (!session) return null;
        
    const [user] = await db.select().from(users)
      .where(eq(users.id, payload.sub))
      .limit(1);
        
    if (!user || !user.isActive) return null;
    
    return user;
  } catch (error) {
    console.log("requireAuth", error);
    return null;
  }
}