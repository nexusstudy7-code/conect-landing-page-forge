-- ============================================
-- SCRIPT DE CORREÇÃO DE VULNERABILIDADES
-- Banco de Dados: Supabase PostgreSQL
-- Projeto: Connect Landing Page
-- Data: 2026-01-12
-- ============================================

-- IMPORTANTE: Execute este script no SQL Editor do Supabase Dashboard
-- URL: https://lqgpdsrntfwsjgxuxosa.supabase.co

-- ============================================
-- PARTE 1: VALIDAÇÃO DE DADOS
-- ============================================

-- 1.1 Adicionar validação de email
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS check_email_format;

ALTER TABLE bookings
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE clients
DROP CONSTRAINT IF EXISTS check_email_format;

ALTER TABLE clients
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- 1.2 Adicionar validação de telefone (formato brasileiro)
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS check_phone_format;

ALTER TABLE bookings
ADD CONSTRAINT check_phone_format 
CHECK (phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$');

ALTER TABLE clients
DROP CONSTRAINT IF EXISTS check_phone_format;

ALTER TABLE clients
ADD CONSTRAINT check_phone_format 
CHECK (phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$');

-- 1.3 Adicionar validação de status (enum)
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS check_status_values;

ALTER TABLE bookings
ADD CONSTRAINT check_status_values 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- 1.4 Adicionar validação de tipo
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS check_type_values;

ALTER TABLE bookings
ADD CONSTRAINT check_type_values 
CHECK (type IN ('recording', 'meeting'));

-- 1.5 Validar que a data não é no passado
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS check_future_date;

ALTER TABLE bookings
ADD CONSTRAINT check_future_date 
CHECK (date >= CURRENT_DATE);

-- 1.6 Validar que nome não está vazio
ALTER TABLE bookings
DROP CONSTRAINT IF EXISTS check_name_not_empty;

ALTER TABLE bookings
ADD CONSTRAINT check_name_not_empty 
CHECK (length(trim(name)) > 0);

ALTER TABLE clients
DROP CONSTRAINT IF EXISTS check_name_not_empty;

ALTER TABLE clients
ADD CONSTRAINT check_name_not_empty 
CHECK (length(trim(name)) > 0);

-- ============================================
-- PARTE 2: ÍNDICES DE PERFORMANCE
-- ============================================

-- 2.1 Criar índices para bookings
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_type ON bookings(type);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);

-- 2.2 Criar índices para clients
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_last_booking ON clients(last_booking DESC);
CREATE INDEX IF NOT EXISTS idx_clients_total_bookings ON clients(total_bookings DESC);

-- ============================================
-- PARTE 3: AUDITORIA
-- ============================================

-- 3.1 Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  user_email TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3.2 Criar índices para audit_log
CREATE INDEX IF NOT EXISTS idx_audit_log_table_name ON audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_log_record_id ON audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- 3.3 Habilitar RLS na tabela de auditoria
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- 3.4 Política: Apenas usuários autenticados podem ler logs
DROP POLICY IF EXISTS "Only authenticated users can read audit logs" ON audit_log;
CREATE POLICY "Only authenticated users can read audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (true);

-- 3.5 Política: Ninguém pode modificar logs diretamente
DROP POLICY IF EXISTS "No one can modify audit logs" ON audit_log;
CREATE POLICY "No one can modify audit logs"
ON audit_log FOR ALL
TO authenticated
USING (false);

-- 3.6 Criar função de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_user_email TEXT;
BEGIN
  -- Tentar obter informações do usuário autenticado
  BEGIN
    v_user_id := auth.uid();
    v_user_email := auth.email();
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
    v_user_email := NULL;
  END;

  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (
      table_name, 
      record_id, 
      action, 
      old_data,
      user_id,
      user_email
    )
    VALUES (
      TG_TABLE_NAME, 
      OLD.id, 
      'DELETE', 
      row_to_json(OLD),
      v_user_id,
      v_user_email
    );
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (
      table_name, 
      record_id, 
      action, 
      old_data, 
      new_data,
      user_id,
      user_email
    )
    VALUES (
      TG_TABLE_NAME, 
      NEW.id, 
      'UPDATE', 
      row_to_json(OLD), 
      row_to_json(NEW),
      v_user_id,
      v_user_email
    );
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (
      table_name, 
      record_id, 
      action, 
      new_data,
      user_id,
      user_email
    )
    VALUES (
      TG_TABLE_NAME, 
      NEW.id, 
      'INSERT', 
      row_to_json(NEW),
      v_user_id,
      v_user_email
    );
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3.7 Aplicar triggers de auditoria
DROP TRIGGER IF EXISTS bookings_audit ON bookings;
CREATE TRIGGER bookings_audit
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS clients_audit ON clients;
CREATE TRIGGER clients_audit
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- ============================================
-- PARTE 4: RATE LIMITING
-- ============================================

-- 4.1 Criar função de rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_email TEXT,
  p_max_requests INTEGER DEFAULT 5,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  -- Contar quantas inserções foram feitas neste período
  SELECT COUNT(*)
  INTO v_count
  FROM bookings
  WHERE email = p_email
    AND created_at > NOW() - p_time_window;
  
  -- Retornar true se ainda está dentro do limite
  RETURN v_count < p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4.2 Criar função para verificar IP rate limiting (mais avançado)
CREATE OR REPLACE FUNCTION check_ip_rate_limit(
  p_max_requests INTEGER DEFAULT 10,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
  v_ip INET;
BEGIN
  -- Obter IP do cliente (requer configuração adicional no Supabase)
  -- Por enquanto, retorna true
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 5: ATUALIZAR POLÍTICAS RLS
-- ============================================

-- 5.1 Remover políticas antigas
DROP POLICY IF EXISTS "Anyone can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Public can insert bookings" ON bookings;
DROP POLICY IF EXISTS "Enable insert for anon users" ON bookings;

-- 5.2 Nova política de inserção com validações
CREATE POLICY "Public can insert valid bookings with rate limit"
ON bookings FOR INSERT
TO anon, authenticated
WITH CHECK (
  -- Rate limiting por email
  check_rate_limit(email, 5, '1 hour'::interval)
  AND
  -- Validações básicas (redundantes com constraints, mas mais seguro)
  length(trim(name)) > 0
  AND
  length(trim(email)) > 0
  AND
  length(trim(phone)) > 0
  AND
  date >= CURRENT_DATE
  AND
  type IN ('recording', 'meeting')
  AND
  status = 'pending' -- Forçar status inicial como pending
);

-- 5.3 Política de leitura - apenas autenticados
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON bookings;
CREATE POLICY "Enable read access for authenticated users"
ON bookings FOR SELECT
TO authenticated
USING (true);

-- 5.4 Política de atualização - apenas autenticados
DROP POLICY IF EXISTS "Enable update for authenticated users" ON bookings;
CREATE POLICY "Enable update for authenticated users"
ON bookings FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- 5.5 Política de exclusão - apenas autenticados
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON bookings;
CREATE POLICY "Enable delete for authenticated users"
ON bookings FOR DELETE
TO authenticated
USING (true);

-- 5.6 Políticas para clients - apenas autenticados
DROP POLICY IF EXISTS "Enable all for authenticated users" ON clients;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON clients;

CREATE POLICY "Enable read access for authenticated users"
ON clients FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON clients FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON clients FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON clients FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- PARTE 6: MONITORAMENTO E VIEWS
-- ============================================

-- 6.1 View para atividades suspeitas
CREATE OR REPLACE VIEW suspicious_activity AS
SELECT 
  email,
  COUNT(*) as booking_count,
  MIN(created_at) as first_booking,
  MAX(created_at) as last_booking,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60 as time_span_minutes,
  array_agg(DISTINCT type) as booking_types,
  array_agg(DISTINCT status) as statuses
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY email
HAVING COUNT(*) > 3
ORDER BY booking_count DESC;

-- 6.2 View para estatísticas de uso
CREATE OR REPLACE VIEW booking_statistics AS
SELECT 
  date_trunc('day', created_at) as day,
  COUNT(*) as total_bookings,
  COUNT(DISTINCT email) as unique_users,
  COUNT(*) FILTER (WHERE type = 'recording') as recordings,
  COUNT(*) FILTER (WHERE type = 'meeting') as meetings,
  COUNT(*) FILTER (WHERE status = 'pending') as pending,
  COUNT(*) FILTER (WHERE status = 'confirmed') as confirmed,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled
FROM bookings
GROUP BY date_trunc('day', created_at)
ORDER BY day DESC;

-- 6.3 Proteger as views
ALTER VIEW suspicious_activity OWNER TO postgres;
ALTER VIEW booking_statistics OWNER TO postgres;

GRANT SELECT ON suspicious_activity TO authenticated;
GRANT SELECT ON booking_statistics TO authenticated;

-- ============================================
-- PARTE 7: FUNÇÕES UTILITÁRIAS
-- ============================================

-- 7.1 Função para limpar dados antigos (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_bookings(
  p_days_old INTEGER DEFAULT 365
)
RETURNS TABLE(deleted_count INTEGER, deleted_ids UUID[]) AS $$
DECLARE
  v_deleted_ids UUID[];
  v_count INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM bookings
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
      AND status IN ('completed', 'cancelled')
    RETURNING id
  )
  SELECT array_agg(id), COUNT(*)
  INTO v_deleted_ids, v_count
  FROM deleted;
  
  RETURN QUERY SELECT v_count, v_deleted_ids;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7.2 Função para obter estatísticas de segurança
CREATE OR REPLACE FUNCTION get_security_stats()
RETURNS TABLE(
  metric TEXT,
  value BIGINT,
  description TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    'total_bookings'::TEXT,
    COUNT(*)::BIGINT,
    'Total de agendamentos no sistema'::TEXT
  FROM bookings
  UNION ALL
  SELECT 
    'bookings_last_24h'::TEXT,
    COUNT(*)::BIGINT,
    'Agendamentos nas últimas 24 horas'::TEXT
  FROM bookings
  WHERE created_at > NOW() - INTERVAL '24 hours'
  UNION ALL
  SELECT 
    'suspicious_emails'::TEXT,
    COUNT(DISTINCT email)::BIGINT,
    'Emails com atividade suspeita'::TEXT
  FROM suspicious_activity
  UNION ALL
  SELECT 
    'audit_log_entries'::TEXT,
    COUNT(*)::BIGINT,
    'Total de entradas no log de auditoria'::TEXT
  FROM audit_log;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PARTE 8: COMENTÁRIOS E DOCUMENTAÇÃO
-- ============================================

COMMENT ON TABLE bookings IS 'Armazena agendamentos de gravações e reuniões com validações de segurança';
COMMENT ON TABLE clients IS 'Armazena informações de clientes com proteção RLS';
COMMENT ON TABLE audit_log IS 'Log de auditoria de todas as operações no banco de dados';

COMMENT ON FUNCTION check_rate_limit IS 'Previne spam limitando inserções por email (5 por hora)';
COMMENT ON FUNCTION cleanup_old_bookings IS 'Remove agendamentos antigos para compliance GDPR';
COMMENT ON FUNCTION get_security_stats IS 'Retorna estatísticas de segurança do sistema';
COMMENT ON FUNCTION audit_trigger_func IS 'Função de trigger para registrar todas as modificações';

COMMENT ON VIEW suspicious_activity IS 'Identifica atividades suspeitas (múltiplas inserções rápidas)';
COMMENT ON VIEW booking_statistics IS 'Estatísticas diárias de agendamentos';

COMMENT ON CONSTRAINT check_email_format ON bookings IS 'Valida formato de email RFC 5322';
COMMENT ON CONSTRAINT check_phone_format ON bookings IS 'Valida formato de telefone brasileiro';
COMMENT ON CONSTRAINT check_status_values ON bookings IS 'Restringe status a valores válidos';
COMMENT ON CONSTRAINT check_type_values ON bookings IS 'Restringe tipo a recording ou meeting';
COMMENT ON CONSTRAINT check_future_date ON bookings IS 'Previne agendamentos em datas passadas';

-- ============================================
-- PARTE 9: VERIFICAÇÃO FINAL
-- ============================================

-- 9.1 Verificar se todas as constraints foram criadas
DO $$
DECLARE
  v_constraints INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_constraints
  FROM information_schema.table_constraints
  WHERE table_name IN ('bookings', 'clients')
    AND constraint_type = 'CHECK';
  
  RAISE NOTICE 'Total de CHECK constraints criadas: %', v_constraints;
END $$;

-- 9.2 Verificar se todos os índices foram criados
DO $$
DECLARE
  v_indexes INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_indexes
  FROM pg_indexes
  WHERE tablename IN ('bookings', 'clients', 'audit_log')
    AND indexname LIKE 'idx_%';
  
  RAISE NOTICE 'Total de índices criados: %', v_indexes;
END $$;

-- 9.3 Verificar se RLS está habilitado
DO $$
DECLARE
  v_rls_enabled INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_rls_enabled
  FROM pg_tables
  WHERE tablename IN ('bookings', 'clients', 'audit_log')
    AND rowsecurity = true;
  
  RAISE NOTICE 'Tabelas com RLS habilitado: %', v_rls_enabled;
END $$;

-- ============================================
-- SCRIPT CONCLUÍDO
-- ============================================

-- Exibir mensagem de sucesso
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔═══════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║     CORREÇÕES DE SEGURANÇA APLICADAS COM SUCESSO!        ║';
  RAISE NOTICE '╚═══════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '✓ Validações de dados implementadas';
  RAISE NOTICE '✓ Índices de performance criados';
  RAISE NOTICE '✓ Sistema de auditoria configurado';
  RAISE NOTICE '✓ Rate limiting implementado';
  RAISE NOTICE '✓ Políticas RLS atualizadas';
  RAISE NOTICE '✓ Views de monitoramento criadas';
  RAISE NOTICE '✓ Funções utilitárias disponíveis';
  RAISE NOTICE '';
  RAISE NOTICE 'Próximos passos:';
  RAISE NOTICE '1. Rotacionar a chave anônima no dashboard do Supabase';
  RAISE NOTICE '2. Configurar alertas de segurança';
  RAISE NOTICE '3. Testar o sistema com o script database-security-test.mjs';
  RAISE NOTICE '';
END $$;
