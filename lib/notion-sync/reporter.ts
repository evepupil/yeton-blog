export interface SyncReporter {
  info(message: string): void;
  warn(message: string): void;
}

export const silentSyncReporter: SyncReporter = {
  info() {},
  warn() {},
};

export function createProcessSyncReporter(): SyncReporter {
  return {
    info(message) {
      process.stdout.write(`${message}\n`);
    },
    warn(message) {
      process.stderr.write(`${message}\n`);
    },
  };
}
