// @ts-nocheck: Desabilita a verificação de tipos para este arquivo no VS Code
// Isso é necessário porque o editor tenta validar como Node.js, mas o ambiente é Deno.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

// Cabeçalhos CORS
const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
}

interface PushSubscriptionRow {
    endpoint: string;
    subscription: any;
}

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    try {
        const body = await req.json();
        const record = (body.record || body) as BookingRecord;

        if (!record || !record.id) {
            return new Response(
                JSON.stringify({ success: false, error: "Payload inválido" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 }
            );
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
        const supabase = createClient(supabaseUrl, supabaseKey);

        const { data: subscriptions, error: subError } = await supabase
            .from("push_subscriptions")
            .select("endpoint, subscription");

        if (subError) throw subError;

        if (!subscriptions || subscriptions.length === 0) {
            return new Response(
                JSON.stringify({ success: true, message: "Sem assinaturas" }),
                { headers: { ...corsHeaders, "Content-Type": "application/json" } }
            );
        }

        const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY") ?? "";
        const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
        const vapidSubject = Deno.env.get("VAPID_SUBJECT") || "mailto:admin@sejaconnect.com.br";

        if (!vapidPublicKey || !vapidPrivateKey) {
            throw new Error("Chaves VAPID não configuradas");
        }

        webpush.setVapidDetails(vapidSubject, vapidPublicKey, vapidPrivateKey);

        const siteUrl = Deno.env.get("SITE_URL") || "https://sejaconnect.com.br";
        const dateStr = record.date
            ? new Date(record.date.replace(/-/g, "/")).toLocaleDateString("pt-BR")
            : "---";

        const notificationPayload = JSON.stringify({
            title: "Novo Agendamento! 🔌",
            body: `${record.name || "Cliente"} agendou para ${dateStr} às ${record.time || ""}`,
            icon: `${siteUrl}/notification-icon.png`,
            badge: `${siteUrl}/notification-icon.png`,
            url: `${siteUrl}/admin`,
            data: {
                bookingId: record.id,
                timestamp: new Date().toISOString()
            }
        });

        const results = await Promise.allSettled(
            subscriptions.map(async (sub: PushSubscriptionRow) => {
                try {
                    const pushConfig = typeof sub.subscription === "string"
                        ? JSON.parse(sub.subscription)
                        : sub.subscription;

                    if (!pushConfig?.endpoint) return { success: false };

                    await webpush.sendNotification(pushConfig, notificationPayload);
                    return { success: true, endpoint: sub.endpoint };
                } catch (err: any) {
                    if (err.statusCode === 410 || err.statusCode === 404) {
                        await supabase.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
                    }
                    throw err;
                }
            })
        );

        // Filtro simplificado para evitar erros de tipagem implícita no editor
        const successfulCount = results.filter((r: any) => r.status === "fulfilled").length;

        return new Response(
            JSON.stringify({
                success: true,
                enviados: successfulCount,
                total: results.length
            }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );

    } catch (error: any) {
        console.error("Erro Crítico:", error.message);
        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
        );
    }
});
