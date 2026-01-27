# Como Configurar Áudios no n8n Workflow

## 📋 Visão Geral

Este guia explica como configurar o workflow n8n para enviar áudios intercalados com mensagens de texto no chat da Connect AI.

---

## 🎯 Objetivo

Fazer o chat alternar entre mensagens de texto e áudio, proporcionando uma experiência mais dinâmica e humanizada para o usuário.

---

## 🔧 Configuração no n8n

### Opção 1: Usar API de Text-to-Speech (Recomendado)

Adicione um nó entre o **AI Agent** e o **Respond to Webhook** para gerar áudio.

#### Passo 1: Adicionar nó de Text-to-Speech

Você pode usar uma das seguintes APIs:

**A) Google Cloud Text-to-Speech**
- Adicione um nó **HTTP Request**
- Configure para chamar a API do Google Cloud TTS
- Converta a resposta do AI Agent em áudio

**B) ElevenLabs (Melhor qualidade)**
- Adicione um nó **HTTP Request**
- Use a API da ElevenLabs para gerar voz natural
- Retorne a URL do áudio gerado

**C) OpenAI TTS**
- Use a API de Text-to-Speech do OpenAI
- Gera áudio de alta qualidade

#### Passo 2: Modificar o nó "Respond to Webhook"

Atualize o `responseBody` para incluir a URL do áudio:

```javascript
={{
  {
    "output": $json.output.replace(/<function[\s\S]*?<\/function>/g, "").replace(/\[ACTION:.*?\]/g, "").trim(),
    "action": $json.output.includes("Tudo pronto") || $json.output.includes("agendamento foi confirmado") ? "booking_saved" : null,
    "audioUrl": $('Text-to-Speech').json.audioUrl // URL do áudio gerado
  }
}}
```

---

### Opção 2: Lógica de Alternância (Simples)

Se você quiser alternar entre texto e áudio de forma automática:

#### Passo 1: Adicionar nó "Code" após o AI Agent

```javascript
// Conta quantas mensagens já foram enviadas nesta sessão
const sessionId = $('Webhook').item.json.body.sessionId;
const messageCount = $('Window Buffer Memory').getMessageCount(sessionId) || 0;

// Alterna: mensagens pares = texto, ímpares = áudio
const shouldSendAudio = messageCount % 2 === 1;

return {
  json: {
    output: $json.output,
    shouldSendAudio: shouldSendAudio,
    messageCount: messageCount
  }
};
```

#### Passo 2: Adicionar nó "IF" para decidir o caminho

- **Se shouldSendAudio = true**: Vai para o nó de Text-to-Speech
- **Se shouldSendAudio = false**: Vai direto para o Respond to Webhook

#### Passo 3: Configurar dois caminhos de resposta

**Caminho A (Texto apenas):**
```javascript
={{
  {
    "output": $json.output,
    "action": $json.output.includes("Tudo pronto") ? "booking_saved" : null
  }
}}
```

**Caminho B (Com áudio):**
```javascript
={{
  {
    "output": $json.output,
    "action": $json.output.includes("Tudo pronto") ? "booking_saved" : null,
    "audioUrl": $('Text-to-Speech').json.audioUrl
  }
}}
```

---

## 🎤 Exemplo com ElevenLabs (Recomendado)

### 1. Criar conta na ElevenLabs
- Acesse: https://elevenlabs.io
- Crie uma conta gratuita (10.000 caracteres/mês)
- Copie sua API Key

### 2. Adicionar nó HTTP Request no n8n

**Configuração:**
- **Method**: POST
- **URL**: `https://api.elevenlabs.io/v1/text-to-speech/{{VOICE_ID}}/stream`
- **Authentication**: Header Auth
  - **Name**: `xi-api-key`
  - **Value**: `SUA_API_KEY_AQUI`

**Headers:**
```json
{
  "Content-Type": "application/json"
}
```

**Body (JSON):**
```json
{
  "text": "={{ $json.output }}",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**Response Format**: File

### 3. Salvar o áudio e obter URL

Adicione um nó para fazer upload do áudio para um storage (Supabase Storage, AWS S3, etc.) e retornar a URL pública.

**Exemplo com Supabase Storage:**

```javascript
// Nó Code para fazer upload
const audioBuffer = $binary.data;
const fileName = `audio_${Date.now()}.mp3`;

// Upload para Supabase Storage
const { data, error } = await supabase.storage
  .from('chat-audios')
  .upload(fileName, audioBuffer, {
    contentType: 'audio/mpeg'
  });

// Retorna URL pública
const { data: { publicUrl } } = supabase.storage
  .from('chat-audios')
  .getPublicUrl(fileName);

