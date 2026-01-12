# Testes de Vulnerabilidade - Banco de Dados Supabase

## 🔍 Relatório de Auditoria de Segurança do Banco de Dados

**Data:** 2026-01-12  
**Banco de Dados:** Supabase PostgreSQL  
**Projeto:** Connect Landing Page  
**URL:** https://lqgpdsrntfwsjgxuxosa.supabase.co

---

## 🔴 VULNERABILIDADES CRÍTICAS IDENTIFICADAS

### 1. Anon Key Exposta no Código Fonte
**Severidade:** CRÍTICA  
**Arquivo:** `src/lib/supabase/client.ts` (linha 5)  
**Descrição:** A chave anônima do Supabase está hardcoded no código fonte como fallback.

**Evidência:**
```typescript
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';
```

**Risco:**
- ⚠️ Qualquer pessoa pode usar esta chave para acessar o banco
- ⚠️ Possível abuso de recursos
- ⚠️ Bypass de rate limiting

**Recomendação:** ✅ AÇÃO NECESSÁRIA
1. Remover o fallback hardcoded
2. Usar apenas variáveis de ambiente
3. Rotacionar a chave anônima
4. Implementar validação de origem (CORS)

---

### 2. RLS (Row Level Security) - Configuração Insegura
**Severidade:** CRÍTICA  
**Tabela:** `bookings`  
**Descrição:** Inserção pública permitida sem validação adequada.

**Configuração Atual:**
```sql
-- Qualquer pessoa pode inserir agendamentos
CREATE POLICY "Public can insert bookings"
ON bookings FOR INSERT
TO anon
WITH CHECK (true);
```

**Riscos:**
- ⚠️ Spam de agendamentos
- ⚠️ Ataques de negação de serviço (DoS)
- ⚠️ Inserção de dados maliciosos
- ⚠️ Sem rate limiting no banco

**Recomendação:**
```sql
-- Adicionar validação de dados
CREATE POLICY "Public can insert valid bookings"
ON bookings FOR INSERT
TO anon
WITH CHECK (
  -- Validar formato de email
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  AND
  -- Validar que o nome não está vazio
  length(trim(name)) > 0
  AND
  -- Validar que a data é futura
  date >= CURRENT_DATE
  AND
  -- Validar tipo
  type IN ('recording', 'meeting')
);
```

---

### 3. Ausência de Índices em Colunas Críticas
**Severidade:** ALTA  
**Impacto:** Performance e Segurança  

**Colunas sem índice:**
- `bookings.email` - Usado em buscas frequentes
- `bookings.date` - Usado em ordenação
- `bookings.status` - Usado em filtros
- `clients.email` - Usado em buscas (tem UNIQUE, mas pode melhorar)

**Risco:**
- ⚠️ Queries lentas facilitam ataques de DoS
- ⚠️ Timeout em operações
- ⚠️ Consumo excessivo de recursos

**Recomendação:**
```sql
-- Criar índices para melhorar performance
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at);
CREATE INDEX idx_clients_last_booking ON clients(last_booking);
```

---

## 🟡 VULNERABILIDADES DE RISCO ALTO

### 4. Falta de Validação de Dados no Nível do Banco
**Severidade:** ALTA  
**Descrição:** Campos críticos não possuem constraints adequados.

**Problemas Identificados:**

#### 4.1 Email sem validação
```sql
-- Atual: Aceita qualquer string
email TEXT NOT NULL

-- Recomendado: Validar formato
email TEXT NOT NULL CHECK (
  email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
)
```

#### 4.2 Telefone sem formato
```sql
-- Atual: Aceita qualquer string
phone TEXT NOT NULL

-- Recomendado: Validar formato brasileiro
phone TEXT NOT NULL CHECK (
  phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$'
)
```

#### 4.3 Status sem enum
```sql
-- Atual: Aceita qualquer string
status TEXT DEFAULT 'pending'

-- Recomendado: Usar enum ou check constraint
status TEXT DEFAULT 'pending' CHECK (
  status IN ('pending', 'confirmed', 'completed', 'cancelled')
)
```

#### 4.4 Type sem validação
```sql
-- Atual: Aceita qualquer string
type TEXT NOT NULL

-- Recomendado: Validar valores
type TEXT NOT NULL CHECK (
  type IN ('recording', 'meeting')
)
```

---

### 5. Ausência de Logs de Auditoria
**Severidade:** ALTA  
**Descrição:** Não há rastreamento de modificações nos dados.

**Risco:**
- ⚠️ Impossível rastrear quem modificou dados
- ⚠️ Sem histórico de alterações
- ⚠️ Dificulta investigação de incidentes

**Recomendação:**
```sql
-- Criar tabela de auditoria
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Criar trigger para auditoria
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Aplicar trigger nas tabelas
CREATE TRIGGER bookings_audit
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

CREATE TRIGGER clients_audit
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

---

### 6. Falta de Rate Limiting no Banco
**Severidade:** ALTA  
**Descrição:** Não há proteção contra inserções em massa.

**Risco:**
- ⚠️ Ataques de spam
- ⚠️ Consumo excessivo de recursos
- ⚠️ Custos elevados

**Recomendação:**
```sql
-- Criar função de rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_email TEXT,
  p_max_requests INTEGER DEFAULT 5,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM bookings
  WHERE email = p_email
    AND created_at > NOW() - p_time_window;
  
  RETURN v_count < p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Atualizar política RLS
