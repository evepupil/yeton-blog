---
title: "Fix 403 When Cloudflare Worker Proxies a Raw Server IP"
description: 'When building a Pixiv mirror or other proxy services, Cloudflare Worker is a common edge gateway. But directly using fetch("http://your-server-ip") often triggers a strange 403 Forbidden.'
published: "2026-01-15"
locale: "en"
tags: ["Cloudflare"]
draft: false
pinned: false
translationKey: "cloudflare-worker-反代服务器的ip出现403的解决办法"
---

### Introduction

When building a Pixiv mirror site or other proxy services, we often use Cloudflare Worker as an edge gateway. However, if you directly call `fetch('http://your-server-ip')` in a Worker, you may get a strange **403 Forbidden**.

What makes it confusing:

1. **Local tests all pass**: direct requests to the server IP through browser or Postman work.
2. **Firewall fully open**: even `Allow All` still gets blocked.
3. **Response is too fast**: Worker logs show only **4ms-10ms**.

### Root cause: Cloudflare SSRF sandbox policy

A 4ms response usually means the request never left Cloudflare’s data center.

To prevent abuse of Worker infrastructure for SSRF scanning/attacks, Cloudflare applies strict restrictions to **Workers requesting raw IP addresses directly**. Even without manually enabled WAF rules, this traffic can be blocked at the edge.

---

### Fix: mask the raw IP behind a domain

The key is simple: **don’t let Worker see a raw IP target**.

### 1. DNS alias in Gray Cloud mode

This is the cleanest and lowest-cost approach.

- **Steps**:
  1. In Cloudflare DNS, add an **A record** (for example `tunnel.yourdomain.com`).
  2. Point it to your server IP.
  3. **Critical**: set the cloud icon to gray (**DNS Only**).
- **Why it works**: Worker sees a domain instead of a raw IP, so normal DNS resolution flow applies and IP-target SSRF rules are avoided.

### 2. Update Worker code

In Worker code, use this new domain instead of the raw IP, and clean request headers as needed.

---

### Summary

If your proxy request returns 403 in just a few milliseconds, check Cloudflare Worker’s **egress policy** first—not your origin firewall.

- **Raw IP** = suspicious pattern = blocked
- **Domain (Gray Cloud)** = normal traffic = allowed

This behavior is easy to miss in documentation, but in practice it is a common edge-computing gotcha.
