import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function testMoltbot() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["index.js"],
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("✓ Conectado ao Moltbot MCP Server\n");

  // Listar skills disponíveis
  const tools = await client.listTools();
  console.log("=== Ferramentas Disponíveis ===");
  tools.tools.forEach((tool, i) => {
    console.log(`${i + 1}. ${tool.name}: ${tool.description}`);
  });

  // Listar todas as skills
  console.log("\n=== Listando Skills ===");
  const result = await client.callTool({
    name: "list_skills",
    arguments: {},
  });
  console.log(result.content[0].text);

  // Testar instalação de uma skill
  console.log("\n=== Testando Instalação ===");
  const installResult = await client.callTool({
    name: "install_skill",
    arguments: { skill_name: "gemini" },
  });
  console.log(installResult.content[0].text);

  await client.close();
  console.log("\n✓ Teste concluído!");
  process.exit(0);
}

testMoltbot().catch((error) => {
  console.error("Erro:", error);
  process.exit(1);
});
