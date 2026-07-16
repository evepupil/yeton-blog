"use client";

import Image from "next/image";
import { useState } from "react";

interface FriendAvatarProps {
  readonly alt: string;
  readonly name: string;
  readonly src?: string;
}

function getInitial(name: string): string {
  return Array.from(name.trim())[0]?.toUpperCase() ?? "?";
}

export function FriendAvatar({ alt, name, src }: FriendAvatarProps) {
  const [hasFailed, setHasFailed] = useState(false);

  if (!src || hasFailed) {
    return (
      <span aria-label={alt} className="friend-avatar-fallback" role="img">
        {getInitial(name)}
      </span>
    );
  }

  return (
    <Image
      alt={alt}
      className="friend-avatar-image"
      height={56}
      onError={() => setHasFailed(true)}
      src={src}
      width={56}
    />
  );
}
