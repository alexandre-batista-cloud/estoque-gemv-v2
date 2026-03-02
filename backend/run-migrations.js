// Script: rodar migrations no Supabase via conexão direta
// Uso: SUPABASE_SERVICE_ROLE=<sua_chave> node run-migrations.js
require('dotenv').config();
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

const PROJECT_REF = 'kbzerulcczyakjqwigxs';
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE;

if (!SERVICE_ROLE) {
  console.error('❌ SUPABASE_SERVICE_ROLE não definida. Adicione no .env ou passe como variável de ambiente.');
  process.exit(1);
}

// Tenta conexão via Supabase Supavisor (JWT auth)
const connectionString =
  `postgresql://postgres.${PROJECT_REF}:${SERVICE_ROLE}@aws-0-us-east-1.pooler.supabase.com:5432/postgres`;

const migrations = [
  '../supabase/migrations/001_v2_schema.sql',
  '../supabase/migrations/002_rls_policies.sql',
  '../supabase/migrations/003_seed_locais.sql',
];

async function run() {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: false } });

  try {
    console.log('🔌 Conectando ao Supabase...');
    await client.connect();
    console.log('✅ Conectado!\n');

    for (const file of migrations) {
      const filePath = path.resolve(__dirname, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      const name = path.basename(file);
      process.stdout.write(`⚙️  Executando ${name}... `);
      await client.query(sql);
      console.log('✅');
    }

    console.log('\n🎉 Todas as migrations executadas com sucesso!');

    // Verificar tabelas criadas
    const { rows } = await client.query(`
      SELECT tablename FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);
    console.log('\nTabelas criadas:', rows.map(r => r.tablename).join(', '));

  } catch (err) {
    console.error('\n❌ Erro:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

run();
