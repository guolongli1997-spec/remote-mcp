import { McpServer } from "@modelcontextprotocol/server";
import { z } from "zod";

export function createServer() {
  const server = new McpServer({
    name: "Remote MCP Assistant",
    version: "1.0.0",
  });

  server.registerTool(
    "add",
    {
      description: "Add two numbers",
      inputSchema: z.object({ a: z.number(), b: z.number() }),
    },
    async ({ a, b }) => ({
      content: [{ type: "text", text: String(a + b) }],
    }),
  );

  server.registerTool(
    "calculate",
    {
      description: "Calculate using addition, subtraction, multiplication, or division",
      inputSchema: z.object({
        operation: z.enum(["add", "subtract", "multiply", "divide"]),
        a: z.number(),
        b: z.number(),
      }),
    },
    async ({ operation, a, b }) => {
      if (operation === "divide" && b === 0) {
        return { content: [{ type: "text", text: "Error: Cannot divide by zero" }] };
      }
      const result =
        operation === "add" ? a + b :
        operation === "subtract" ? a - b :
        operation === "multiply" ? a * b : a / b;
      return { content: [{ type: "text", text: String(result) }] };
    },
  );

  server.registerTool(
    "server_status",
    {
      description: "Return basic information about this MCP server",
      inputSchema: z.object({}),
    },
    async () => ({
      content: [{ type: "text", text: "Remote MCP Assistant is running. Tools: add, calculate, server_status." }],
    }),
  );

  return server;
}
