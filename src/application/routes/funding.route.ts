import { Router } from "express";

import { FundingController } from "../controllers/funding.controller";

export const createFundingRoutes = (fundingController: FundingController) => {
  const router = Router();

  router.post("/deposit", fundingController.deposit);

  return router;
};
