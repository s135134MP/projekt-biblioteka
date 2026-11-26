// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { requireAuth } from "@/middleware/requireAuth";
import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const user = await requireAuth(req);

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  res.status(200).json({ name: "John Doe" });
}
