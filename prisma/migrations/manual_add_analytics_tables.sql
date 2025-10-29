-- Manual migration for analytics tables
-- Run this SQL directly in Supabase SQL Editor if migrate command fails

-- Create user_events table
CREATE TABLE IF NOT EXISTS "public"."user_events" (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "session_id" VARCHAR(255) NOT NULL,
  "user_id" UUID,
  "event_type" VARCHAR(100) NOT NULL,
  "event_data" JSONB,
  "page_path" VARCHAR(255),
  "referrer" VARCHAR(500),
  "user_agent" TEXT,
  "device_type" VARCHAR(50),
  "created_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  
  CONSTRAINT "user_events_user_id_fkey" FOREIGN KEY ("user_id") 
    REFERENCES "public"."User"("id") ON DELETE CASCADE
);

-- Create indexes for user_events
CREATE INDEX IF NOT EXISTS "user_events_session_id_idx" ON "public"."user_events"("session_id");
CREATE INDEX IF NOT EXISTS "user_events_user_id_idx" ON "public"."user_events"("user_id");
CREATE INDEX IF NOT EXISTS "user_events_event_type_idx" ON "public"."user_events"("event_type");
CREATE INDEX IF NOT EXISTS "user_events_created_at_idx" ON "public"."user_events"("created_at");

-- Create user_sessions table
CREATE TABLE IF NOT EXISTS "public"."user_sessions" (
  "session_id" VARCHAR(255) PRIMARY KEY,
  "user_id" UUID,
  "first_page" VARCHAR(255),
  "last_page" VARCHAR(255),
  "referrer" VARCHAR(500),
  "utm_source" VARCHAR(100),
  "utm_medium" VARCHAR(100),
  "utm_campaign" VARCHAR(100),
  "device_type" VARCHAR(50),
  "browser" VARCHAR(100),
  "os" VARCHAR(100),
  "started_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "last_activity_at" TIMESTAMP NOT NULL DEFAULT NOW(),
  "total_events" INTEGER NOT NULL DEFAULT 0,
  
  CONSTRAINT "user_sessions_user_id_fkey" FOREIGN KEY ("user_id") 
    REFERENCES "public"."User"("id") ON DELETE CASCADE
);

-- Create indexes for user_sessions
CREATE INDEX IF NOT EXISTS "user_sessions_user_id_idx" ON "public"."user_sessions"("user_id");
CREATE INDEX IF NOT EXISTS "user_sessions_started_at_idx" ON "public"."user_sessions"("started_at");

-- Verify tables created
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('user_events', 'user_sessions');
