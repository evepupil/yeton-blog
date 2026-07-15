---
title: "Streaming AI Content and Real-Time Markdown Rendering on the Web"
description: "In the AI era, users expect instant responses. The old “wait until done” experience is no longer enough. This post shares how to implement streaming AI output and real-time Markdown rendering on the web."
published: "2025-11-17"
locale: "en"
tags: ["Frontend"]
draft: false
pinned: false
image: "/images/posts/web-端实现-ai-内容流式传输与实时-markdown-渲染/cover.jpg"
translationKey: "web-端实现-ai-内容流式传输与实时-markdown-渲染"
---

## Streaming AI Content and Real-Time Markdown Rendering on the Web

In the AI era, response speed expectations keep rising. Traditional “wait for full response” UX no longer works well. I recently implemented this in a project and hit many pitfalls, so here is a practical guide.

## What is streaming?

Streaming means the server continuously pushes data to the client, and the client processes and renders it in real time without waiting for the full payload. Compared with classic request-response, streaming lets users **see generation immediately**.

## Core tech stack

### 1. Server-Sent Events (SSE)

A lightweight protocol for one-way server-to-client push:

```plain text
const response = await fetch('/api/chat-stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ question: 'hello' })
});
```

### 2. ReadableStream API

Native browser API for streaming reads:

```plain text
const reader = response.body?.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  const chunk = decoder.decode(value, { stream: true });
  processChunk(chunk);
}
```

## Implementation steps

### Step 1: Backend streaming API

Backend returns SSE format (`data:` per line, ended by `\n\n`):

```plain text
// Node.js backend example
app.post('/api/generate-content-stream', async (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });

  // Simulate streamed token generation
  const content = await generateContent(req.body);

  for (const token of content) {
    const data = JSON.stringify({ content: token });
    res.write(`data: ${data}\n\n`);
  }

  res.write('data: [DONE]\n\n');
  res.end();
});
```

### Step 2: Frontend stream consumption

```plain text
async function streamGenerateContent(
  params: GenerateParams,
  onChunk: (content: string) => void
) {
  const response = await fetch('/api/generate-content-stream', {
    method: 'POST',
    body: JSON.stringify(params)
  });

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader!.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data && data !== '[DONE]') {
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              // Accumulate content (append, do not replace)
              onChunk(parsed.content);
            }
          } catch (e) {
            console.error('JSON parse failed:', e);
          }
        }
      }
    }
  }
}
```

### Step 3: Real-time Markdown rendering

Use **Streamdown** for incremental Markdown rendering:

```plain text
npm install streamdown
import { Streamdown } from 'streamdown';

function ContentReader({ content, isLoading }) {
  return (
    <div className="markdown-content">
      {isLoading ? (
        <div>Generating...</div>
      ) : (
        <Streamdown>{content}</Streamdown>
      )}
    </div>
  );
}
```

**Why Streamdown?**

- ✅ Handles incomplete Markdown fragments
- ✅ Supports incremental rendering
- ✅ Gracefully handles unclosed syntax

### Step 4: State management and incremental updates

```plain text
function ChatPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);

  const sendMessage = async (question: string) => {
    // Create user message
    const userMsg: Message = { id: Date.now(), type: 'user', content: question };
    setMessages(prev => [...prev, userMsg]);

    // Create AI placeholder message
    const aiMsgId = `ai-${Date.now()}`;
    const aiMsg: Message = { id: aiMsgId, type: 'ai', content: '' };
    setMessages(prev => [...prev, aiMsg]);
    setIsStreaming(true);

    // Stream AI response
    await streamChat(
      { question, history: messages },
      (chunk: string) => {
        // Incrementally append AI message content (critical)
        setMessages(prev => prev.map(msg =>
          msg.id === aiMsgId
            ? { ...msg, content: msg.content + chunk }
            : msg
        ));
      },
      () => setIsStreaming(false)
    );
  };

  return (
    <div className="chat-container">
      {messages.map(msg => (
        <div key={msg.id} className={msg.type}>
          <Streamdown>{msg.content}</Streamdown>
        </div>
      ))}
    </div>
  );
}
```

## Key implementation points

### 1. **Accumulate, don’t replace**

```plain text
// ❌ Wrong: replacing content causes flicker
setContent(newContent);

// ✅ Correct: append chunks incrementally
setContent(prev => prev + newChunk);
```

### 2. **Buffer management**

```plain text
let buffer = '';
buffer += chunk;
const lines = buffer.split('\n');
buffer = lines.pop() || ''; // keep incomplete trailing line
```

### 3. **First-chunk-first UX**

```plain text
let isFirstChunk = true;
onChunk((chunk) => {
  if (isFirstChunk) {
    setLoading(false); // hide loading immediately on first chunk
    isFirstChunk = false;
  }
  setContent(prev => prev + chunk);
});
```

## Best practices

1. **Error handling**: every stream flow should expose `onError`
2. **Connection management**: SSE handles reconnection semantics well
3. **Performance**: use `useCallback` to reduce unnecessary rerenders
4. **UX details**:

- Show “Generating...” feedback
- Hide loading right after first chunk arrives
- Provide a cancel option

## Full example

Reference implementation in LearnOS:

- **Streaming API**: `src/lib/api/courseService.ts` (line 539)
- **Realtime rendering**: `src/components/learning/organisms/MainContentReader.tsx` (line 111)

## Pitfalls I hit

1. `react-markdown` is hard to make smooth in true streaming rendering scenarios.
2. **When backend streams message chunks, make sure you encode correctly**, or frontend decoding may produce mismatched content.

## Summary

The core of streaming + real-time Markdown rendering:

1. Keep pushing data with SSE
2. Read stream chunks through ReadableStream
3. Render Markdown incrementally with Streamdown
4. Use append-based state updates to avoid flicker

With this architecture, you can deliver a smooth “results appear as the model thinks” experience.

---
