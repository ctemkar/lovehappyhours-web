const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabaseUrl = 'https://nnzjorzayqbpqveaeufd.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5uempvcnpheXFicHF2ZWFldWZkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjUxMzIzNiwiZXhwIjoyMDg4MDg5MjM2fQ.59oAoECpiFnTGXc2dAkGeiLfoZko43rmGRc1cK2BK20';

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  const sql = fs.readFileSync('./supabase/migrations/001_initial_schema.sql', 'utf8');
  
  try {
    const { error } = await supabase.rpc('exec', { sql });
    
    if (error) {
      console.error('Migration error:', error);
    } else {
      console.log('✅ Migration completed successfully!');
    }
  } catch (e) {
    console.error('Error running migration:', e.message);
  }
}

runMigration();
