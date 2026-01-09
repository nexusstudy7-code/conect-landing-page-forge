# Configuração do Supabase

## 📊 Tabelas Criadas

### 1. **bookings** (Agendamentos)
Armazena todos os agendamentos de gravações e reuniões.

**Campos:**
- `id` (UUID) - Identificador único
- `name` (TEXT) - Nome do cliente
- `email` (TEXT) - Email do cliente
- `phone` (TEXT) - Telefone do cliente
- `type` (TEXT) - Tipo: 'recording' ou 'meeting'
- `date` (DATE) - Data do agendamento
- `time` (TIME) - Hora do agendamento
- `message` (TEXT) - Observações/mensagem
- `status` (TEXT) - Status: 'pending', 'confirmed', 'completed', 'cancelled'
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

### 2. **clients** (Clientes)
Armazena informações dos clientes e histórico de agendamentos.

**Campos:**
- `id` (UUID) - Identificador único
- `name` (TEXT) - Nome do cliente
- `email` (TEXT) - Email do cliente (único)
- `phone` (TEXT) - Telefone do cliente
- `company` (TEXT) - Empresa do cliente
- `total_bookings` (INTEGER) - Total de agendamentos
- `last_booking` (DATE) - Data do último agendamento
- `created_at` (TIMESTAMP) - Data de criação
- `updated_at` (TIMESTAMP) - Data de atualização

## 🔒 Segurança (RLS)

Ambas as tabelas possuem Row Level Security (RLS) habilitado:

- **Leitura**: Apenas usuários autenticados podem ler os dados
- **Inserção (bookings)**: Qualquer pessoa pode criar agendamentos (formulário público)
- **Inserção (clients)**: Apenas usuários autenticados
- **Atualização/Exclusão**: Apenas usuários autenticados

## 🔄 Triggers Automáticos

### Atualização de Clientes
Quando um novo agendamento é criado, o sistema automaticamente:
1. Cria um novo cliente (se não existir)
2. Atualiza o contador de agendamentos do cliente
3. Atualiza a data do último agendamento

## 🔑 Credenciais

**URL do Projeto:** https://lqgpdsrntfwsjgxuxosa.supabase.co

**Chaves da API:**
- **Anon Key (Pública):** Configurada no `.env.example`
- **Service Role Key:** Disponível no dashboard do Supabase (não compartilhar)

## 📝 Como Usar

### 1. Configurar Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env.local`:
```bash
cp .env.example .env.local
```

### 2. Instalar Dependências

```bash
npm install @supabase/supabase-js
```

### 3. Importar o Cliente

```typescript
import { supabase } from '@/lib/supabase/client';
```

### 4. Exemplos de Uso

#### Buscar todos os agendamentos
```typescript
const { data, error } = await supabase
  .from('bookings')
  .select('*')
  .order('created_at', { ascending: false });
```

#### Criar um novo agendamento
```typescript
const { data, error } = await supabase
  .from('bookings')
  .insert({
    name: 'João Silva',
    email: 'joao@email.com',
    phone: '(84) 98888-8888',
    type: 'recording',
    date: '2026-01-15',
    time: '14:00',
    message: 'Observações...',
    status: 'pending'
  });
```

#### Atualizar status de um agendamento
```typescript
const { data, error } = await supabase
  .from('bookings')
  .update({ status: 'confirmed' })
  .eq('id', bookingId);
```

#### Buscar todos os clientes
```typescript
const { data, error } = await supabase
  .from('clients')
  .select('*')
  .order('total_bookings', { ascending: false });
```

## 🎯 Próximos Passos

1. ✅ Tabelas criadas no Supabase
2. ✅ Tipos TypeScript gerados
3. ✅ Cliente Supabase configurado
4. 🔄 Integrar com o AdminDashboard
5. 🔄 Integrar com o formulário de agendamento
6. 🔄 Adicionar funcionalidade de converter agendamento em cliente
7. 🔄 Implementar autenticação real (substituir localStorage)

## 📚 Documentação

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
