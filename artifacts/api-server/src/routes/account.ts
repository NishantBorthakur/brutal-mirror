import { Router, type Request, type Response } from "express";
import { db, userCreditsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/account/me", async (req: Request, res: Response) => {
  if (!req.isAuthenticated()) {
    res.status(401).json({ error: "AUTH_REQUIRED" });
    return;
  }

  const [credits] = await db
    .select()
    .from(userCreditsTable)
    .where(eq(userCreditsTable.userId, req.user.id));

  res.json({
    user: req.user,
    creditsBalance: credits?.balance ?? 0,
  });
});

export default router;
