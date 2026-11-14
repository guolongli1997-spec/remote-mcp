import { createMcpHandler } from "agents/mcp/server";
import { handleChat } from "./chat";
import { createServer } from "./tools";

interface Env {
  AI: Ai;
  ASSETS: Fetcher;
}

const mcpHandler = createMcpHandler(createServer);

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/mcp" || url.pathname.startsWith("/mcp/")) {
      return mcpHandler(request, env, ctx);
    }

    if (url.pathname === "/api/chat") {
      if (request.method !== "POST") {
        return Response.json(
          { error: "Method not allowed" },
          { status: 405, headers: { Allow: "POST" } },
        );
      }
      return handleChat(request, env);
    }

    if (url.pathname === "/api/health") {
      return Response.json({
        ok: true,
        service: "remote-mcp",
        endpoints: { chat: "/api/chat", mcp: "/mcp" },
        timestamp: new Date().toISOString(),
      });
    }

    return env.ASSETS.fetch(request);
  },
} satisfies ExportedHandler<Env>;
