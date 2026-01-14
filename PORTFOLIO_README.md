# 📁 Portfólio - Connect Agency

## 🎯 Visão Geral

A área de portfólio foi criada para gerenciar e exibir os trabalhos realizados pela Connect Agency. É uma página separada da landing page, acessível apenas através do painel administrativo.

## 🚀 Como Acessar

1. **Faça login** no painel administrativo em `/login`
2. **Acesse o Admin Dashboard** em `/admin`
3. **Clique no botão "Portfólio"** no sidebar (ícone de maleta 💼)
4. Você será redirecionado para `/portfolio`

## 📊 Funcionalidades

### ✨ Visualização
- **Grid responsivo** com cards de portfólio
- **Filtros por categoria**: Vídeos, Imagens, Projetos
- **Busca** por título, descrição ou nome do cliente
- **Estatísticas** em tempo real (total de itens por categoria)

### ➕ Adicionar Item
1. Clique no botão **"Adicionar"** no topo da página (apenas para admins logados)
2. Preencha os campos:
   - **Título*** (obrigatório)
   - **Categoria*** (obrigatório): Vídeo, Imagem ou Projeto
   - **Descrição**: Detalhes sobre o trabalho
   - **Nome do Cliente**: Cliente ou empresa
   
3. **Escolha o método de upload**:

   **📎 Opção 1: URL (Instagram, YouTube, etc)**
   - Cole a URL direta de imagens ou vídeos
   - **Exemplos de URLs suportadas**:
     - Instagram: `https://instagram.com/p/ABC123/` ou `https://instagram.com/reel/XYZ789/`
     - YouTube: `https://youtube.com/watch?v=ABC123`
     - TikTok: `https://tiktok.com/@user/video/123456`
     - Qualquer link direto de imagem: `https://exemplo.com/imagem.jpg`
   
   **📤 Opção 2: Upload do Dispositivo**
   - Clique em "Escolher arquivo" e selecione do seu dispositivo
   - **Formatos suportados**:
     - Imagens: JPEG, PNG, GIF, WEBP
     - Vídeos: MP4, WEBM, MOV
   - **Tamanho máximo**: 50MB por arquivo
   - Veja o preview antes de enviar
   - Acompanhe o progresso do upload

4. **Tags** (opcional): Palavras-chave separadas por vírgula
5. Clique em **"Adicionar"**

### 🗑️ Excluir Item
- Passe o mouse sobre um card
- Clique no **ícone de lixeira** (🗑️) que aparece no canto superior direito
- Confirme a exclusão

## 🗄️ Banco de Dados

### Criar a Tabela
Execute o arquivo SQL no Supabase:
```bash
# No Supabase Dashboard > SQL Editor
# Cole o conteúdo de: create-portfolio-table.sql
```

### Estrutura da Tabela `portfolio`

| Campo | Tipo | Descrição |
|-------|------|-----------|
| `id` | UUID | ID único (gerado automaticamente) |
| `title` | TEXT | Título do projeto (obrigatório) |
| `description` | TEXT | Descrição detalhada |
| `category` | TEXT | Categoria: 'video', 'image' ou 'project' |
| `image_url` | TEXT | URL da imagem de preview |
| `video_url` | TEXT | URL do vídeo |
| `client_name` | TEXT | Nome do cliente |
| `tags` | TEXT[] | Array de tags |
| `created_at` | TIMESTAMP | Data de criação |
| `updated_at` | TIMESTAMP | Data da última atualização |

### 🔒 Segurança (RLS)

A tabela possui **Row Level Security** habilitado:

- ✅ **Leitura pública**: Qualquer pessoa pode visualizar (para futuro site público)
- 🔐 **Escrita autenticada**: Apenas usuários autenticados podem adicionar/editar/excluir

## 📦 Supabase Storage

### Bucket `portfolio`
Os arquivos enviados são armazenados no Supabase Storage:

- **Bucket público**: `portfolio`
- **Tamanho máximo**: 50MB por arquivo
- **Tipos permitidos**: 
  - Imagens: JPEG, PNG, GIF, WEBP
  - Vídeos: MP4, WEBM, MOV (QuickTime)

### Políticas de Acesso
- ✅ **Leitura pública**: Qualquer pessoa pode acessar os arquivos
- 🔐 **Upload autenticado**: Apenas admins podem fazer upload
- 🔐 **Atualização/Exclusão**: Apenas admins autenticados

### URLs Geradas
Quando você faz upload de um arquivo, o sistema:
1. Gera um nome único para o arquivo
2. Faz upload para o bucket `portfolio`
3. Retorna a URL pública do arquivo
4. Salva a URL no banco de dados

**Exemplo de URL gerada**:
```
https://[seu-projeto].supabase.co/storage/v1/object/public/portfolio/abc123-1234567890.jpg
```

## 🎨 Design

A página segue o **design system Connect**:
- ✨ Tema escuro premium
- 🌊 Animações suaves com Framer Motion
- ⚡ Efeitos de energia e conexão
- 📱 Totalmente responsivo
- 🎯 Glassmorphism e gradientes

## 🔄 Próximos Passos

### Melhorias Futuras
- [ ] Upload direto de imagens (Supabase Storage)
- [ ] Edição de itens existentes
- [ ] Ordenação personalizada (drag & drop)
- [ ] Página pública de portfólio na landing page
- [ ] Galeria lightbox para visualização de imagens
- [ ] Embed de vídeos do YouTube/Vimeo
- [ ] Exportação de portfólio em PDF

## 📝 Notas Importantes

1. **Autenticação Obrigatória**: A página só é acessível para usuários autenticados
2. **Proteção de Rota**: Usa o componente `ProtectedRoute`
3. **Validação**: O título é obrigatório para adicionar um item
4. **Performance**: Usa índices no banco para queries rápidas

## 🐛 Troubleshooting

### Erro ao carregar itens
- Verifique se a tabela `portfolio` foi criada no Supabase
- Confirme que as políticas RLS estão ativas
- Verifique a conexão com o Supabase

### Erro ao adicionar item
- Certifique-se de estar autenticado
- Verifique se preencheu o título (obrigatório)
- Confirme que a categoria está correta

### Botão não aparece no sidebar
- Verifique se importou o ícone `Briefcase` do lucide-react
- Confirme que a rota `/portfolio` está no App.tsx
- Limpe o cache do navegador

---

**Desenvolvido com ❤️ para Connect Agency**
