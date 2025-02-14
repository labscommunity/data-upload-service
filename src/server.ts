import express from "express";

import { FundingController } from "./application/controllers/funding.controller";
import { UploadController } from "./application/controllers/upload.controller";
import { createFundingRoutes } from "./application/routes/funding.route";
import { createUploadRoutes } from "./application/routes/upload.route";
import { FundingApplicationService } from "./application/services/funding.service";
import { UploadApplicationService } from "./application/services/upload.service";
import { DepositService } from "./domain/funding/services/deposit.service";
import { UploadService } from "./domain/upload/services/upload.service";
import { Config } from "./infrastructure/config";
import { initDb } from "./infrastructure/database/sqlite-connection";
import { FundingAccountSqliteRepository } from "./infrastructure/repositories/funding-account.repository";
import { UploadSqliteRepository } from "./infrastructure/repositories/upload.repository";

export async function createServer() {
  await initDb();

  const app = express();
  app.use(express.json());

  // Repositories
  const fundingRepo = new FundingAccountSqliteRepository();
  const uploadRepo = new UploadSqliteRepository();

  // Domain Services
  const depositService = new DepositService(fundingRepo);
  const uploadDomainService = new UploadService(uploadRepo);

  // Application Services
  const fundingAppService = new FundingApplicationService(depositService);
  const uploadAppService = new UploadApplicationService(
    uploadDomainService,
    fundingRepo,
    Config.arweaveBaseCostPerByte,
    Config.serviceFeePercent,
  );

  // Controllers
  const fundingController = new FundingController(fundingAppService);
  const uploadController = new UploadController(uploadAppService);

  // Routes
  app.use("/api/funding", createFundingRoutes(fundingController));
  app.use("/api/upload", createUploadRoutes(uploadController));

  return app;
}
