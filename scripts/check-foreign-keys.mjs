import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function testQuery() {
  console.log('🔍 Testing different query patterns...\n');
  
  // Test 1: Simple select
  console.log('1️⃣ Testing simple select:');
  const { data: test1, error: error1 } = await supabase
    .from('orders')
    .select('*')
    .limit(1);
  
  console.log(error1 ? `   ❌ Error: ${error1.message}` : '   ✅ Works');
  
  // Test 2: With inner join
  console.log('\n2️⃣ Testing inner join with tables:');
  const { data: test2, error: error2 } = await supabase
    .from('orders')
    .select('*, tables(table_number)')
    .limit(1);
  
  console.log(error2 ? `   ❌ Error: ${error2.message}` : '   ✅ Works');
  
  // Test 3: With left join
  console.log('\n3️⃣ Testing left join with tables:');
  const { data: test3, error: error3 } = await supabase
    .from('orders')
    .select('*, tables!left(table_number)')
    .limit(1);
  
  console.log(error3 ? `   ❌ Error: ${error3.message}` : '   ✅ Works');
  
  // Test 4: Check if there's a foreign key
  console.log('\n4️⃣ Checking sample order data:');
  const { data: sampleOrder, error: error4 } = await supabase
    .from('orders')
    .select('id, table_id, table_number, order_type')
    .limit(3);
  
  if (error4) {
    console.log(`   ❌ Error: ${error4.message}`);
  } else {
    console.log('   ✅ Sample orders:');
    sampleOrder?.forEach(o => {
      console.log(`      - Order ${o.id.substring(0, 8)}...: table_id=${o.table_id || 'NULL'}, table_number=${o.table_number || 'NULL'}, type=${o.order_type}`);
    });
  }
}

testQuery();
