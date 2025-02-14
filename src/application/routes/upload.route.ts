import { Router } from "express";

import { UploadController } from "../controllers/upload.controller";

export const createUploadRoutes = (uploadController: UploadController) => {
  const router = Router();

  router.post("/request", uploadController.requestUpload);
  router.post("/complete", uploadController.completeUpload);

  return router;
};
