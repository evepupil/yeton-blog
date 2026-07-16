"use client";

import { Modal } from "@heroui/react/modal";
import { Heart, QrCode } from "lucide-react";
import Image from "next/image";

import type { ResolvedSponsorship } from "@/lib/monetization/config";

interface SponsorshipSectionProps {
  readonly sponsorship: ResolvedSponsorship | null;
}

export function SponsorshipSection({ sponsorship }: SponsorshipSectionProps) {
  if (!sponsorship) {
    return null;
  }

  return (
    <section
      aria-labelledby="article-sponsorship-title"
      className="article-sponsorship"
      data-available={sponsorship.available}
      data-testid="article-sponsorship"
    >
      <div className="article-sponsorship-copy">
        <Heart aria-hidden="true" />
        <div>
          <h2 id="article-sponsorship-title">{sponsorship.title}</h2>
          <p>{sponsorship.description}</p>
        </div>
      </div>

      <Modal.Root>
        <Modal.Trigger className="sponsorship-trigger">
          <QrCode aria-hidden="true" />
          {sponsorship.trigger}
        </Modal.Trigger>
        <Modal.Backdrop className="sponsorship-modal-backdrop">
          <Modal.Container
            className="sponsorship-modal-container"
            placement="center"
            size="sm"
          >
            <Modal.Dialog className="sponsorship-modal-dialog">
              <Modal.Header className="sponsorship-modal-header">
                <Modal.Heading>{sponsorship.modalTitle}</Modal.Heading>
                <Modal.CloseTrigger aria-label={sponsorship.close} />
              </Modal.Header>
              <Modal.Body className="sponsorship-modal-body">
                {sponsorship.qrCode ? (
                  <div className="sponsorship-qr-code">
                    <Image
                      alt={sponsorship.qrCode.alt}
                      height={320}
                      sizes="(max-width: 480px) calc(100vw - 96px), 320px"
                      src={sponsorship.qrCode.src}
                      width={320}
                    />
                  </div>
                ) : (
                  <div className="sponsorship-unavailable" role="status">
                    <QrCode aria-hidden="true" />
                    <p>{sponsorship.unavailable}</p>
                  </div>
                )}
              </Modal.Body>
            </Modal.Dialog>
          </Modal.Container>
        </Modal.Backdrop>
      </Modal.Root>
    </section>
  );
}
