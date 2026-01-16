-- =====================================================
-- Criar Webhook usando Database Trigger (Alternativa)
-- =====================================================
-- A interface de Webhooks foi descontinuada no Supabase
-- Use este método com triggers do PostgreSQL

-- 1. Habilitar a extensão pg_net (para fazer HTTP requests)
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Criar função que envia notificação push
CREATE OR REPLACE FUNCTION notify_new_booking()
RETURNS TRIGGER AS $$
DECLARE
    request_id bigint;
BEGIN
    -- Fazer POST request para a Edge Function
    SELECT net.http_post(
        url := 'https://lqgpdsrntfwsjgxuxosa.supabase.co/functions/v1/send-push-notification',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZ3Bkc3JudGZ3c2pneHV4b3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjQ4MTMsImV4cCI6MjA4MzUwMDgxM30.g6HlEjpcGT8zGnDZ1Rt0Gx9-AgFpTl0_-nYnhv_dxqc'
        ),
        body := jsonb_build_object(
            'record', row_to_json(NEW)
        )
    ) INTO request_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Criar trigger que executa após INSERT na tabela bookings
DROP TRIGGER IF EXISTS on_booking_created ON bookings;

CREATE TRIGGER on_booking_created
    AFTER INSERT ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION notify_new_booking();

-- 4. Verificar se o trigger foi criado
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    trigger_name = 'on_booking_created';

-- 5. Testar o trigger (OPCIONAL - cria um agendamento de teste)
-- DESCOMENTE para testar:
/*
INSERT INTO bookings (name, email, phone, date, time, type, message, status)
VALUES (
    'Teste Push Notification',
    'teste@connect.com',
    '84988156694',
    CURRENT_DATE + INTERVAL '1 day',
    '14:00',
    'meeting',
    'Teste de notificação push',
    'pending'
);
*/

-- 6. Ver logs de requisições HTTP (para debug)
SELECT 
    id,
    created_at,
    url,
    status_code,
    error_msg
FROM 
    net._http_response
ORDER BY 
    created_at DESC
LIMIT 10;
