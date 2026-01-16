import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from 'jsr:@supabase/supabase-js@2';

// CORS headers for cross-origin requests
const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// TypeScript interfaces for type safety
interface BookingRecord {
    id: string;
    name: string;
    email: string;
    phone: string;
    date: string;
    time: string;
    type: string;
    message?: string;
    status: string;
    created_at: string;
}

interface PushSubscription {
    endpoint: string;
    subscription: string | object;
    user_id?: string;
    created_at?: string;
    updated_at?: string;
}

interface NotificationPayload {
    title: string;
    body: string;
    icon?: string;
    badge?: string;
    url?: string;
    data?: {
        bookingId: string;
        timestamp: string;
    };
}

interface WebPushError extends Error {
    statusCode?: number;
}

Deno.serve(async (req: Request) => {
    // Handle CORS preflight requests
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        // Get booking data from webhook
        const body = await req.json();
        const record = body.record as BookingRecord;

        console.log('New booking received:', record);

        // Initialize Supabase client with service role key
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Missing Supabase environment variables');
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Fetch all active push subscriptions
        const { data: subscriptions, error: subError } = await supabase
            .from('push_subscriptions')
            .select('*');

        if (subError) {
            console.error('Error fetching subscriptions:', subError);
            throw subError;
        }

        if (!subscriptions || subscriptions.length === 0) {
            console.log('No subscriptions found');
            return new Response(
                JSON.stringify({ message: 'No subscriptions to notify' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            );
        }

        console.log(`Found ${subscriptions.length} subscription(s)`);

        // Import web-push library
        const webpush = await import('npm:web-push@3.6.7');

        // Get VAPID credentials from environment
        const vapidPublicKey = Deno.env.get('VAPID_PUBLIC_KEY');
        const vapidPrivateKey = Deno.env.get('VAPID_PRIVATE_KEY');
        const vapidSubject = Deno.env.get('VAPID_SUBJECT') || 'mailto:luanv2570@gmail.com';

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error('Missing VAPID keys in environment variables');
        }

        // Set VAPID details for web-push
        webpush.default.setVapidDetails(
            vapidSubject,
            vapidPublicKey,
            vapidPrivateKey
        );

        // Prepare notification payload
        const dateStr = record.date
            ? new Date(record.date).toLocaleDateString('pt-BR')
            : 'data não especificada';

        const payload: NotificationPayload = {
            title: 'Novo Agendamento Connect! 🔌',
            body: `${record.name || 'Cliente'} agendou para ${dateStr}`,
            icon: '/notification-icon.png',
            badge: '/notification-icon.png',
            url: '/admin',
            data: {
                bookingId: record.id,
                timestamp: new Date().toISOString()
            }
        };

        console.log('Sending notifications with payload:', payload);

        // Send push notification to all subscriptions
        const results = await Promise.allSettled(
            (subscriptions as PushSubscription[]).map(async (sub) => {
                try {
                    // Parse subscription if it's stored as a string
                    const subscription = typeof sub.subscription === 'string'
                        ? JSON.parse(sub.subscription)
                        : sub.subscription;

                    await webpush.default.sendNotification(subscription, JSON.stringify(payload));
                    console.log(`✓ Notification sent to: ${sub.endpoint.substring(0, 50)}...`);
                    return { success: true, endpoint: sub.endpoint };
                } catch (error) {
                    const webPushError = error as WebPushError;
                    console.error(`✗ Failed to send to ${sub.endpoint}:`, webPushError.message);

                    // If subscription is invalid (410 Gone), remove it from database
                    if (webPushError.statusCode === 410) {
                        console.log(`Removing invalid subscription: ${sub.endpoint}`);
                        await supabase
                            .from('push_subscriptions')
                            .delete()
                            .eq('endpoint', sub.endpoint);
                    }

                    return {
                        success: false,
                        endpoint: sub.endpoint,
                        error: webPushError.message
                    };
                }
            })
        );

        // Count successes and failures
        const successful = results.filter(
            (r) => r.status === 'fulfilled' && r.value.success
        ).length;
        const failed = results.length - successful;

        console.log(`📊 Notifications sent: ${successful} successful, ${failed} failed`);

        return new Response(
            JSON.stringify({
                success: true,
                message: `Sent ${successful} notification(s), ${failed} failed`,
                results: results.map((r) =>
                    r.status === 'fulfilled' ? r.value : { success: false }
                )
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200
            }
        );

    } catch (error) {
        const err = error as Error;
        console.error('❌ Error in send-push-notification function:', err);
        return new Response(
            JSON.stringify({
                success: false,
                error: err.message,
                stack: err.stack
            }),
            {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 500
            }
        );
    }
});
