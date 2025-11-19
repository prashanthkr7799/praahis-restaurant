#!/usr/bin/env node

/**
 * Alternative: Direct PostgreSQL connection using node-postgres
 * Install first: npm install pg
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import pg from 'pg';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simple .env loader (no external deps). Loads .env.local from project root
function loadEnv() {
  try {
    const envPath = join(__dirname, '.env.local');
    const content = readFileSync(envPath, 'utf-8');
    content.split(/\r?\n/).forEach((line) => {
      const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!m) return;
      const key = m[1];
      let value = m[2];
      // Strip surrounding quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      process.env[key] = value;
    });
    console.log('🧩 Loaded environment from .env.local');
  } catch (e) {
    console.warn('⚠️  Could not load .env.local, relying on process env');
  }
}

loadEnv();

// Discover migration files dynamically from phase3_migrations folder
import { readdirSync } from 'fs';

async function runMigrations() {
  console.log('🚀 Starting Database Migrations via PostgreSQL');
  console.log('═'.repeat(60));

  // Prefer DIRECT_URL (5432, direct) for DDL; fallback to DATABASE_URL (pooler)
  const connectionString = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('❌ No connection string found. Define DIRECT_URL or DATABASE_URL in .env.local');
    process.exit(1);
  }

  // Ensure SSL for Supabase connections
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 Connecting to database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    const results = [];
    const migrationsDir = join(__dirname, 'phase3_migrations');
    let migrations = readdirSync(migrationsDir)
      .filter((f) => /\.sql$/i.test(f))
      .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    // Dependency tweak: ensure rls_functions runs before audit_logging if present
    const fnIdx = migrations.findIndex((f) => f.includes('rls_functions'));
    const auditIdx = migrations.findIndex((f) => f.includes('audit_logging_system'));
    if (fnIdx !== -1 && auditIdx !== -1 && fnIdx > auditIdx) {
      const [fnFile] = migrations.splice(fnIdx, 1);
      migrations.splice(auditIdx, 0, fnFile);
      console.log('🔀 Reordered: moved rls_functions before audit_logging_system');
    }
    console.log(`Found ${migrations.length} migration files`);

    for (const filename of migrations) {
      console.log(`\n📄 Running: ${filename}`);
      console.log('─'.repeat(60));
      
      const filePath = join(migrationsDir, filename);
      
      try {
        const sql = readFileSync(filePath, 'utf-8');
        await client.query(sql);
        console.log(`✅ Success: ${filename}`);
        results.push({ success: true, filename });
        
      } catch (error) {
        console.error(`❌ Error in ${filename}:`);
        console.error(error.message);
        results.push({ success: false, filename, error: error.message });
        break; // Stop on first error
      }
    }

    // Summary
    console.log('\n' + '═'.repeat(60));
    console.log('📊 MIGRATION SUMMARY');
    console.log('═'.repeat(60));
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`✅ Successful: ${successful}/${migrations.length}`);
    console.log(`❌ Failed: ${failed}/${migrations.length}`);
    
    if (failed === 0) {
      console.log('\n🎉 All migrations completed successfully!');
      console.log('\nNext steps:');
      console.log('1. Create storage buckets');
      console.log('2. Run verification queries');
      console.log('3. Test frontend: npm run dev');
    }
    
    return failed === 0;
    
  } catch (error) {
    console.error('💥 Connection error:', error.message);
    return false;
  } finally {
    await client.end();
    console.log('\n🔌 Database connection closed');
  }
}

// Run migrations
runMigrations()
  .then(success => process.exit(success ? 0 : 1))
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });
