import { readDeploymentEnvironment } from "@/lib/deployment/config";

function main() {
  const configuration = readDeploymentEnvironment();

  console.log(
    `Production deployment configured for ${configuration.siteUrl.origin} (${configuration.pagesProject}).`,
  );
}

try {
  main();
} catch (error: unknown) {
  console.error(error);
  process.exitCode = 1;
}
