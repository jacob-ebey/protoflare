-- Migration number: 0001 	 2025-10-03T04:22:18.581Z
CREATE TABLE IF NOT EXISTS status (
  uri TEXT PRIMARY KEY,
  authorDid TEXT NOT NULL,
  status TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  indexedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_status_authorDid ON status(authorDid);
CREATE INDEX IF NOT EXISTS idx_status_createdAt ON status(createdAt);