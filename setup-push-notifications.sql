-- =====================================================
-- SQL para Configurar Notificações Push
-- =====================================================

-- 1. Verificar se a tabela push_subscriptions existe
-- Execute este comando para ver a estrutura da tabela:
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM 
    information_schema.columns
WHERE 
    table_name = 'push_subscriptions'
ORDER BY 
    ordinal_position;

-- 2. Se a tabela NÃO existir, crie com este comando:
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint TEXT NOT NULL UNIQUE,
    subscription JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id 
ON push_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint 
ON push_subscriptions(endpoint);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- 5. Criar políticas de segurança
-- Permitir que usuários autenticados criem suas próprias assinaturas
CREATE POLICY "Users can insert their own subscriptions"
ON push_subscriptions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permitir que usuários vejam suas próprias assinaturas
CREATE POLICY "Users can view their own subscriptions"
ON push_subscriptions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que usuários atualizem suas próprias assinaturas
CREATE POLICY "Users can update their own subscriptions"
ON push_subscriptions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que usuários deletem suas próprias assinaturas
CREATE POLICY "Users can delete their own subscriptions"
ON push_subscriptions
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Permitir que a Edge Function (service role) leia todas as assinaturas
CREATE POLICY "Service role can read all subscriptions"
ON push_subscriptions
FOR SELECT
TO service_role
USING (true);

-- Permitir que a Edge Function delete assinaturas inválidas
CREATE POLICY "Service role can delete subscriptions"
ON push_subscriptions
FOR DELETE
TO service_role
USING (true);

-- 6. Verificar assinaturas existentes
SELECT 
    id,
    user_id,
    LEFT(endpoint, 50) as endpoint_preview,
    created_at,
    updated_at
FROM 
    push_subscriptions
ORDER BY 
    created_at DESC;

-- 7. (OPCIONAL) Limpar assinaturas antigas/inválidas
-- Descomente se quiser limpar assinaturas com mais de 30 dias
-- DELETE FROM push_subscriptions 
-- WHERE created_at < NOW() - INTERVAL '30 days';
