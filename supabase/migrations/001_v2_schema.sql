-- supabase/migrations/001_v2_schema.sql

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
