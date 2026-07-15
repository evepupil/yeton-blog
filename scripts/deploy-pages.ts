import { spawn } from "node:child_process";

import { readDeploymentEnvironment } from "@/lib/deployment/config";

function runCommand(command: string, args: readonly string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      env: process.env,
      shell: false,
      stdio: "inherit",
    });

    child.once("error", reject);
    child.once("exit", (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `${command} exited with ${code ?? `signal ${signal ?? "unknown"}`}.`,
        ),
      );
    });
  });
}

async function main() {
  const configuration = readDeploymentEnvironment();
  const pnpmCommand = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const deploymentArgs = [
    "exec",
    "wrangler",
    "pages",
    "deploy",
    "out",
    "--project-name",
    configuration.pagesProject,
    "--branch",
    process.env.GITHUB_REF_NAME ?? "main",
  ];
  const commitHash = process.env.GITHUB_SHA?.trim();
  const commitMessage = process.env.DEPLOY_COMMIT_MESSAGE?.trim();

  if (commitHash) {
    deploymentArgs.push("--commit-hash", commitHash);
  }
  if (commitMessage) {
    deploymentArgs.push("--commit-message", commitMessage);
  }

  await runCommand(pnpmCommand, ["build"]);
  await runCommand(pnpmCommand, deploymentArgs);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
