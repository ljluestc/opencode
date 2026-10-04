import { describe, expect, test } from "bun:test"
import { createBodyConverter, createStreamPartConverter } from "../src/routes/zen/util/provider/provider"

describe("anthropic request to oa-compat provider", () => {
  test("keeps system prompt and tool definitions", () => {
    const body = createBodyConverter(
      "anthropic",
      "oa-compat",
    )({
      model: "glm-5.3",
      max_tokens: 100,
      stream: true,
      system: "be brief",
      messages: [{ role: "user", content: [{ type: "text", text: "hi" }] }],
      tools: [{ name: "read", description: "Read a file", input_schema: { type: "object" } }],
    })

    expect(body.messages).toEqual([
      { role: "system", content: "be brief" },
      { role: "user", content: "hi" },
    ])
    expect(body.tools).toEqual([
      {
        type: "function",
        function: { name: "read", description: "Read a file", parameters: { type: "object" } },
      },
    ])
  })

  test("converts streamed oa-compat chunks back to anthropic events", () => {
    const part = createStreamPartConverter(
      "oa-compat",
      "anthropic",
    )(
      `data: ${JSON.stringify({
        id: "1",
        object: "chat.completion.chunk",
        created: 0,
        model: "glm-5.3",
        choices: [{ index: 0, delta: { content: "hello" }, finish_reason: null }],
      })}`,
    )

    expect(part).toContain("content_block_delta")
    expect(part).toContain("hello")
  })
})
