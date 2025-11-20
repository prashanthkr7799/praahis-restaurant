-- Enable realtime for table_sessions table
-- This allows real-time subscriptions to work for shared cart updates

-- Enable replication
ALTER TABLE public.table_sessions REPLICA IDENTITY FULL;

-- Add publication (Supabase Realtime requirement)
-- Check if publication exists first
DO $$ 
BEGIN
    -- Try to add table to supabase_realtime publication
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        -- Add table to existing publication
        ALTER PUBLICATION supabase_realtime ADD TABLE public.table_sessions;
        RAISE NOTICE 'Added table_sessions to supabase_realtime publication';
    ELSE
        RAISE NOTICE 'supabase_realtime publication does not exist - will be auto-created';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'table_sessions already in publication';
    WHEN OTHERS THEN
        RAISE NOTICE 'Could not add to publication: %', SQLERRM;
END $$;

-- Verify
SELECT schemaname, tablename, 
       CASE 
         WHEN relreplident = 'd' THEN 'default'
         WHEN relreplident = 'f' THEN 'full'
         WHEN relreplident = 'i' THEN 'index'
         WHEN relreplident = 'n' THEN 'nothing'
       END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.tablename = 'table_sessions';