return {
  json: {
    audioUrl: publicUrl
  }
};
```

---

## 📊 Estrutura do Workflow Completo

```
Webhook
  ↓
AI Agent (com Memory)
  ↓
[Decisão: Enviar Áudio?]
  ↓
  ├─→ SIM → Text-to-Speech → Upload Storage → Respond (com audioUrl)
  └─→ NÃO → Respond (só texto)
```

---

## 🎨 Formato da Resposta

O frontend espera este formato JSON:

```json
{
  "output": "Texto da mensagem aqui",
  "action": "booking_saved",  // opcional
  "audioUrl": "https://seu-storage.com/audio.mp3"  // opcional
}
```

**Quando `audioUrl` está presente:**
- O chat exibe o texto
- Logo abaixo, mostra um player de áudio
- O usuário pode escolher ler ou ouvir

---

## 🔄 Lógica de Alternância Inteligente

Você pode criar regras mais sofisticadas:

### Exemplo 1: Áudio apenas em confirmações importantes

```javascript
const shouldSendAudio = 
  $json.output.includes("Tudo pronto") ||
  $json.output.includes("confirmado") ||
  $json.output.includes("agendamento");

return { json: { shouldSendAudio } };
```

### Exemplo 2: Áudio em mensagens longas

```javascript
const textLength = $json.output.length;
const shouldSendAudio = textLength > 200; // Mensagens longas viram áudio

return { json: { shouldSendAudio } };
```

### Exemplo 3: Primeira e última mensagem sempre com áudio

```javascript
const isFirstMessage = $('Window Buffer Memory').getMessageCount() === 0;
const isBookingConfirmation = $json.output.includes("Tudo pronto");

const shouldSendAudio = isFirstMessage || isBookingConfirmation;

return { json: { shouldSendAudio } };
```

---

## 🎯 Vozes Recomendadas (ElevenLabs)

Para português brasileiro, use estas Voice IDs:

- **Feminina Natural**: `21m00Tcm4TlvDq8ikWAM` (Rachel)
- **Masculina Profissional**: `VR6AewLTigWG4xSOukaG` (Arnold)
- **Feminina Jovem**: `EXAVITQu4vr4xnSDxMaL` (Bella)

Você pode testar vozes em: https://elevenlabs.io/voice-library

---

## 💡 Dicas de Otimização

1. **Cache de Áudios**: Salve áudios de mensagens comuns (saudação inicial, confirmações) para economizar API calls

2. **Streaming**: Use o endpoint `/stream` da ElevenLabs para respostas mais rápidas

3. **Compressão**: Converta áudios para formato comprimido (MP3 128kbps) para carregamento rápido

4. **CDN**: Use um CDN (Cloudflare, AWS CloudFront) para servir os áudios mais rápido

5. **Limpeza**: Configure um cron job para deletar áudios antigos (>7 dias) e economizar storage

---

## 🧪 Testando

1. Abra o chat no site
2. Envie uma mensagem
3. Verifique se:
   - A mensagem de texto aparece
   - O player de áudio aparece (se configurado)
   - O áudio toca corretamente
   - A alternância funciona conforme esperado

---

## 🐛 Troubleshooting

### Áudio não aparece
- Verifique se o n8n está retornando `audioUrl` no JSON
- Confirme que a URL do áudio é pública e acessível
- Veja o console do navegador para erros

### Áudio não toca
- Verifique o formato do áudio (MP3, WAV, OGG)
- Confirme que o CORS está configurado no storage
- Teste a URL do áudio diretamente no navegador

### Erro de CORS
- Configure CORS no Supabase Storage ou seu storage
- Adicione headers CORS no n8n se necessário

---

## 📝 Exemplo Completo de Workflow

Aqui está um exemplo de como ficaria o nó "Respond to Webhook" com lógica condicional:

```javascript
={{
  {
    "output": $json.output.replace(/<function[\s\S]*?<\/function>/g, "").replace(/\[ACTION:.*?\]/g, "").trim(),
    "action": $json.output.includes("Tudo pronto") || $json.output.includes("agendamento foi confirmado") ? "booking_saved" : null,
    "audioUrl": $json.shouldSendAudio ? $('ElevenLabs TTS').json.audioUrl : undefined
  }
}}
```

---

## 🚀 Próximos Passos

1. Escolha uma API de Text-to-Speech
2. Configure as credenciais no n8n
3. Adicione os nós necessários ao workflow
4. Teste a funcionalidade
5. Ajuste a lógica de alternância conforme necessário

Boa sorte! 🎉
