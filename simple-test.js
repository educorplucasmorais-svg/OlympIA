// Teste simples da funcionalidade do Moltbot
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

async function main() {
  console.log('🚀 Iniciando Moltbot CLI...\n');
  
  const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"],
  });

  const client = new Client(
    {
      name: "cli-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log('✅ Conectado ao Moltbot!\n');
  console.log('Digite seus comandos:\n');
  console.log('  gerar <texto>    - Gerar texto com IA');
  console.log('  analisar <texto> - Analisar sentimento');
  console.log('  keywords <texto> - Extrair palavras-chave');
  console.log('  skills           - Listar todas as skills');
  console.log('  sair             - Encerrar\n');

  const askCommand = () => {
    rl.question('> ', async (input) => {
      const cmd = input.trim();
      
      if (cmd === 'sair' || cmd === 'exit') {
        await client.close();
        rl.close();
        process.exit(0);
        return;
      }

      try {
        if (cmd === 'skills') {
          const result = await client.callTool({
            name: "list_skills",
            arguments: {},
          });
          console.log('\n' + result.content[0].text + '\n');
        }
        else if (cmd.startsWith('gerar ')) {
          const prompt = cmd.substring(6);
          const result = await client.callTool({
            name: "nano_banana_pro_generate",
            arguments: { prompt, temperature: 0.8, max_tokens: 500 },
          });
          console.log('\n' + result.content[0].text + '\n');
        }
        else if (cmd.startsWith('analisar ')) {
          const text = cmd.substring(9);
          const result = await client.callTool({
            name: "nano_banana_pro_analyze",
            arguments: { text, analysis_type: "sentiment" },
          });
          console.log('\n' + result.content[0].text + '\n');
        }
        else if (cmd.startsWith('keywords ')) {
          const text = cmd.substring(9);
          const result = await client.callTool({
            name: "nano_banana_pro_analyze",
            arguments: { text, analysis_type: "keywords" },
          });
          console.log('\n' + result.content[0].text + '\n');
        }
        else if (cmd) {
          console.log('\n❌ Comando não reconhecido. Digite "skills" para ver comandos.\n');
        }
      } catch (error) {
        console.error('\n❌ Erro:', error.message, '\n');
      }

      askCommand();
    });
  };

  askCommand();
}

main().catch(console.error);
