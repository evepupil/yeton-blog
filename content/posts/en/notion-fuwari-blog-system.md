---
title: "An Open-Source Blog System I Use: notion-fuwari"
description: "An open-source blog project I use myself, customized from the original Fuwari project."
published: "2026-03-17"
locale: "en"
tags:
  - "Open Source"
draft: false
pinned: false
translationKey: "notion-fuwari-blog-system"
---

I open-sourced a blog project that I use myself. It is a heavily customized version of the open-source Fuwari project.

Project repository: [https://github.com/evepupil/notion-fuwari](https://github.com/evepupil/notion-fuwari)

Blog: [Chaosyn - Technical Exploration and Evolving Ideas](https://blog.chaosyn.com/)

### **The Goal: What Problems Does This Blog Solve?**

I wanted it to address a few long-term problems rather than simply answer the question, "Can I publish an article?":

- The writing and publishing workflow is too fragmented.
- Image management becomes difficult to control.
- Adding English content to a Chinese site can create routing and SEO problems.
- Search and archive experiences get worse as the content library grows.

That is why this project was designed from the beginning as a maintainable blog foundation, rather than just a theme skin.

### **Feature Overview**

The current version can be divided into six areas:

1. Content production: Notion sync plus a Markdown content system
2. Asset management: automatic image downloads, local copies, and per-article organization
3. Reading and navigation: search, archives, tags, books, and mobile support
4. Bilingual support: separate Chinese and English routes, linked translations, and language-specific lists
5. SEO: canonical URLs, hreflang, structured data, RSS, and sitemap
6. Operations: analytics, comments, friend-link submissions and review, and optional AI Q&A

Here is the same system broken down by workflow.

### **1) Content Production: Notion as the Main Workspace**

The central idea is simple: write in Notion, publish to the blog.

- A script syncs published content to `src/content/posts`.
- Frontmatter automatically carries metadata such as publication dates, tags, and descriptions.
- The workflow can either replace existing content or sync only new pages.

The benefits are straightforward:

- A consistent writing environment makes collaboration easier.
- A scriptable publishing process reduces manual mistakes.
- Content remains plain Markdown in the repository, so it can be audited and rolled back.
- With the automated workflow in place, publishing an article only requires writing it in Notion.

### **2) Image Assets: Automatic Downloads and Local References**

This is easy to overlook in a blog project, but it matters a lot in practice.

The current implementation automatically downloads article images and stores them locally by article. This avoids broken historical posts when an external image host becomes unavailable. Links in the synchronized body are also rewritten to local paths.

For long-term writing, this is valuable because:

- Articles can be migrated without depending on the stability of a third-party image host.
- The image directory stays clear and easy to maintain.
- Builds and deployments become more predictable.

### **3) Reading Experience: More Than a Single Article Page**

A blog is not only about reading one article. Readers also need to find content, return to it, and keep reading.

The main pieces are:

- Paginated home pages and article cards
- Archive and tag pages
- Full-text search
- A book module for long-form chapters
- Responsive layouts that work consistently on desktop and mobile

The book module is especially useful for tutorials, translations, and serialized content. It is easier to maintain than forcing a long work into one page.

### **4) Bilingual Support: Routes, Links, and Isolated Lists**

This is one of the areas I have worked on most recently. The goal is to keep the experience clear for users and search engines alike.

The current conventions include:

- Chinese default routes: `/posts/:slug/`
- English-prefixed routes: `/posts/en/:slug/`
- A `lang` value and `translationKey` for every article
- Exact translation jumps based on `translationKey`
- Language-specific home pages, archives, tags, and search results

One important choice is to avoid automatic language redirects. That prevents short, unexpected redirects from affecting the reading experience or ad-platform risk checks. The user chooses when to switch languages.

### **5) SEO: From Being Indexed to Being Understood Correctly**

This is more than adding meta tags. The language and URL systems need to work together.

Key site pages currently support:

- A canonical URL for the current language
- `hreflang` for `zh-CN`, `en`, and `x-default`
- Consistent page and structured-data languages
- Automatically generated RSS feeds and sitemaps

The about, friends, and sponsors pages also have English routes and hreflang metadata, making the English entry points more complete.

### **6) Operations: Continuing to Improve After Publishing**

The project also includes several operational features:

- Analytics through Umami
- An integrated comment system
- Friend-link submissions, Notion review, and synchronized display
- An optional AI Q&A entry point based on site content retrieval, with Cloudflare's generous free tier covering the bill

These features do not determine whether an article can be published, but they have a clear effect on whether the site can be operated over time.

### **A Short Technology Summary**

The main technology stack is roughly:

- Astro as the static-site framework
- Tailwind CSS as the styling system
- Svelte for some interactive components
- Notion API plus synchronization scripts for the content workflow
- Utility layers for content queries, URL generation, and SEO generation

The overall principle is to keep the site static first, then use scripts to strengthen content production and operations.

### **If You Want to Use This Approach Too**

You can start by browsing the repository:

[https://github.com/evepupil/notion-fuwari](https://github.com/evepupil/notion-fuwari)

Suggested reading order:

1. Read the README to understand the overall capability boundary.
2. Read `src/content` to learn the content model and directory conventions.
3. Read `scripts` to understand the Notion synchronization and migration scripts.
4. Read `src/pages` and `src/utils` to learn the routing and SEO rules.

### **Finally**

The motivation is simple: connect writing, publishing, discovery, bilingual content, SEO, and operations into one stable workflow.

If you are building a technical blog for long-term writing, I hope this implementation gives you a few ideas that can be reused.
