import { Database, open } from "sqlite";
import sqlite3 from "sqlite3";

export let db: Database<sqlite3.Database, sqlite3.Statement>;

export async function initDb() {
  db = await open({
    filename: "./dev.sqlite",
    driver: sqlite3.Database,
  });

  // Example table creation
  await db.exec(`
    CREATE TABLE IF NOT EXISTS funding_accounts (
      walletAddress TEXT PRIMARY KEY,
      balance REAL NOT NULL,
      chain TEXT NOT NULL,
      lastUpdated TEXT
    );
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS uploads (
      id TEXT PRIMARY KEY,
      uploaderAddress TEXT NOT NULL,
      fileSize INTEGER NOT NULL,
      feeCharged REAL NOT NULL,
      arweaveTxId TEXT,
      completedAt TEXT,
      createdAt TEXT
    );
  `);

  console.log("SQLite DB initialized.");
}
