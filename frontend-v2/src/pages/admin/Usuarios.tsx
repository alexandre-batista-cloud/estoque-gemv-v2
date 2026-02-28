export function AdminUsuarios() {
  return (
    <div className="max-w-lg">
      <h2 className="text-xl font-bold mb-6">Usuários</h2>
      <p className="text-sm text-gray-500 mb-4">
        Convidar vendedores: use o Supabase Dashboard → Authentication → Users → Invite user.
        Após criar o usuário, execute no SQL Editor:
      </p>
      <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
        {`UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role": "vendedor"}'::jsonb
WHERE email = 'email@vendedor.com';`}
      </pre>
      <p className="text-xs text-gray-400 mt-2">
        O vendedor receberá um email para definir sua senha.
      </p>
    </div>
  )
}
