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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({ 
      tools: [
        { name: "list_skills", description: "List skills", inputSchema: { type: "object", properties: {} } }, 
        { name: "olympia_reasoning", description: "Resposta inteligente com raciocínio lógico", inputSchema: { type: "object", properties: { prompt: { type: "string" } }, required: ["prompt"] } },
        { name: "nano_banana_pro_generate", description: "Generate creative text content", inputSchema: { type: "object", properties: { prompt: { type: "string" }, temperature: { type: "number" }, max_tokens: { type: "number" } }, required: ["prompt"] } },
        { name: "nano_banana_pro_analyze", description: "Analyze text for sentiment or keywords", inputSchema: { type: "object", properties: { text: { type: "string" }, analysis_type: { type: "string", enum: ["sentiment", "keywords"] } }, required: ["text", "analysis_type"] } }
      ] 
    }));
    
    this.server.setRequestHandler(CallToolRequestSchema, async (req) => {
      if (req.params.name === "list_skills") return { content: [{ type: "text", text: "⚡ OlympIA Skills:\n- Reasoning lógico e preciso\n- Detecção de contexto\n- Sugestões de comandos\n- Análise racional\n- Geração de texto criativo\n- Análise de sentimento\n- Extração de palavras-chave" }] };
      
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
      
      if (req.params.name === "nano_banana_pro_generate") {
        try {
          const { prompt, temperature = 0.8, max_tokens = 500 } = req.params.arguments;
          const completion = await groq.chat.completions.create({
            messages: [
              { role: "system", content: "Você é um assistente criativo especialista em gerar conteúdo de alta qualidade. Gere respostas criativas, úteis e bem estruturadas." },
              { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: temperature,
            max_tokens: max_tokens,
          });
          const text = completion.choices[0]?.message?.content || "Não foi possível gerar o conteúdo.";
          return { content: [{ type: "text", text: `🍌 ${text}` }] };
        } catch (e) {
          return { content: [{ type: "text", text: `❌ Erro na geração: ${e.message}` }] };
        }
      }
      
      if (req.params.name === "nano_banana_pro_analyze") {
        try {
          const { text, analysis_type } = req.params.arguments;
          
          if (analysis_type === "sentiment") {
            const completion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: "Você é um analista de sentimento especialista. Analise o texto fornecido e determine se o sentimento é positivo, negativo ou neutro. Forneça uma explicação breve." },
                { role: "user", content: `Analise o sentimento deste texto: "${text}"` }
              ],
              model: "llama-3.3-70b-versatile",
              temperature: 0.3,
              max_tokens: 200,
            });
            const result = completion.choices[0]?.message?.content || "Análise não disponível.";
            return { content: [{ type: "text", text: `📊 Análise de Sentimento:\n${result}` }] };
          }
          
          if (analysis_type === "keywords") {
            const completion = await groq.chat.completions.create({
              messages: [
                { role: "system", content: "Você é um especialista em extração de palavras-chave. Extraia as 5-10 palavras-chave mais relevantes do texto fornecido. Liste-as separadas por vírgulas." },
                { role: "user", content: `Extraia palavras-chave deste texto: "${text}"` }
              ],
              model: "llama-3.3-70b-versatile",
              temperature: 0.3,
              max_tokens: 100,
            });
            const result = completion.choices[0]?.message?.content || "Palavras-chave não encontradas.";
            return { content: [{ type: "text", text: `🔑 Palavras-chave:\n${result}` }] };
          }
          
          return { content: [{ type: "text", text: "❌ Tipo de análise não suportado." }] };
        } catch (e) {
          return { content: [{ type: "text", text: `❌ Erro na análise: ${e.message}` }] };
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
