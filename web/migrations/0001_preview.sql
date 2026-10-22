PRAGMA foreign_keys = ON;
CREATE TABLE subscribers (
 id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, email_verified_at TEXT,
 subscription_status TEXT NOT NULL DEFAULT 'pending', consent_version TEXT NOT NULL,
 consent_at TEXT NOT NULL, unsubscribed_at TEXT, suppression_reason TEXT,
 confirmed_at TEXT, enrollment_id TEXT,
 unsubscribe_hash TEXT NOT NULL UNIQUE
);
CREATE TABLE confirmation_tokens (
 hash TEXT PRIMARY KEY, subscriber_id TEXT NOT NULL REFERENCES subscribers(id),
 enrollment_id TEXT NOT NULL, expires_at TEXT NOT NULL, created_at TEXT NOT NULL,
 used_at TEXT, invalidated_at TEXT
);
CREATE TABLE editions (
 id TEXT NOT NULL, revision INTEGER NOT NULL, source_revision INTEGER NOT NULL,
 type TEXT NOT NULL, subject TEXT NOT NULL, body_markdown TEXT NOT NULL,
 link_keys TEXT NOT NULL, source_refs TEXT NOT NULL, audience_rule TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'draft', reviewed_at TEXT, reviewed_by TEXT,
 content_hash TEXT NOT NULL, current INTEGER NOT NULL DEFAULT 1,
 scheduled_at TEXT, PRIMARY KEY(id,revision), UNIQUE(id,content_hash)
);
CREATE TABLE deliveries (
 id TEXT PRIMARY KEY, subscriber_id TEXT NOT NULL REFERENCES subscribers(id),
 edition_id TEXT NOT NULL, revision INTEGER NOT NULL, enrollment_id TEXT NOT NULL,
 step INTEGER, planned_at_utc TEXT NOT NULL, originally_planned_at TEXT NOT NULL,
 status TEXT NOT NULL DEFAULT 'planned', provider_id TEXT, attempts INTEGER NOT NULL DEFAULT 0,
 last_error TEXT, accepted_at TEXT, FOREIGN KEY(edition_id,revision) REFERENCES editions(id,revision)
);
CREATE UNIQUE INDEX unique_step ON deliveries(subscriber_id,enrollment_id,step) WHERE step IS NOT NULL;
CREATE UNIQUE INDEX unique_broadcast ON deliveries(subscriber_id,edition_id) WHERE step IS NULL AND edition_id != 'confirm';
CREATE TABLE daily_claims (
 subscriber_id TEXT NOT NULL, jst_day TEXT NOT NULL, delivery_id TEXT NOT NULL UNIQUE,
 PRIMARY KEY(subscriber_id,jst_day)
);
CREATE TABLE provider_events (
 event_id TEXT PRIMARY KEY, type TEXT NOT NULL, received_at TEXT NOT NULL, processed_at TEXT
);
CREATE TABLE mock_outbox (
 delivery_id TEXT PRIMARY KEY, subscriber_id TEXT NOT NULL,
 subject TEXT NOT NULL, body_text TEXT NOT NULL, body_html TEXT NOT NULL,
 created_at TEXT NOT NULL, provider_id TEXT NOT NULL, kind TEXT NOT NULL,
 headers TEXT NOT NULL DEFAULT '{}'
);
CREATE TABLE rate_limits (
 bucket TEXT NOT NULL, key_hash TEXT NOT NULL, count INTEGER NOT NULL,
 PRIMARY KEY(bucket,key_hash)
);
CREATE TABLE settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
INSERT INTO settings VALUES ('clock','2026-10-22T10:00:00.000Z'),('stopped','false');
CREATE INDEX due_deliveries ON deliveries(status,planned_at_utc);
CREATE INDEX tokens_by_subscriber ON confirmation_tokens(subscriber_id,created_at);
CREATE TABLE unsubscribe_tokens (hash TEXT PRIMARY KEY, subscriber_id TEXT NOT NULL REFERENCES subscribers(id));
