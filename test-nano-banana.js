import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testNanoBananaPro() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"],
  });

  const client = new Client(
    {
      name: "nano-test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✓ Conectado ao Moltbot\n");

  // Teste 1: Geração de texto
  console.log("=== Teste 1: Geração de Texto ===");
  const generateResult = await client.callTool({
    name: "nano_banana_pro_generate",
    arguments: {
      prompt: "Explique o que é inteligência artificial em 3 parágrafos",
      temperature: 0.8,
      max_tokens: 300,
    },
  });
  console.log(generateResult.content[0].text);

  // Teste 2: Análise de sentimento
  console.log("\n=== Teste 2: Análise de Sentimento ===");
  const sentimentResult = await client.callTool({
    name: "nano_banana_pro_analyze",
    arguments: {
      text: "Estou muito feliz com os resultados do projeto! A equipe trabalhou incrivelmente bem e superou todas as expectativas.",
      analysis_type: "sentiment",
    },
  });
  console.log(sentimentResult.content[0].text);

  // Teste 3: Extração de keywords
  console.log("\n=== Teste 3: Análise de Keywords ===");
  const keywordsResult = await client.callTool({
    name: "nano_banana_pro_analyze",
    arguments: {
      text: "A inteligência artificial está revolucionando o mercado de tecnologia com inovações em machine learning e processamento de linguagem natural.",
      analysis_type: "keywords",
    },
  });
  console.log(keywordsResult.content[0].text);

  await client.close();
  console.log("\n✓ Testes do Nano Banana Pro concluídos!");
  process.exit(0);
}

testNanoBananaPro().catch((error) => {
  console.error("Erro:", error);
  process.exit(1);
});
