import { NextApiRequest } from "next";
import { requireAuth } from "./requireAuth";

export const requireAdmin = async (req: NextApiRequest) => {
  const user = await requireAuth(req);

  if (!user || user.role !== "admin") {
    return null;
  }

  return user;
};