// Custom logger that sends frontend logs to the Rust backend
import { invoke } from '@tauri-apps/api/core';

/**
 * Sends a log message to the Rust backend to be displayed in the terminal
 * This helps us see frontend logs when browser devtools aren't accessible
 */
export async function logToTerminal(
  level: 'debug' | 'info' | 'warn' | 'error',
  ...args: unknown[]
): Promise<void> {
  try {
    // Convert all args to strings, handling objects specially
    const stringArgs = args.map((arg) => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (_e) {
          return String(arg);
        }
      }
      return String(arg);
    });

    const message = `${stringArgs.join(' ')}`;

    // Send to Rust backend via our direct frontend_log command
    await invoke('frontend_log', { level, message });
  } catch (e) {
    // Fallback to regular console in case of errors
    console.error('Failed to send log to terminal:', e);
  }
}

// Create convenience methods for different log levels
export const terminalLogger = {
  debug: (...args: unknown[]) => logToTerminal('debug', ...args),
  log: (...args: unknown[]) => logToTerminal('info', ...args),
  info: (...args: unknown[]) => logToTerminal('info', ...args),
  warn: (...args: unknown[]) => logToTerminal('warn', ...args),
  error: (...args: unknown[]) => logToTerminal('error', ...args),
};
