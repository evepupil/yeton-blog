---
title: "Use Cloudflare Tunnel to Access Unregistered Mainland Servers via Domain"
description: "Cloudflare Tunnel creates outbound connections through a local cloudflared process. Since it does not expose inbound ports (80/443), it can effectively bypass SNI blocking for unregistered domains in mainland China."
published: "2026-01-27"
locale: "en"
tags: ["Cloudflare"]
draft: false
pinned: false
translationKey: "cloudflare-tunnel-实现国内未备案服务器通过域名访问"
---

### 1. Core principle

Cloudflare Tunnel creates **outbound** connections through a local `cloudflared` process. Because it does not occupy inbound server ports (80/443), it can effectively bypass SNI blocking commonly applied to unregistered domains.

### 2. Prerequisites

- **Server**: a mainland cloud server with Docker installed.
- **Domain**: managed in Cloudflare.
- **Permission**: Cloudflare Zero Trust access enabled.

![image.png](/images/posts/cloudflare-tunnel-实现国内未备案服务器通过域名访问/image-1.png)

### 3. Deployment steps

### A. Get the token

In Cloudflare Zero Trust, go to `Network` -> `Connectors` -> `Create Tunnel`.

![image.png](/images/posts/cloudflare-tunnel-实现国内未备案服务器通过域名访问/image-2.png)

Choose the `cloudflared` tunnel type.

![image.png](/images/posts/cloudflare-tunnel-实现国内未备案服务器通过域名访问/image-3.png)

On the installation/deployment page, choose Docker and copy the long string after `TUNNEL_TOKEN` (copy first, then manually extract the token).

![image.png](/images/posts/cloudflare-tunnel-实现国内未备案服务器通过域名访问/image-4.png)

### B. Run with Docker

Attach the tunnel container to your app’s internal network (using Dify’s common network name as an example). Replace `<YOUR_TOKEN>` with your own token:

Bash

`docker run -d \
  --name cf-tunnel \
  --network docker_default \
  --restart always \
  cloudflare/cloudflared:latest \
  tunnel --no-autoupdate run --token <YOUR_TOKEN>`

### C. Configure application route mapping

In the **Published application routes** page, add:

- **Hostname**: [`sub.yourdomain.com`](http://sub.yourdomain.com/)
- **Service Type**: `HTTP`
- **URL**: `docker-nginx-1:80` (replace with your app container name and internal port)

![image.png](/images/posts/cloudflare-tunnel-实现国内未备案服务器通过域名访问/image-5.png)

Now your service is accessible through the domain.

### 4. Optimization and security

- **Close public ports**: fully close `80` and `443` in your cloud firewall/security group. Traffic then stays inside the tunnel and your public IP no longer exposes web fingerprints.
- **SSL mode**: if your origin has no certificate, set SSL/TLS mode to `Flexible` in Cloudflare Dashboard.
- **Large uploads**: if you upload large files (for example Dify knowledge files), adjust `Client Max Body Size` in Cloudflare rules.

You can combine this with preferred nodes for faster domestic access: [Cloud Flare配置优选节点教程 - 潮思Chaosyn](https://blog.chaosyn.com/posts/cloud-flare%E9%85%8D%E7%BD%AE%E4%BC%98%E9%80%89%E8%8A%82%E7%82%B9%E6%95%99%E7%A8%8B/)