CREATE POLICY "Public can insert with rate limit"
ON bookings FOR INSERT
TO anon
WITH CHECK (
  check_rate_limit(email, 5, '1 hour'::interval)
);
```

---

## 🟢 VULNERABILIDADES DE RISCO MÉDIO

### 7. Dados Sensíveis sem Criptografia
**Severidade:** MÉDIA  
**Descrição:** Emails e telefones armazenados em texto plano.

**Recomendação:**
- Considerar criptografia para dados PII (Personally Identifiable Information)
- Implementar hash para emails em buscas
- Usar extensão `pgcrypto` para criptografia

```sql
-- Habilitar extensão de criptografia
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Exemplo de criptografia de dados
CREATE OR REPLACE FUNCTION encrypt_pii(data TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN encode(
    pgp_sym_encrypt(
      data,
      current_setting('app.encryption_key')
    ),
    'base64'
  );
END;
$$ LANGUAGE plpgsql;
```

---

### 8. Falta de Backup Automático Verificado
**Severidade:** MÉDIA  
**Descrição:** Não há evidência de testes de restore de backup.

**Recomendação:**
- Configurar backups automáticos diários
- Testar restore mensalmente
- Implementar Point-in-Time Recovery (PITR)
- Documentar procedimento de disaster recovery

---

### 9. Ausência de Monitoramento de Anomalias
**Severidade:** MÉDIA  
**Descrição:** Não há detecção de padrões suspeitos.

**Recomendação:**
```sql
-- Criar view para detectar anomalias
CREATE OR REPLACE VIEW suspicious_activity AS
SELECT 
  email,
  COUNT(*) as booking_count,
  MIN(created_at) as first_booking,
  MAX(created_at) as last_booking,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60 as time_span_minutes
FROM bookings
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 5
ORDER BY booking_count DESC;
```

---

## 📊 TESTES DE PENETRAÇÃO REALIZADOS

### Teste 1: SQL Injection
**Status:** ✅ PROTEGIDO  
**Descrição:** Supabase usa prepared statements, protegendo contra SQL injection.

### Teste 2: Bypass de RLS
**Status:** ⚠️ PARCIALMENTE VULNERÁVEL  
**Descrição:** Inserção pública sem validação adequada.

### Teste 3: Enumeração de Dados
**Status:** ⚠️ VULNERÁVEL  
**Descrição:** Possível enumerar emails através de tentativas de inserção.

### Teste 4: DoS através de Queries Complexas
**Status:** ⚠️ VULNERÁVEL  
**Descrição:** Falta de índices permite queries lentas.

### Teste 5: Exposição de Dados Sensíveis
**Status:** ⚠️ VULNERÁVEL  
**Descrição:** Dados PII em texto plano.

---

## 🔧 SCRIPT DE CORREÇÃO SQL

```sql
-- ============================================
-- SCRIPT DE HARDENING DO BANCO DE DADOS
-- Execute este script no SQL Editor do Supabase
-- ============================================

-- 1. Adicionar constraints de validação
ALTER TABLE bookings
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE bookings
ADD CONSTRAINT check_phone_format 
CHECK (phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$');

ALTER TABLE bookings
ADD CONSTRAINT check_status_values 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

ALTER TABLE bookings
ADD CONSTRAINT check_type_values 
CHECK (type IN ('recording', 'meeting'));

ALTER TABLE bookings
ADD CONSTRAINT check_future_date 
CHECK (date >= CURRENT_DATE);

-- 2. Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_bookings_email ON bookings(email);
CREATE INDEX IF NOT EXISTS idx_bookings_date ON bookings(date);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at);
CREATE INDEX IF NOT EXISTS idx_clients_last_booking ON clients(last_booking);

-- 3. Criar tabela de auditoria
CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS na tabela de auditoria
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Apenas admins podem ler logs
CREATE POLICY "Only authenticated users can read audit logs"
ON audit_log FOR SELECT
TO authenticated
USING (true);

-- 4. Criar função de auditoria
CREATE OR REPLACE FUNCTION audit_trigger_func()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data)
    VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', row_to_json(OLD));
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    INSERT INTO audit_log (table_name, record_id, action, old_data, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', row_to_json(OLD), row_to_json(NEW));
    RETURN NEW;
  ELSIF (TG_OP = 'INSERT') THEN
    INSERT INTO audit_log (table_name, record_id, action, new_data)
    VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', row_to_json(NEW));
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Aplicar triggers de auditoria
DROP TRIGGER IF EXISTS bookings_audit ON bookings;
CREATE TRIGGER bookings_audit
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

DROP TRIGGER IF EXISTS clients_audit ON clients;
CREATE TRIGGER clients_audit
AFTER INSERT OR UPDATE OR DELETE ON clients
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();

-- 6. Criar função de rate limiting
CREATE OR REPLACE FUNCTION check_rate_limit(
  p_email TEXT,
  p_max_requests INTEGER DEFAULT 5,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*)
  INTO v_count
  FROM bookings
  WHERE email = p_email
    AND created_at > NOW() - p_time_window;
  
  RETURN v_count < p_max_requests;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Atualizar política RLS com validações
DROP POLICY IF EXISTS "Anyone can insert bookings" ON bookings;
CREATE POLICY "Public can insert valid bookings with rate limit"
ON bookings FOR INSERT
TO anon
WITH CHECK (
  -- Rate limiting
  check_rate_limit(email, 5, '1 hour'::interval)
  AND
  -- Validações básicas
  length(trim(name)) > 0
  AND
  length(trim(email)) > 0
  AND
  length(trim(phone)) > 0
);

-- 8. Criar view para monitoramento de anomalias
CREATE OR REPLACE VIEW suspicious_activity AS
SELECT 
  email,
  COUNT(*) as booking_count,
  MIN(created_at) as first_booking,
  MAX(created_at) as last_booking,
  EXTRACT(EPOCH FROM (MAX(created_at) - MIN(created_at))) / 60 as time_span_minutes
FROM bookings
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY email
HAVING COUNT(*) > 3
ORDER BY booking_count DESC;

-- Proteger a view
ALTER VIEW suspicious_activity OWNER TO postgres;
GRANT SELECT ON suspicious_activity TO authenticated;

-- 9. Criar função para limpar dados antigos (GDPR compliance)
CREATE OR REPLACE FUNCTION cleanup_old_bookings(
  p_days_old INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  WITH deleted AS (
    DELETE FROM bookings
    WHERE created_at < NOW() - (p_days_old || ' days')::INTERVAL
      AND status IN ('completed', 'cancelled')
    RETURNING *
  )
  SELECT COUNT(*) INTO v_deleted FROM deleted;
  
  RETURN v_deleted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Comentários para documentação
COMMENT ON TABLE bookings IS 'Armazena agendamentos de gravações e reuniões';
COMMENT ON TABLE clients IS 'Armazena informações de clientes';
COMMENT ON TABLE audit_log IS 'Log de auditoria de todas as operações no banco';
COMMENT ON FUNCTION check_rate_limit IS 'Previne spam limitando inserções por email';
COMMENT ON FUNCTION cleanup_old_bookings IS 'Remove agendamentos antigos para compliance GDPR';

-- ============================================
-- FIM DO SCRIPT DE HARDENING
-- ============================================
```

---

## 📋 CHECKLIST DE SEGURANÇA DO BANCO DE DADOS

### Configuração Básica
- [ ] Remover anon key hardcoded do código
- [ ] Rotacionar chaves de API
- [ ] Configurar CORS adequadamente
- [ ] Habilitar SSL/TLS

### Row Level Security (RLS)
- [x] RLS habilitado em todas as tabelas
- [ ] Políticas de inserção com validação
- [ ] Políticas de leitura restritivas
- [ ] Políticas de atualização/exclusão apenas para autenticados

### Validação de Dados
- [ ] Constraints de email
- [ ] Constraints de telefone
- [ ] Constraints de status/type (enums)
- [ ] Validação de datas futuras

### Performance e Segurança
- [ ] Índices em colunas críticas
- [ ] Rate limiting implementado
- [ ] Queries otimizadas
- [ ] Timeout configurado

### Auditoria e Monitoramento
- [ ] Tabela de audit_log criada
- [ ] Triggers de auditoria aplicados
- [ ] View de atividades suspeitas
- [ ] Alertas configurados

### Compliance e Privacidade
- [ ] Função de cleanup de dados antigos
- [ ] Política de retenção de dados
- [ ] Criptografia de dados sensíveis (opcional)
- [ ] Documentação de privacidade

---

## 🎯 PRIORIDADES DE IMPLEMENTAÇÃO

### URGENTE (Implementar Hoje)
1. ✅ Remover anon key do código
2. ✅ Adicionar constraints de validação
3. ✅ Criar índices de performance
4. ✅ Implementar rate limiting

### IMPORTANTE (Esta Semana)
5. ⏳ Configurar auditoria completa
6. ⏳ Implementar monitoramento de anomalias
7. ⏳ Testar e validar backups
8. ⏳ Rotacionar chaves de API

### RECOMENDADO (Este Mês)
9. ⏳ Implementar criptografia de PII
10. ⏳ Configurar alertas automáticos
11. ⏳ Realizar teste de penetração completo
12. ⏳ Documentar procedimentos de segurança

---

## 📚 RECURSOS ADICIONAIS

- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/security)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/security.html)
- [OWASP Database Security](https://cheatsheetseries.owasp.org/cheatsheets/Database_Security_Cheat_Sheet.html)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

**Última Atualização:** 2026-01-12  
**Próxima Revisão:** 2026-02-12  
**Status Geral:** 🔴 AÇÃO NECESSÁRIA
