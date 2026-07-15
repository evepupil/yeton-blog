"use client";

import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { SearchField } from "@heroui/react/search-field";
import { Spinner } from "@heroui/react/spinner";
import { Search } from "lucide-react";
import { useMemo, useState } from "react";

import { SiteLink } from "@/components/ui/site-link";
import { searchContent } from "@/features/search/search-content";
import {
  loadSearchIndex,
  searchLoadedIndex,
  type LoadedSearchIndex,
} from "@/lib/search/client";
import type { SiteLocale } from "@/lib/site-config";

interface SearchDialogProps {
  readonly label: string;
  readonly locale: SiteLocale;
}

type SearchStatus = "idle" | "loading" | "ready" | "error";

export function SearchDialog({ label, locale }: SearchDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [loadedIndex, setLoadedIndex] = useState<LoadedSearchIndex | null>(
    null,
  );
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<SearchStatus>("idle");
  const content = searchContent[locale];
  const activeIndex = loadedIndex?.locale === locale ? loadedIndex : null;
  const results = useMemo(
    () => (activeIndex ? searchLoadedIndex(activeIndex, query) : []),
    [activeIndex, query],
  );

  async function prepareSearch() {
    if (activeIndex) {
      setStatus("ready");
      return;
    }

    setStatus("loading");
    try {
      const nextIndex = await loadSearchIndex(locale);
      setLoadedIndex(nextIndex);
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (open) {
      void prepareSearch();
    }
  }

  return (
    <Modal.Root isOpen={isOpen} onOpenChange={handleOpenChange}>
      <Modal.Trigger aria-label={label} className="header-icon-button">
        <Search aria-hidden="true" />
      </Modal.Trigger>
      <Modal.Backdrop className="search-modal-backdrop">
        <Modal.Container
          className="search-modal-container"
          placement="top"
          size="lg"
        >
          <Modal.Dialog className="search-modal-dialog">
            <Modal.Header className="search-modal-header">
              <Modal.Heading>{content.title}</Modal.Heading>
              <Modal.CloseTrigger aria-label={content.close} />
            </Modal.Header>
            <Modal.Body className="search-modal-body">
              <SearchField.Root
                aria-label={label}
                autoFocus
                fullWidth
                onChange={setQuery}
                value={query}
              >
                <SearchField.Group className="search-field-group">
                  <SearchField.SearchIcon />
                  <SearchField.Input placeholder={content.placeholder} />
                  <SearchField.ClearButton aria-label={content.clear} />
                </SearchField.Group>
              </SearchField.Root>

              {status === "loading" || status === "idle" ? (
                <div className="search-status">
                  <Spinner aria-label={content.loading} size="sm" />
                </div>
              ) : null}

              {status === "error" ? (
                <div className="search-status" role="status">
                  <p>{content.error}</p>
                  <Button onPress={() => void prepareSearch()} size="sm">
                    {content.retry}
                  </Button>
                </div>
              ) : null}

              {status === "ready" ? (
                <div className="search-results">
                  <div className="search-results-heading">
                    <span>
                      {query.trim()
                        ? content.results(results.length)
                        : content.recent}
                    </span>
                  </div>
                  {results.length > 0 ? (
                    <ul aria-label={content.title}>
                      {results.map((result) => (
                        <li key={result.href}>
                          <SiteLink
                            href={result.href}
                            onClick={() => setIsOpen(false)}
                          >
                            <div>
                              <h3>{result.title}</h3>
                              <p>{result.description}</p>
                            </div>
                            <span>{result.tags.slice(0, 2).join(" / ")}</span>
                          </SiteLink>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="search-empty" role="status">
                      {content.noResults}
                    </p>
                  )}
                </div>
              ) : null}
            </Modal.Body>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal.Root>
  );
}
