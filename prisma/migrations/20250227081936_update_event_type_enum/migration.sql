/*
  Warnings:

  - The values [CREATE_TOKEN_REQUESTED,CREATE_TOKEN_SUCCEEDED,CREATE_TOKEN_FAILED,CREATE_UPLOAD_REQUEST_REQUESTED,CREATE_UPLOAD_REQUEST_SUCCEEDED,CREATE_UPLOAD_REQUEST_FAILED,UPLOAD_REQUESTED,UPLOAD_SUCCEEDED,UPLOAD_FAILED,ESTIMATES_REQUESTED,ESTIMATES_SUCCEEDED,ESTIMATES_FAILED,GET_PROFILE_REQUESTED,GET_PROFILE_SUCCEEDED,GET_PROFILE_FAILED,GENERATE_NONCE_REQUESTED,GENERATE_NONCE_SUCCEEDED,GENERATE_NONCE_FAILED,VERIFY_AUTH_REQUESTED,VERIFY_AUTH_SUCCEEDED,VERIFY_AUTH_FAILED,REFRESH_TOKEN_REQUESTED,REFRESH_TOKEN_SUCCEEDED,REFRESH_TOKEN_FAILED] on the enum `EventType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventType_new" AS ENUM ('INFO', 'ERROR', 'WARN', 'DEBUG', 'VERBOSE');
ALTER TABLE "Log" ALTER COLUMN "eventType" TYPE "EventType_new" USING ("eventType"::text::"EventType_new");
ALTER TYPE "EventType" RENAME TO "EventType_old";
ALTER TYPE "EventType_new" RENAME TO "EventType";
DROP TYPE "EventType_old";
COMMIT;
