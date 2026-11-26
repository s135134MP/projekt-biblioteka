import { db } from "@/db";
import { users } from "@/db/schema";
import { createSession } from "@/utils/auth";
import { hashPassword } from "@/utils/password";
import { eq } from "drizzle-orm";
import { NextApiRequest, NextApiResponse } from "next";
import { z } from "zod";

const schema = z.object({
  name: z.string(),
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
        message: "Invalid input",
        errors: parsed.error.flatten()
      });
    }

    const { name, password } = parsed.data;
    const email = parsed.data.email.trim().toLowerCase();

    const [existingUser] = await db
      .select({ userId: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    
    if (existingUser) {
      return res.status(400).json({ message: "Email is already registered" });
    }

    const hashedPassword = await hashPassword(password);

    const [user] = await db.insert(users)
      .values({
        name, email,
        password: hashedPassword
      }).returning({
        userId: users.id,
        name: users.name,
        email: users.email,
        role: users.role
      });
    
    const tokens = await createSession(user.userId, user.role);

    return res.status(201).json({
      message: "Registration successful",
      user,
      ...tokens
    })
  } catch (error) {
    console.error("/api/auth/register", error);

    return res.status(500).json({ message: "Internal server error" });
  }
}