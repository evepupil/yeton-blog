"use client";

import { Button } from "@heroui/react/button";
import { Modal } from "@heroui/react/modal";
import { Spinner } from "@heroui/react/spinner";
import { CheckCircle2, Link2, Send } from "lucide-react";
import { useState } from "react";
import type { ChangeEvent, FormEvent } from "react";

import {
  FriendLinkClientError,
  submitFriendLink,
} from "@/features/friends/friend-link-client";
import { friendLinkApplicationContent } from "@/features/friends/friend-link-application-content";
import type {
  FriendLinkApplication,
  FriendLinkApplicationFailureCode,
} from "@/lib/friends/application";
import type { SiteLocale } from "@/lib/site-config";

type ApplicationStatus = "idle" | "submitting" | "success" | "error";

const initialForm: FriendLinkApplication = {
  avatar: "",
  description: "",
  honeypot: "",
  name: "",
  url: "",
};

interface FriendLinkApplicationProps {
  readonly locale: SiteLocale;
}

export function FriendLinkApplication({ locale }: FriendLinkApplicationProps) {
  const copy = friendLinkApplicationContent[locale];
  const [form, setForm] = useState(initialForm);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<ApplicationStatus>("idle");
  const [errorCode, setErrorCode] =
    useState<FriendLinkApplicationFailureCode | null>(null);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);
    if (!open) {
      setForm(initialForm);
      setStatus("idle");
      setErrorCode(null);
    }
  }

  function handleChange(
    field: keyof FriendLinkApplication,
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    setForm((current) => ({ ...current, [field]: event.target.value }));
    if (status === "error") {
      setStatus("idle");
      setErrorCode(null);
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    setStatus("submitting");
    setErrorCode(null);
    try {
      await submitFriendLink(form);
      setForm(initialForm);
      setStatus("success");
    } catch (error: unknown) {
      const code =
        error instanceof FriendLinkClientError
          ? error.code
          : "SERVICE_UNAVAILABLE";
      setErrorCode(code);
      setStatus("error");
    }
  }

  return (
    <div className="friend-link-application">
      <div className="friend-link-application-copy">
        <span className="section-index">LINK / 01</span>
        <h2>{copy.applyTitle}</h2>
        <p>{copy.applyDescription}</p>
      </div>

      <Modal.Root isOpen={isOpen} onOpenChange={handleOpenChange}>
        <Button
          aria-haspopup="dialog"
          className="friend-link-application-trigger"
          onPress={() => setIsOpen(true)}
        >
          <Link2 aria-hidden="true" />
          {copy.applyAction}
        </Button>
        <Modal.Backdrop className="friend-link-modal-backdrop">
          <Modal.Container className="friend-link-modal-container" size="md">
            <Modal.Dialog className="friend-link-modal-dialog">
              <Modal.Header className="friend-link-modal-header">
                <div>
                  <Modal.Heading>{copy.title}</Modal.Heading>
                </div>
                <Modal.CloseTrigger aria-label={copy.close} />
              </Modal.Header>
              <Modal.Body className="friend-link-modal-body">
                <p className="friend-link-modal-description">
                  {copy.applyDescription}
                </p>
                <form
                  aria-busy={status === "submitting"}
                  className="friend-link-form"
                  onSubmit={handleSubmit}
                >
                  <label htmlFor="friend-link-name">{copy.name}</label>
                  <input
                    autoComplete="organization"
                    disabled={status === "submitting"}
                    id="friend-link-name"
                    maxLength={80}
                    onChange={(event) => handleChange("name", event)}
                    placeholder={copy.namePlaceholder}
                    required
                    value={form.name}
                  />

                  <label htmlFor="friend-link-url">{copy.url}</label>
                  <input
                    autoComplete="url"
                    disabled={status === "submitting"}
                    id="friend-link-url"
                    onChange={(event) => handleChange("url", event)}
                    placeholder={copy.urlPlaceholder}
                    required
                    type="url"
                    value={form.url}
                  />

                  <label htmlFor="friend-link-description">
                    {copy.description}
                  </label>
                  <textarea
                    disabled={status === "submitting"}
                    id="friend-link-description"
                    maxLength={240}
                    onChange={(event) => handleChange("description", event)}
                    placeholder={copy.descriptionPlaceholder}
                    required
                    rows={3}
                    value={form.description}
                  />

                  <label htmlFor="friend-link-avatar">
                    {copy.avatar} <span>({copy.optional})</span>
                  </label>
                  <input
                    autoComplete="photo"
                    disabled={status === "submitting"}
                    id="friend-link-avatar"
                    onChange={(event) => handleChange("avatar", event)}
                    placeholder={copy.avatarPlaceholder}
                    type="url"
                    value={form.avatar}
                  />

                  <input
                    aria-hidden="true"
                    autoComplete="off"
                    className="friend-link-honeypot"
                    name="website"
                    onChange={(event) => handleChange("honeypot", event)}
                    tabIndex={-1}
                    value={form.honeypot}
                  />

                  {status === "success" ? (
                    <p aria-live="polite" className="friend-link-form-success">
                      <CheckCircle2 aria-hidden="true" />
                      {copy.submitted}
                    </p>
                  ) : null}
                  {status === "error" && errorCode ? (
                    <p
                      aria-live="polite"
                      className="friend-link-form-error"
                      role="alert"
                    >
                      {copy.errors[errorCode]}
                    </p>
                  ) : null}

                  <div className="friend-link-form-actions">
                    <Button
                      isDisabled={status === "submitting"}
                      type="button"
                      variant="ghost"
                      onPress={() => setIsOpen(false)}
                    >
                      {copy.cancel}
                    </Button>
                    <Button
                      className="friend-link-submit"
                      isDisabled={status === "submitting"}
                      type="submit"
                    >
                      {status === "submitting" ? (
                        <Spinner aria-label={copy.submitting} size="sm" />
                      ) : (
                        <Send aria-hidden="true" />
                      )}
                      {status === "submitting" ? copy.submitting : copy.submit}
                    </Button>
                  </div>
                </form>
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </div>
  );
}
