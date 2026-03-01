-- ============================================================
-- ESTOQUE ORTOBOM v2 — MIGRATIONS CONSOLIDADAS
-- Cole tudo isso no SQL Editor do Supabase:
-- https://supabase.com/dashboard/project/kbzerulcczyakjqwigxs/sql/new
-- ============================================================

-- ── 001: SCHEMA ──────────────────────────────────────────────

-- Extensão UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Locais
CREATE TABLE locais (
  id     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  codigo TEXT UNIQUE NOT NULL,
  nome   TEXT NOT NULL,
  tipo   TEXT NOT NULL CHECK (tipo IN ('loja', 'estoque'))
);

-- Produtos
CREATE TABLE produtos (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ean            TEXT UNIQUE NOT NULL,
  nome           TEXT NOT NULL,
  dimensoes      TEXT,
  dim_alt        INT,
  dim_larg       INT,
  dim_comp       INT,
  categoria      TEXT,
  minimo_estoque INT DEFAULT 5,
  ativo          BOOL DEFAULT true,
  search_vector  TSVECTOR GENERATED ALWAYS AS (
    to_tsvector('portuguese',
      coalesce(nome, '') || ' ' ||
      coalesce(ean, '') || ' ' ||
      coalesce(dimensoes, '') || ' ' ||
      coalesce(categoria, '')
    )
  ) STORED,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_produtos_search ON produtos USING GIN(search_vector);
CREATE INDEX idx_produtos_ean    ON produtos(ean);
CREATE INDEX idx_produtos_ativo  ON produtos(ativo) WHERE ativo = true;

-- Estoque por local
CREATE TABLE estoque_por_local (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id) ON DELETE CASCADE,
  local_id   UUID NOT NULL REFERENCES locais(id),
  quantidade INT NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(produto_id, local_id)
);

CREATE INDEX idx_estoque_produto ON estoque_por_local(produto_id);
CREATE INDEX idx_estoque_local   ON estoque_por_local(local_id);

-- Movimentações
CREATE TABLE movimentacoes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id UUID NOT NULL REFERENCES produtos(id),
  local_id   UUID NOT NULL REFERENCES locais(id),
  tipo       TEXT NOT NULL CHECK (tipo IN ('ENTRADA','SAIDA','AJUSTE','IMPORT')),
  quantidade INT NOT NULL,
  usuario_id UUID REFERENCES auth.users(id),
  obs        TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_mov_produto ON movimentacoes(produto_id, created_at DESC);
CREATE INDEX idx_mov_created ON movimentacoes(created_at DESC);

-- Reservas
CREATE TABLE reservas (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  produto_id   UUID NOT NULL REFERENCES produtos(id),
  local_id     UUID NOT NULL REFERENCES locais(id),
  quantidade   INT NOT NULL CHECK (quantidade > 0),
  vendedor_id  UUID NOT NULL REFERENCES auth.users(id),
  cliente_nome TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'ativa'
               CHECK (status IN ('ativa','confirmada','cancelada')),
  obs          TEXT,
  expires_at   TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '48 hours'),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_reservas_vendedor ON reservas(vendedor_id);
CREATE INDEX idx_reservas_status   ON reservas(status, expires_at);
CREATE INDEX idx_reservas_produto  ON reservas(produto_id);

-- ── 002: RLS POLICIES ────────────────────────────────────────

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

-- ── 003: SEED LOCAIS ─────────────────────────────────────────

INSERT INTO locais (codigo, nome, tipo) VALUES
  ('loja_anapolis',    'Loja Anápolis',    'loja'),
  ('loja_goiania',     'Loja Goiânia',     'loja'),
  ('estoque_anapolis', 'Estoque Anápolis', 'estoque'),
  ('estoque_goiania',  'Estoque Goiânia',  'estoque');

-- ── VERIFICAÇÃO FINAL ─────────────────────────────────────────
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('locais','produtos','estoque_por_local','movimentacoes','reservas')
ORDER BY tablename;

SELECT codigo, nome, tipo FROM locais ORDER BY codigo;
