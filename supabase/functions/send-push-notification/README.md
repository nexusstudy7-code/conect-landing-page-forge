# Edge Function: send-push-notification

Esta Edge Function envia notificações push para todos os dispositivos inscritos quando um novo agendamento é criado.

## Configuração

### Variáveis de Ambiente (Supabase Dashboard)

Adicione estas variáveis no Supabase Dashboard → Edge Functions → Secrets:

```
VAPID_PUBLIC_KEY=BG7dMBOQfLFfwZOfgu7gl2vJhOC_LNxNpipnEgDjx6fpl-lUTBZCRDQja59tNSSxpGQn58V9jmsUmXgTUgghpFc
VAPID_PRIVATE_KEY=j-i4seZVGDiBYuPgaH4ADUMTkkoCvrxVKusqNxTeq7U
VAPID_SUBJECT=mailto:luanv2570@gmail.com
```

## Deploy

Para fazer deploy desta função:

```bash
# Instalar Supabase CLI (se ainda não tiver)
npm install -g supabase

# Login no Supabase
supabase login

# Link ao projeto
supabase link --project-ref SEU_PROJECT_REF

# Deploy da função
supabase functions deploy send-push-notification
```

## Webhook Configuration

Após deploy, configure o Database Webhook:

1. Vá em **Database** → **Webhooks** no Supabase Dashboard
2. Clique em **Create a new hook**
3. Configure:
   - **Name**: `notify-new-booking`
   - **Table**: `bookings`
   - **Events**: `INSERT`
   - **Type**: `HTTP Request`
   - **Method**: `POST`
   - **URL**: `https://SEU_PROJECT_REF.supabase.co/functions/v1/send-push-notification`
   - **HTTP Headers**: 
     - `Authorization`: `Bearer SEU_ANON_KEY`
     - `Content-Type`: `application/json`
