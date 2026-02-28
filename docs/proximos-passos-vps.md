# Próximos passos — VPS e branch protection

## Task 11: Configurar VPS para aceitar deploy

O GitHub Actions espera o repositório em `/root/estoque_backend`. Na VPS:

```bash
ssh -i ~/.ssh/ortobom_vps root@77.37.126.43
```

Na VPS:

```bash
cd /root
git clone https://github.com/alexandre-batista-cloud/estoque-gemv-v2.git estoque_backend
cd estoque_backend/backend
# Copiar .env.production.example para .env.production e preencher com valores reais (Supabase, JWT, etc.)
cp .env.production.example .env.production
# Editar .env.production com nano/vim

NODE_ENV=production node -e "require('dotenv').config({path:'.env.production'}); console.log('ENV OK:', process.env.NODE_ENV)"
pm2 delete backend 2>/dev/null || true
pm2 start server.js --name backend --env production
pm2 save
```

Garantir que a pasta do frontend exista para o SCP do Actions:

```bash
mkdir -p /root/estoque_frontend
```

## Task 14: Proteger branch main (via GitHub UI)

1. Acesse: https://github.com/alexandre-batista-cloud/estoque-gemv-v2/settings/branches
2. Add branch protection rule → Branch name pattern: `main`
3. Marque: **Require a pull request before merging** (e opcionalmente require status checks se quiser bloquear até o deploy passar)
4. Save

A branch padrão já está definida como `develop`.
