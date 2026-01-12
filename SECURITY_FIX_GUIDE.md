# 🔒 Guia de Correção de Vulnerabilidades

## ✅ Status das Correções

### Correções Aplicadas Automaticamente
- [x] **Credenciais removidas do código fonte** (`LoginPage.tsx`)
- [x] **Chave Supabase removida do código** (`client.ts`)
- [x] **Script SQL de correção criado** (`fix-database-vulnerabilities.sql`)

### Correções que Requerem Ação Manual
- [ ] **Executar script SQL no Supabase**
- [ ] **Rotacionar chave anônima do Supabase**
- [ ] **Configurar autenticação real**
- [ ] **Testar as correções**

---

## 📋 PASSO A PASSO PARA APLICAR AS CORREÇÕES

### Passo 1: Executar o Script SQL no Supabase ⚠️ IMPORTANTE

1. **Acesse o Supabase Dashboard:**
   - URL: https://supabase.com/dashboard/project/lqgpdsrntfwsjgxuxosa
   - Faça login com suas credenciais

2. **Navegue até o SQL Editor:**
   - No menu lateral, clique em **SQL Editor**
   - Clique em **New Query**

3. **Copie e cole o script:**
   - Abra o arquivo `fix-database-vulnerabilities.sql`
   - Copie TODO o conteúdo
   - Cole no SQL Editor

4. **Execute o script:**
   - Clique em **Run** (ou pressione Ctrl+Enter)
   - Aguarde a execução completa
   - Verifique se não há erros

5. **Verifique as mensagens:**
   - O script exibirá mensagens de progresso
   - Confirme que todas as partes foram executadas com sucesso

---

### Passo 2: Rotacionar a Chave Anônima (Recomendado)

⚠️ **IMPORTANTE:** Como a chave anônima estava exposta no código, é recomendado rotacioná-la.

1. **Acesse as configurações do projeto:**
   - No Supabase Dashboard, vá em **Settings** → **API**

2. **Gere uma nova chave:**
   - Na seção **Project API keys**
   - Clique em **Reset** ao lado da **anon key**
   - Confirme a ação

3. **Atualize o arquivo `.env.local`:**
   ```env
   VITE_SUPABASE_URL=https://lqgpdsrntfwsjgxuxosa.supabase.co
   VITE_SUPABASE_ANON_KEY=<NOVA_CHAVE_AQUI>
   ```

4. **Reinicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```

---

### Passo 3: Verificar as Correções

Execute o script de teste para verificar se as vulnerabilidades foram corrigidas:

```bash
node database-security-test.mjs
```

**Resultado esperado:**
- ✅ Chaves de API protegidas
- ✅ RLS configurado corretamente
- ✅ Validação de dados funcionando
- ✅ Rate limiting ativo
- ✅ Auditoria configurada

---

## 🔍 O Que Foi Corrigido

### 1. Frontend (LoginPage.tsx)
**Antes:**
```tsx
<motion.div className="mt-8 bg-card/50 border border-foreground/10 p-4 text-center">
  <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider">
    Credenciais de Demonstração:
  </p>
  <p className="text-sm">
    <span className="text-muted-foreground">Usuário:</span> 
    <span className="text-foreground font-mono">admin</span>
  </p>
  <p className="text-sm">
    <span className="text-muted-foreground">Senha:</span> 
    <span className="text-foreground font-mono">connect2024</span>
  </p>
</motion.div>
```

**Depois:**
```tsx
// Seção completamente removida - sem exposição de credenciais
```

---

### 2. Cliente Supabase (client.ts)
**Antes:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 
  'https://lqgpdsrntfwsjgxuxosa.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // Chave exposta!
```

**Depois:**
```typescript
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check your .env.local file.\n' +
    'Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY'
  );
}
```

---

### 3. Banco de Dados (SQL)

#### 3.1 Validações Adicionadas
```sql
-- Email válido
ALTER TABLE bookings
ADD CONSTRAINT check_email_format 
CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Telefone brasileiro
ALTER TABLE bookings
ADD CONSTRAINT check_phone_format 
CHECK (phone ~ '^\(\d{2}\) \d{4,5}-\d{4}$');

-- Status válido
ALTER TABLE bookings
ADD CONSTRAINT check_status_values 
CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled'));

-- Tipo válido
ALTER TABLE bookings
ADD CONSTRAINT check_type_values 
CHECK (type IN ('recording', 'meeting'));

-- Data futura
ALTER TABLE bookings
ADD CONSTRAINT check_future_date 
CHECK (date >= CURRENT_DATE);
```

#### 3.2 Índices de Performance
```sql
CREATE INDEX idx_bookings_email ON bookings(email);
CREATE INDEX idx_bookings_date ON bookings(date);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_at ON bookings(created_at DESC);
```

