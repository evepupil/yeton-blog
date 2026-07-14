import type { Metadata } from "next";

import { HomePage } from "@/features/home/home-page";

export const metadata: Metadata = {
  title: "Home",
  description:
    "Frontend, AI and independent building, with room for slower observations.",
};

export default function EnglishHomePage() {
  return <HomePage locale="en" />;
}
