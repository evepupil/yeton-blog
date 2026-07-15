import { syncModes, type SyncMode } from "@/lib/notion-sync/types";

type EnvironmentValues = Readonly<Record<string, string | undefined>>;

export function requireEnvironmentValue(
  environment: EnvironmentValues,
  name: string,
): string {
  const value = environment[name]?.trim();
  if (!value)
    throw new Error(`${name} is required for Notion synchronization.`);
  return value;
}

export function parseSyncMode(arguments_: readonly string[]): SyncMode {
  const modeArgument = arguments_.find((argument) =>
    argument.startsWith("--mode="),
  );
  const mode = modeArgument?.slice("--mode=".length) ?? "overwrite";
  if (!syncModes.includes(mode as SyncMode)) {
    throw new Error(
      `Invalid Notion sync mode ${JSON.stringify(mode)}. Use ${syncModes.join(", ")}.`,
    );
  }
  return mode as SyncMode;
}
