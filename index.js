#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import Groq from "groq-sdk";
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY || "YOUR_GROQ_API_KEY_HERE" });
const AVAILABLE_SKILLS = ["olympia-reasoning"];

// Sistema de prompts mais inteligente
const SYSTEM_PROMPT = `Você é OlympIA ⚡, uma IA de raciocínio lógico baseada em Groq Llama 3.3.

INSTRUÇÕES CRÍTICAS:
1. **Responda com PRECISÃO** - NÃO alucine informações
2. **Seja LÓGICO** - Sempre pense antes de responder
3. **Se não souber, DIGA** - "Não tenho informação sobre isso" é melhor que alucinação
4. **DETECTE O CONTEXTO** - Se o usuário pedir algo que tenha um comando, SUGIRA-O
5. **RESPONDA DE FORMA CONCISA** - Evite respostas muito longas

COMANDOS DISPONÍVEIS (quando o usuário solicitar):
- /gerar - Criar conteúdo criativo
- /analisar - Análise profunda
- /keywords - Extrair palavras-chave
- /imagem - Gerar imagens
- /google - Pesquisar na internet
- /traduzir - Traduzir textos
- /email - Enviar emails
- /pdf - Gerar PDFs
- /casa - Controlar casa inteligente

Se o usuário pedir algo relacionado a esses comandos, SUGIRA qual usar.
Exemplo: "Isso parece uma tarefa de geração de conteúdo! Use /gerar para isso."

NUNCA simule resultados de buscas, traduções ou imagens que não pode gerar.`;

class OlympIAServer {
  constructor() {
    this.server = new Server({ name: "olympia", version: "1.0.0" }, { capabilities: { tools: {} } });
    this.setupHandlers();
  }
  
  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: [{ name: "list_skills", description: "List skills", inputSchema: { type: "object", properties: {} } }, { name: "olympia_reasoning", description: "Resposta inteligente com raciocínio lógico", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } }] }));
    
    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      if (req.params.name === "list_skills") return { content: [{ type: "text", text: "⚡ OlympIA Skills:\n- Reasoning lógico e preciso\n- Detecção de contexto\n- Sugestões de comandos\n- Análise racional" }] };
      if (req.params.name === "olympia_reasoning") {
        try {
          const completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: req.params.arguments.prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5, // Menor para respostas mais precisas
            max_tokens: 1024,
          });
          const text = completion.choices[0]?.message?.content || "Sem resposta";
          return { content: [{ type: "text", text: `⚡ OlympIA:\n\n${text}` }] };
        } catch (e) {
          return { content: [{ type: "text", text: `❌ Erro: ${e.message}` }] };
        }
      }
    });
  }
  
  async run() {
    await this.server.connect(new StdioServerTransport());
    console.error("OlympIA running");
  }
}

new OlympIAServer().run().catch(console.error);
