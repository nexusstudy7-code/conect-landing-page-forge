# Configuração do Agente de IA com n8n

Para que o agente de IA da Connect funcione, você precisará configurar um workflow no n8n. Siga os passos abaixo:

## 1. Estrutura do Workflow
O workflow recomendado deve ter os seguintes nós:
- **Webhook**: Gateway para receber mensagens do site.
- **AI Agent**: O cérebro do chat.
- **Chat Memory**: Para manter o contexto da conversa.
- **Tools (Ferramentas)**: Para o agente realizar ações.

## 2. Configurações dos Nós

### Webhook
- **HTTP Method**: POST
- **Path**: chat (resultando em algo como `https://seu-n8n.com/webhook/chat`)
- **Respond**: Using 'Respond to Webhook' node ou Respond directly with JSON.

### AI Agent (Cérebro)
- **Model**: OpenAI (GPT-4o recomendado) ou Anthropic (Claude 3.5 Sonnet).
- **Prompt do Sistema (System Message)**:
```text
Você é o assistente virtual oficial da Connect.
Seu objetivo é:
1. Explicar sobre a empresa.
2. Realizar agendamentos coletando: Nome, Email, Telefone, Tipo de Serviço (Gravação ou Reunião), Data e Hora.

PROCESSO DE AGENDAMENTO:
- Quando o usuário quiser agendar, peça educadamente cada uma das informações necessárias se ele ainda não as forneceu.
- Tipos de serviço aceitos: 'recording' (Gravação de Conteúdo) ou 'meeting' (Reunião Estratégica).
- Formato de Data: YYYY-MM-DD.
- Formato de Hora: HH:MM.
- Assim que tiver TODOS os dados, utilize a ferramenta 'insert_booking' para salvar no banco de dados.
- Após salvar com sucesso, responda confirmando o agendamento e inclua "action": "booking_saved" no JSON de resposta.

Sobre a Connect:
- Branding, Tráfego, Social Media, Web Dev.
- Stats: 150+ conexões, 98% satisfação, +5M em campanhas.
```

## 3. Ferramenta: Insert Booking (n8n Tool)
No n8n, dentro do nó AI Agent, adicione uma ferramenta do tipo **"Custom Tool"** ou use o nó do **Supabase** diretamente se o seu agente suportar.

**Definição da Ferramenta (se usar Custom Tool):**
- **Name**: `insert_booking`
- **Description**: "Insere um novo agendamento no banco de dados da Connect."
- **Parameters (JSON Schema)**:
```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string" },
    "phone": { "type": "string" },
    "type": { "type": "string", "enum": ["recording", "meeting"] },
    "date": { "type": "string", "description": "Formato YYYY-MM-DD" },
    "time": { "type": "string", "description": "Formato HH:MM" },
    "message": { "type": "string" }
  },
  "required": ["name", "email", "phone", "type", "date", "time"]
}
```

**Workflow da Ferramenta**:
Conecte esta ferramenta a um nó do **Supabase**:
- **Resource**: Database
- **Operation**: Insert
- **Table**: `bookings`
- **Columns**: Mapeie os campos acima. Adicione `status: "pending"`.

## 4. Formato de Resposta Esperado pelo Site
O chat no frontend espera um JSON com este formato:
```json
{
  "output": "Agendamento realizado com sucesso para o dia 20/02 às 14h!",
  "action": "booking_saved" 
}
```
*As ações reconhecidas são: `open_booking` (rola até o forms) e `booking_saved` (mostra animação de sucesso no chat).*

## 4. Integração no Site
1. Copie a URL do seu Webhook de produção do n8n.
2. No arquivo `.env.local` (ou nas variáveis de ambiente do Vercel), cole a URL em:
   `VITE_N8N_WEBHOOK_URL=https://seu-n8n.com/webhook/chat`

---
*Este agente permite que sua landing page seja interativa 24/7, capturando leads e respondendo dúvidas instantaneamente.*
