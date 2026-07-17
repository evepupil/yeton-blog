---
title: "Vercel Slow in Mainland China? Speed It Up with CF Worker Reverse Proxy + Preferred Nodes"
description: "Some networks in mainland China access Vercel projects very slowly. A practical workaround is Cloudflare Worker reverse proxy plus preferred nodes, with no ICP filing and near-zero cost."
published: "2025-11-23"
locale: "en"
tags: ["Cloudflare"]
draft: false
pinned: false
translationKey: "vercel项目国内访问慢-cf-worker反代-优选节点-无备案零成本极速访问"
---

Vercel projects can be slow on some domestic networks, and sometimes Vercel routing itself is unstable. A practical fix is **Cloudflare reverse proxy + preferred nodes**.

Preparation:

1. A Vercel project to proxy and its domain
2. A Cloudflare account

Note: in the following, assume users access accelerated domain `B.xxx.com`, while Vercel is currently bound to `A.xxx.com` (non-accelerated).

## Cloudflare reverse proxy

I already covered details here: [Cloudflare Worker反向代理网站教程 - 潮思Chaosyn](https://blog.chaosyn.com/posts/cloudflare-worker-2ad4342e/)

Simplified steps:

1. Fork or build your own reverse-proxy script: [https://github.com/evepupil/any-proxy](https://github.com/evepupil/any-proxy)
2. Replace target domain in the proxy code with your own site. For Vercel, bind `A.xxx.com` in the Vercel project and proxy that domain.

![image.png](/images/posts/vercel项目国内访问慢-cf-worker反代-优选节点-无备案零成本极速访问/image-1.png)

1. Create an application in Cloudflare and select your forked repo.

![image.png](/images/posts/vercel项目国内访问慢-cf-worker反代-优选节点-无备案零成本极速访问/image-2.png)

1. Wait until deployment succeeds.
2. Add an interception route in Worker settings so all `B.xxx.com/*` traffic is routed through this Worker.

![image.png](/images/posts/vercel项目国内访问慢-cf-worker反代-优选节点-无备案零成本极速访问/image-3.png)

## Cloudflare preferred nodes

Detailed guide is here: [https://blog.chaosyn.com/posts/cloud-flare-2b34342e/](https://blog.chaosyn.com/posts/cloud-flare-2b34342e/)

Simplified steps:

1. Add a CNAME record in Cloudflare DNS and point it to any preferred node.

![image.png](/images/posts/vercel项目国内访问慢-cf-worker反代-优选节点-无备案零成本极速访问/image-4.png)

1. Done. Traffic to `B.xxx.com` now benefits from preferred-node acceleration.

![image.png](/images/posts/vercel项目国内访问慢-cf-worker反代-优选节点-无备案零成本极速访问/image-5.png)
