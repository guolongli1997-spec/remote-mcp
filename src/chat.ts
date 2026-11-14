type ChatMessage = { role: "user" | "assistant"; content: string };

interface ChatEnv {
  AI: Ai;
}

const MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

export async function handleChat(request: Request, env: ChatEnv): Promise<Response> {
  try {
    const body = (await request.json()) as { message?: unknown; history?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";

    if (!message) {
      return Response.json({ error: "Please enter a message." }, { status: 400 });
    }
    if (message.length > 8000) {
      return Response.json(
        { error: "Message is too long. Maximum 8,000 characters." },
        { status: 413 },
      );
    }

    const history: ChatMessage[] = Array.isArray(body.history)
      ? body.history
          .filter((item): item is ChatMessage =>
            !!item &&
            typeof item === "object" &&
            ((item as ChatMessage).role === "user" || (item as ChatMessage).role === "assistant") &&
            typeof (item as ChatMessage).content === "string",
          )
          .slice(-12)
          .map((item) => ({ role: item.role, content: item.content.slice(0, 4000) }))
      : [];

    const messages = [
      {
        role: "system" as const,
        content:
          "You are a helpful, clear, friendly AI assistant. Answer in the same language as the user. Be accurate and concise. You are running on a Cloudflare Worker. Do not claim to have used external tools unless they were actually called.",
      },
      ...history,
      { role: "user" as const, content: message },
    ];

    const result = (await env.AI.run(MODEL, { messages })) as { response?: string };
    const reply = typeof result?.response === "string" ? result.response : "";

    if (!reply) {
      return Response.json(
        { error: "The AI model returned an empty response. Please try again." },
        { status: 502 },
      );
    }

    return Response.json({ reply, model: MODEL });
  } catch (error) {
    console.error("Chat API error:", error);
    return Response.json(
      { error: "The AI request failed. Check the Workers AI binding and try again." },
      { status: 500 },
    );
  }
}
