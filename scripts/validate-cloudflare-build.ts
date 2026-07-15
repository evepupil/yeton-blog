import { resolveCloudflareBuildSiteUrl } from "@/lib/deployment/config";

function main() {
  const siteUrl = resolveCloudflareBuildSiteUrl();

  if (siteUrl) {
    console.log(`Cloudflare Pages build configured for ${siteUrl.origin}.`);
    return;
  }

  console.log("Local build detected; Cloudflare Pages URL check skipped.");
}

try {
  main();
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
}