#### 3.3 Sistema de Auditoria
```sql
-- Tabela de logs
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name TEXT NOT NULL,
  record_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  user_id UUID,
  user_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Triggers automáticos
CREATE TRIGGER bookings_audit
AFTER INSERT OR UPDATE OR DELETE ON bookings
FOR EACH ROW EXECUTE FUNCTION audit_trigger_func();
```

#### 3.4 Rate Limiting
```sql
CREATE FUNCTION check_rate_limit(
  p_email TEXT,
  p_max_requests INTEGER DEFAULT 5,
  p_time_window INTERVAL DEFAULT '1 hour'
)
RETURNS BOOLEAN AS $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM bookings
  WHERE email = p_email
    AND created_at > NOW() - p_time_window;
  
  RETURN v_count < p_max_requests;
END;
$$ LANGUAGE plpgsql;

-- Aplicado na política RLS
CREATE POLICY "Public can insert valid bookings with rate limit"
ON bookings FOR INSERT
TO anon, authenticated
WITH CHECK (
  check_rate_limit(email, 5, '1 hour'::interval)
  AND length(trim(name)) > 0
  AND date >= CURRENT_DATE
);
```

#### 3.5 Monitoramento
```sql
-- View para atividades suspeitas
CREATE VIEW suspicious_activity AS
SELECT 
  email,
  COUNT(*) as booking_count,
  MIN(created_at) as first_booking,
  MAX(created_at) as last_booking
FROM bookings
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY email
HAVING COUNT(*) > 3
ORDER BY booking_count DESC;
```

---

## 🎯 Próximos Passos Recomendados

### Curto Prazo (Esta Semana)
1. [ ] Implementar autenticação real com Supabase Auth
2. [ ] Configurar alertas de segurança
3. [ ] Testar recuperação de senha
4. [ ] Adicionar CAPTCHA após múltiplas falhas

### Médio Prazo (Este Mês)
5. [ ] Implementar 2FA (Two-Factor Authentication)
6. [ ] Configurar backup automático
7. [ ] Realizar teste de penetração completo
8. [ ] Documentar procedimentos de segurança

### Longo Prazo (Próximos 3 Meses)
9. [ ] Implementar criptografia de dados PII
10. [ ] Configurar WAF (Web Application Firewall)
11. [ ] Implementar detecção de anomalias com ML
12. [ ] Obter certificação de segurança

---

## 📊 Comparação Antes vs Depois

| Aspecto | Antes | Depois |
|---------|-------|--------|
| **Credenciais no código** | ❌ Expostas | ✅ Removidas |
| **Chave Supabase** | ❌ Hardcoded | ✅ Env only |
| **Validação de email** | ❌ Nenhuma | ✅ Regex |
| **Validação de telefone** | ❌ Nenhuma | ✅ Formato BR |
| **Rate limiting** | ❌ Nenhum | ✅ 5/hora |
| **Auditoria** | ❌ Nenhuma | ✅ Completa |
| **Índices** | ❌ Básicos | ✅ Otimizados |
| **RLS** | ⚠️ Parcial | ✅ Completo |
| **Monitoramento** | ❌ Nenhum | ✅ Views |
| **SQL Injection** | ✅ Protegido | ✅ Protegido |

---

## 🔐 Checklist de Segurança

### Aplicação Frontend
- [x] Credenciais removidas do código
- [x] Chaves de API em variáveis de ambiente
- [ ] Autenticação real implementada
- [ ] HTTPS enforcement
- [ ] CAPTCHA configurado

### Banco de Dados
- [ ] Script SQL executado
- [ ] Validações ativas
- [ ] Índices criados
- [ ] Auditoria funcionando
- [ ] Rate limiting testado
- [ ] RLS verificado

### Infraestrutura
- [ ] Chave anônima rotacionada
- [ ] Backups configurados
- [ ] Alertas configurados
- [ ] Monitoramento ativo
- [ ] Logs centralizados

---

## 📞 Suporte

Se encontrar algum problema durante a aplicação das correções:

1. **Verifique os logs do Supabase:**
   - Dashboard → Logs → Postgres Logs

2. **Execute o teste de segurança:**
   ```bash
   node database-security-test.mjs
   ```

3. **Consulte a documentação:**
   - `SECURITY_AUDIT.md` - Relatório de vulnerabilidades
   - `DATABASE_SECURITY_AUDIT.md` - Auditoria do banco
   - `SECURITY_IMPLEMENTATION.md` - Guia de implementação

---

## ✅ Confirmação de Conclusão

Após executar todos os passos, confirme:

- [ ] Script SQL executado sem erros
- [ ] Chave anônima rotacionada
- [ ] Arquivo `.env.local` atualizado
- [ ] Aplicação funcionando normalmente
- [ ] Testes de segurança passando
- [ ] Auditoria registrando eventos

**Data de Conclusão:** _______________  
**Responsável:** _______________  
**Próxima Revisão:** _______________

---

**Última Atualização:** 2026-01-12  
**Versão:** 1.0  
**Status:** 🟢 Pronto para Execução
