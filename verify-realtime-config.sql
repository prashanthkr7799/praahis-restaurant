-- Check if table_sessions is in the realtime publication
SELECT 
  schemaname,
  tablename
FROM pg_publication_tables
WHERE pubname = 'supabase_realtime'
  AND tablename = 'table_sessions';

-- Check replica identity setting
SELECT 
  schemaname, 
  tablename,
  CASE 
    WHEN relreplident = 'd' THEN 'DEFAULT (only key columns)'
    WHEN relreplident = 'f' THEN 'FULL (all columns)'
    WHEN relreplident = 'i' THEN 'INDEX'
    WHEN relreplident = 'n' THEN 'NOTHING'
  END AS replica_identity
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_tables t ON t.tablename = c.relname AND t.schemaname = n.nspname
WHERE t.tablename = 'table_sessions';

-- Check if RLS is blocking
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'table_sessions';

-- Show current RLS policies
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'table_sessions';
