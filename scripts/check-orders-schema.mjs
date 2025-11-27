import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials');
  console.error('VITE_SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkOrdersSchema() {
  try {
    console.log('🔍 Checking orders table schema...\n');
    
    // Fetch a single order to see what columns are available
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying orders table:', error.message);
      return;
    }
    
    if (data && data.length > 0) {
      console.log('✅ Available columns in orders table:');
      console.log(Object.keys(data[0]).sort().join('\n'));
    } else {
      console.log('⚠️  No orders found in the table');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkOrdersSchema();
