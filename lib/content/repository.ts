import "server-only";

import { cache } from "react";

import { loadArticles, loadBooks } from "@/lib/content/reader";

export const getAllArticles = cache(async () => loadArticles());
export const getAllBooks = cache(async () => loadBooks());
