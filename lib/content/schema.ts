import { z } from "zod";

import { supportedLocales } from "@/lib/site-config";

const localeSchema = z.enum(supportedLocales);
const dateSchema = z.iso.date();
const tagsSchema = z
  .array(z.string().trim().min(1))
  .min(1)
  .superRefine((tags, context) => {
    if (new Set(tags).size !== tags.length) {
      context.addIssue({
        code: "custom",
        message: "tags must be unique",
      });
    }
  });
const translationKeySchema = z
  .string()
  .trim()
  .regex(/^[\p{Letter}\p{Number}]+(?:-[\p{Letter}\p{Number}]+)*$/u)
  .refine((value) => value === value.toLowerCase(), {
    message: "translationKey must be lowercase",
  });
const notionPageIdSchema = z
  .string()
  .trim()
  .regex(/^(?:[a-f0-9]{32}|[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})$/iu);

export const articleFrontmatterSchema = z
  .strictObject({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).max(240),
    published: dateSchema,
    updated: dateSchema.optional(),
    locale: localeSchema,
    tags: tagsSchema,
    draft: z.boolean().default(false),
    pinned: z.boolean().default(false),
    image: z.string().trim().startsWith("/").optional(),
    translationKey: translationKeySchema.optional(),
    source: z.literal("notion").optional(),
    notionPageId: notionPageIdSchema.optional(),
  })
  .superRefine((article, context) => {
    if (article.updated && article.updated < article.published) {
      context.addIssue({
        code: "custom",
        message: "updated cannot be earlier than published",
        path: ["updated"],
      });
    }

    if ((article.source === "notion") !== Boolean(article.notionPageId)) {
      context.addIssue({
        code: "custom",
        message: "source and notionPageId must be provided together",
        path: [article.source ? "notionPageId" : "source"],
      });
    }
  });

export const bookFrontmatterSchema = z
  .strictObject({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1).max(240),
    author: z.string().trim().min(1).optional(),
    translator: z.string().trim().min(1).optional(),
    published: dateSchema.optional(),
    updated: dateSchema.optional(),
    locale: localeSchema,
    tags: tagsSchema,
    status: z.enum(["serializing", "complete"]),
    order: z.number().int().min(0),
    draft: z.boolean().default(false),
    translationKey: translationKeySchema.optional(),
  })
  .superRefine((book, context) => {
    if (book.updated && book.published && book.updated < book.published) {
      context.addIssue({
        code: "custom",
        message: "updated cannot be earlier than published",
        path: ["updated"],
      });
    }
  });

export const bookChapterFrontmatterSchema = z.strictObject({
  title: z.string().trim().min(1),
  order: z.number().int().min(1),
  draft: z.boolean().default(false),
  translationKey: translationKeySchema.optional(),
});

export type ArticleFrontmatter = z.infer<typeof articleFrontmatterSchema>;
export type BookFrontmatter = z.infer<typeof bookFrontmatterSchema>;
export type BookChapterFrontmatter = z.infer<
  typeof bookChapterFrontmatterSchema
>;
