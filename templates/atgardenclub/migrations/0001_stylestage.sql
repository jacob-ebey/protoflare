-- Migration number: 0001 	 2025-12-13T21:41:18.163Z
CREATE TABLE IF NOT EXISTS stylestage (
  id INTEGER PRIMARY KEY,
  uri TEXT UNIQUE NOT NULL,
  authorDid TEXT NOT NULL,
  title TEXT NOT NULL,
  styles TEXT NOT NULL,
  createdAt TEXT NOT NULL,
  indexedAt TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_stylestage_uri ON stylestage(uri);
CREATE INDEX IF NOT EXISTS idx_stylestage_authorDid ON stylestage(authorDid);
CREATE INDEX IF NOT EXISTS idx_stylestage_createdAt ON stylestage(createdAt);

CREATE VIRTUAL TABLE stylestage_fts USING fts5(title, content=stylestage, content_rowid=id);

CREATE TRIGGER stylestage_insert
AFTER INSERT ON stylestage BEGIN
INSERT INTO stylestage_fts (rowid, title)
VALUES (new.id, new.title);
END;


CREATE TRIGGER stylestage_update
AFTER UPDATE ON stylestage BEGIN
INSERT INTO stylestage_fts (rowid, title)
VALUES (new.id, new.title);
END;


CREATE TRIGGER stylestage_delete
AFTER DELETE ON stylestage BEGIN
DELETE FROM stylestage_fts
WHERE rowid = old.id;
END;
