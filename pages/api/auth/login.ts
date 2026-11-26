import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/utils/auth";
import { hashPassword, verifyPassword } from "@/utils/password";
import { eq } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const schema = z.object({
  email: z.email(),
  password: z.string().min(8)
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    const parsed = schema.safeParse(req.body);

    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid email or password"
      });
    }

    const email = parsed.data.email.trim().toLowerCase();

    const [user] = await db.select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const validPassword = await verifyPassword(user.password, parsed.data.password);

    if (!validPassword) {
      return res.status(401).json({
        message: "Invalid email or password"
      });
    }

    const tokens = await createSession(user.id, user.role);

    return res.status(200).json({
      message: "Login successful",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      ...tokens
    })
  } catch (error) {
    console.error("/api/auth/login", error);

    return res.status(500).json({ message: "Internal server error" });
  }
}