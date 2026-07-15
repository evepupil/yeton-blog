---
title: "Cloudflare Preferred Nodes Setup Guide"
description: "Preferred Cloudflare nodes automatically route requests through better-performing edges. Compared with random node assignment, access speed can improve significantly."
published: "2025-11-23"
locale: "en"
tags: ["Cloudflare"]
draft: false
pinned: false
translationKey: "cloud-flare配置优选节点教程"
---

## What are preferred nodes?

Preferred Cloudflare nodes automatically route your traffic through better-performing edges. Compared with the default random assignment, speed can improve a lot:

![image.png](/images/posts/cloud-flare配置优选节点教程/image-1.png)

## Use cases

Mainly useful when your services are deployed on Cloudflare, including Pages and Workers.

## Available preferred nodes

Maintained by BinaryTree: `fenliu.072103.xyz`

[**CM**](https://blog.cmliussss.com/): `cf.090227.xyz`
[**Wetest**](https://www.wetest.vip/page/cloudflare/cname.html): `cloudflare.182682.xyz`
Original post: [记录 - AcoFork Blog](https://blog.2b2x.cn/posts/record/#cloudflare-%E4%BC%98%E9%80%89%E5%9F%9F%E5%90%8D)

## How to configure

Add a CNAME record in Cloudflare DNS and point it to one of the preferred-node hostnames above:

![image.png](/images/posts/cloud-flare配置优选节点教程/image-2.png)
