-- supabase/migrations/002_rls_policies.sql

ALTER TABLE locais            ENABLE ROW LEVEL SECURITY;
ALTER TABLE produtos          ENABLE ROW LEVEL SECURITY;
ALTER TABLE estoque_por_local ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas          ENABLE ROW LEVEL SECURITY;

-- Locais: todos leem
CREATE POLICY "locais_read" ON locais
  FOR SELECT USING (auth.role() = 'authenticated');

-- Produtos: todos leem, superadmin escreve
CREATE POLICY "produtos_read" ON produtos
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "produtos_write" ON produtos
  FOR ALL USING (
    (auth.jwt()->'user_metadata'->>'role') = 'superadmin'
  );

-- Estoque: todos leem, superadmin escreve
CREATE POLICY "estoque_read" ON estoque_por_local
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "estoque_write" ON estoque_por_local
  FOR ALL USING (
    (auth.jwt()->'user_metadata'->>'role') = 'superadmin'
  );

-- Movimentações: superadmin lê, autenticados inserem
CREATE POLICY "mov_read" ON movimentacoes
  FOR SELECT USING (
    (auth.jwt()->'user_metadata'->>'role') = 'superadmin'
  );

CREATE POLICY "mov_insert" ON movimentacoes
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Reservas: cada um vê as suas, superadmin vê todas
CREATE POLICY "reservas_read" ON reservas
  FOR SELECT USING (
    vendedor_id = auth.uid()
    OR (auth.jwt()->'user_metadata'->>'role') = 'superadmin'
  );

CREATE POLICY "reservas_insert" ON reservas
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "reservas_update" ON reservas
  FOR UPDATE USING (
    vendedor_id = auth.uid()
    OR (auth.jwt()->'user_metadata'->>'role') = 'superadmin'
  );
