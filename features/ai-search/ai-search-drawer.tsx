"use client";

import { Button } from "@heroui/react/button";
import { Drawer } from "@heroui/react/drawer";
import { Spinner } from "@heroui/react/spinner";
import { TextArea } from "@heroui/react/textarea";
import { Tooltip } from "@heroui/react/tooltip";
import {
  BookOpenText,
  Bot,
  RotateCcw,
  Send,
  Square,
  UserRound,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { FormEvent, KeyboardEvent } from "react";

import {
  AiSearchClientError,
  streamAiSearch,
} from "@/features/ai-search/ai-search-client";
import { aiSearchContent } from "@/features/ai-search/ai-search-content";
import { SiteLink } from "@/components/ui/site-link";
import type { AiSearchCitation } from "@/lib/ai-search/types";
import type { SiteLocale } from "@/lib/site-config";

interface AiSearchMessage {
  readonly citations: readonly AiSearchCitation[];
  readonly content: string;
  readonly id: string;
  readonly role: "assistant" | "user";
  readonly stopped?: boolean;
}

interface AiSearchDrawerProps {
  readonly endpoint: string;
  readonly isOpen: boolean;
  readonly locale: SiteLocale;
  readonly maxQueryLength: number;
  readonly onOpenChange: (isOpen: boolean) => void;
}

function createMessageId(): string {
  return crypto.randomUUID();
}

export function AiSearchDrawer({
  endpoint,
  isOpen,
  locale,
  maxQueryLength,
  onOpenChange,
}: AiSearchDrawerProps) {
  const copy = aiSearchContent[locale];
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<readonly AiSearchMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<AiSearchClientError | null>(null);
  const [lastQuery, setLastQuery] = useState("");
  const [failedMessageId, setFailedMessageId] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) abortControllerRef.current?.abort();
  }, [isOpen]);

  useEffect(
    () => () => {
      abortControllerRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    const element = messagesRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [messages, isLoading, error]);

  async function submitQuery(query: string, appendUserMessage: boolean) {
    if (isLoading) return;

    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;

    const assistantMessageId = createMessageId();
    const userMessage: AiSearchMessage = {
      citations: [],
      content: trimmedQuery,
      id: createMessageId(),
      role: "user",
    };
    const assistantMessage: AiSearchMessage = {
      citations: [],
      content: "",
      id: assistantMessageId,
      role: "assistant",
    };

    setMessages((current) => [
      ...current.filter(({ id }) => id !== failedMessageId),
      ...(appendUserMessage ? [userMessage] : []),
      assistantMessage,
    ]);
    setInput("");
    setError(null);
    setFailedMessageId(null);
    setIsLoading(true);
    setLastQuery(trimmedQuery);

    const abortController = new AbortController();
    abortControllerRef.current = abortController;
    let receivedText = "";

    try {
      await streamAiSearch({
        endpoint,
        onEvent: (event) => {
          if (event.event === "delta") {
            receivedText += event.data.text;
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, content: receivedText }
                  : message,
              ),
            );
          }
          if (event.event === "citations") {
            setMessages((current) =>
              current.map((message) =>
                message.id === assistantMessageId
                  ? { ...message, citations: event.data.citations }
                  : message,
              ),
            );
          }
        },
        query: trimmedQuery,
        signal: abortController.signal,
      });
    } catch (caughtError: unknown) {
      if (abortController.signal.aborted) {
        setMessages((current) =>
          current
            .map((message) =>
              message.id === assistantMessageId && message.content
                ? { ...message, stopped: true }
                : message,
            )
            .filter(
              (message) =>
                message.id !== assistantMessageId || Boolean(message.content),
            ),
        );
        return;
      }

      const clientError =
        caughtError instanceof AiSearchClientError
          ? caughtError
          : new AiSearchClientError("SERVICE_UNAVAILABLE", true);
      setError(clientError);
      setFailedMessageId(assistantMessageId);
      setMessages((current) =>
        current.filter(({ id }) => id !== assistantMessageId),
      );
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
      setIsLoading(false);
    }
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submitQuery(input, true);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (input.trim()) void submitQuery(input, true);
    }
  }

  function handleStop() {
    abortControllerRef.current?.abort();
  }

  return (
    <Drawer.Root isOpen={isOpen} onOpenChange={onOpenChange}>
      <Drawer.Backdrop className="ai-search-backdrop">
        <Drawer.Content className="ai-search-content" placement="right">
          <Drawer.Dialog className="ai-search-dialog">
            <Drawer.Header className="ai-search-header">
              <div>
                <Bot aria-hidden="true" />
                <Drawer.Heading>{copy.title}</Drawer.Heading>
              </div>
              <Drawer.CloseTrigger aria-label={copy.close} />
            </Drawer.Header>

            <Drawer.Body className="ai-search-body" ref={messagesRef}>
              {messages.length === 0 ? (
                <div className="ai-search-welcome">
                  <Bot aria-hidden="true" />
                  <p>{copy.welcome}</p>
                </div>
              ) : null}

              {messages.map((message) => (
                <article
                  className={`ai-search-message is-${message.role}`}
                  key={message.id}
                >
                  <div className="ai-search-message-label">
                    {message.role === "assistant" ? (
                      <Bot aria-hidden="true" />
                    ) : (
                      <UserRound aria-hidden="true" />
                    )}
                    <span>
                      {message.role === "assistant"
                        ? copy.assistantLabel
                        : copy.userLabel}
                    </span>
                  </div>
                  <div className="ai-search-message-text">
                    {message.content || (
                      <Spinner aria-label={copy.assistantLabel} size="sm" />
                    )}
                  </div>
                  {message.stopped ? (
                    <p className="ai-search-stopped">{copy.stopped}</p>
                  ) : null}
                  {message.citations.length > 0 ? (
                    <div className="ai-search-citations">
                      <strong>
                        <BookOpenText aria-hidden="true" />
                        {copy.sources}
                      </strong>
                      <ul>
                        {message.citations.map((citation) => (
                          <li key={citation.href}>
                            <SiteLink
                              href={citation.href}
                              onClick={() => onOpenChange(false)}
                            >
                              <span>{citation.title}</span>
                              {citation.score === null ? null : (
                                <small>
                                  {Math.round(citation.score * 100)}%
                                </small>
                              )}
                            </SiteLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </article>
              ))}
            </Drawer.Body>

            <Drawer.Footer className="ai-search-footer">
              {error ? (
                <div className="ai-search-error" role="alert">
                  <span>{copy.errors[error.code]}</span>
                  {error.retryable ? (
                    <Button
                      onPress={() => void submitQuery(lastQuery, false)}
                      size="sm"
                      variant="ghost"
                    >
                      <RotateCcw aria-hidden="true" />
                      {copy.retry}
                    </Button>
                  ) : null}
                </div>
              ) : null}

              <form className="ai-search-form" onSubmit={handleSubmit}>
                <TextArea
                  aria-label={copy.inputLabel}
                  disabled={isLoading}
                  maxLength={maxQueryLength}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={copy.placeholder}
                  rows={3}
                  value={input}
                />
                <Tooltip.Root delay={350}>
                  <Button
                    aria-label={isLoading ? copy.stop : copy.send}
                    className="ai-search-submit"
                    isDisabled={!isLoading && !input.trim()}
                    isIconOnly
                    onPress={isLoading ? handleStop : undefined}
                    type={isLoading ? "button" : "submit"}
                  >
                    {isLoading ? (
                      <Square aria-hidden="true" />
                    ) : (
                      <Send aria-hidden="true" />
                    )}
                  </Button>
                  <Tooltip.Content placement="top">
                    {isLoading ? copy.stop : copy.send}
                  </Tooltip.Content>
                </Tooltip.Root>
              </form>
            </Drawer.Footer>
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer.Root>
  );
}
