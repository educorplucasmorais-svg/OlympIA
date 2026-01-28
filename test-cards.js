// Script para testar os cards atualizados do Telegram
import TelegramBot from 'node-telegram-bot-api';

// Simular os comandos hot
const HOT_COMMANDS = [
  { name: '/gerar', emoji: '🔥✨', desc: 'Gerar conteúdo criativo com IA', category: 'IA' },
  { name: '/imagem', emoji: '🔥🎨', desc: 'Gerar imagem 1024x1024px', category: 'IA' },
  { name: '/pdf', emoji: '🔥📄', desc: 'Gerar PDF com conteúdo', category: 'Utilidades' },
  { name: '/promocao', emoji: '🔥📢', desc: '5 posts prontos para redes sociais', category: 'Marketing' },
  { name: '/email', emoji: '🔥📧', desc: 'Enviar email via Gmail', category: 'Utilidades' },
  { name: '/marketing', emoji: '🔥📊', desc: 'Estratégia SEO e Marketing', category: 'Marketing' },
  { name: '/conhecimento', emoji: '🔥🧠', desc: 'Busca na base de conhecimento com RAG', category: 'IA' },
  { name: '/chat', emoji: '🔥💬', desc: 'Chat com memória de contexto', category: 'IA' }
];

const hotCommands = HOT_COMMANDS.map(cmd => cmd.name);

const hot = (cmd) => hotCommands.includes(cmd) ? '🔥 ' : '';

// Menu Usuário Atualizado
const userMenu = `🤖 *Olá Teste! Bem-vindo à OlympIA*
Sua IA inteligente com superpoderes

✨ *Criatividade com IA*
• ${hot('/gerar')}💡 \`/gerar\` - Criar ideias geniais
• ${hot('/analisar')}🔍 \`/analisar\` - Análise profunda
• ${hot('/keywords')}🎯 \`/keywords\` - Palavras-chave
• ${hot('/imagem')}🎭 \`/imagem\` - Gerar imagens
• ${hot('/chat')}💭 \`/chat\` - Conversa inteligente

🛠️ *Ferramentas*
• ${hot('/traduzir')}🌍 \`/traduzir\` - Tradução
• ${hot('/senha')}🔐 \`/senha\` - Gerar senha
• ${hot('/morse')}📡 \`/morse\` - Código Morse
• ${hot('/noticias')}📰 \`/noticias\` - Notícias
• ${hot('/falar')}🎙️ \`/falar\` - Text-to-Speech
• ${hot('/ocr')}📸 \`/ocr\` - Extrair texto
• ${hot('/email')}✉️ \`/email\` - Enviar email
• ${hot('/lembrete')}⏰ \`/lembrete\` - Lembretes
• ${hot('/pdf')}📋 \`/pdf\` - Gerar PDF
• ${hot('/google')}🔎 \`/google\` - Pesquisar

📚 *Conhecimento*
• ${hot('/conhecimento')}📚 \`/conhecimento\` - Base de dados IA
• ${hot('/kb:stats')}📈 \`/kb:stats\` - Estatísticas

🎯 *Marketing*
• ${hot('/marketing')}📊 \`/marketing\` - Estratégias
• ${hot('/promocao')}🎉 \`/promocao\` - Posts virais

💡 *Ou escreva qualquer coisa para conversar!*`;

// Menu Admin Atualizado
const adminMenu = `👑 *Olá Teste! Acesso Admin*

*Painel Administrativo:*
📊 \`/info\` - Painel completo de gerência
📋 \`/relatorio\` - Gerar relatórios
📁 \`/relatorios\` - Listar relatórios salvos

*Comandos Disponíveis:*

✨ *Criatividade com IA*
• ${hot('/gerar')}💡 \`/gerar\` - Criar ideias geniais
• ${hot('/analisar')}🔍 \`/analisar\` - Análise profunda
• ${hot('/keywords')}🎯 \`/keywords\` - Palavras-chave
• ${hot('/imagem')}🎭 \`/imagem\` - Gerar imagens
• ${hot('/chat')}💭 \`/chat\` - Conversa inteligente
• ${hot('/skills')}🎯 \`/skills\` - Ver todas as skills

🛠️ *Ferramentas*
• ${hot('/traduzir')}🌍 \`/traduzir\` - Tradução
• ${hot('/senha')}🔐 \`/senha\` - Gerar senha
• ${hot('/morse')}📡 \`/morse\` - Código Morse
• ${hot('/noticias')}📰 \`/noticias\` - Notícias
• ${hot('/falar')}🎙️ \`/falar\` - Text-to-Speech
• ${hot('/ocr')}📸 \`/ocr\` - Extrair texto
• ${hot('/email')}✉️ \`/email\` - Enviar email
• ${hot('/lembrete')}⏰ \`/lembrete\` - Lembretes
• ${hot('/pdf')}📋 \`/pdf\` - Gerar PDF
• ${hot('/google')}🔎 \`/google\` - Pesquisar

📚 *Conhecimento*
• ${hot('/conhecimento')}📚 \`/conhecimento\` - Base de dados IA
• ${hot('/kb:stats')}📈 \`/kb:stats\` - Estatísticas

🎯 *Marketing*
• ${hot('/marketing')}📊 \`/marketing\` - Estratégias
• ${hot('/promocao')}🎉 \`/promocao\` - Posts virais
• ${hot('/social')}👥 \`/social\` - Redes sociais
• ${hot('/vip')}👑 \`/vip\` - Recursos premium

🏠 *Casa Inteligente*
• ${hot('/casa')}💡 \`/casa\` - Automação residencial

⭐ *Favoritos*
• ${hot('/favoritos')}💖 \`/favoritos\` - Seus comandos favoritos

📋 *Menus Rápidos*
• ${hot('/ia')}🤖 \`/ia\` - Menu IA completo
• ${hot('/utilidades')}🛠️ \`/utilidades\` - Menu ferramentas
• ${hot('/ajuda')}🤝 \`/ajuda\` - Central de ajuda

💡 *Ou escreva qualquer coisa para conversar!*`;

console.log('🎨 VISUALIZAÇÃO DOS CARDS ATUALIZADOS DO TELEGRAM\n');
console.log('=' .repeat(60));
console.log('\n📱 MENU USUÁRIO (/start):');
console.log('=' .repeat(60));
console.log(userMenu);

console.log('\n' + '=' .repeat(60));
console.log('\n👑 MENU ADMIN (/start para admin):');
console.log('=' .repeat(60));
console.log(adminMenu);

console.log('\n' + '=' .repeat(60));
console.log('\n✅ CARDS ATUALIZADOS COM SUCESSO!');
console.log('🔥 Comandos hot marcados com emoji');
console.log('📋 Todos os comandos organizados por categoria');
console.log('🎯 Navegação mais intuitiva');
console.log('=' .repeat(60));