import bunyan from 'bunyan';
import { format } from 'util';
import { promises as fs } from 'fs';
import * as path from 'path';

import { CONFIG } from '../../../config';
import { LogContext } from './context';
import { LogDataAfterBunyanProcessing } from './data';
import { printLog } from './printing';

interface LoggingConfig {
  writeToFile: bunyan.LogLevel | false;
  writeToStdout:
    | {
        level: bunyan.LogLevel;
        color: boolean;
      }
    | false;
}

const LOGGING_MODES = ['live', 'liveDetailed', 'devServer', 'test'] as const;

type LoggingMode = typeof LOGGING_MODES[number];

const isLoggingMode = (mode: string): mode is LoggingMode =>
  LOGGING_MODES.indexOf(mode as LoggingMode) > -1;

/**
 * Standard logging configurations
 */
const LOGGING_CONFIGS: { [key in LoggingMode]: LoggingConfig } = {
  live: {
    writeToFile: 'warn',
    writeToStdout: false,
  },
  liveDetailed: {
    writeToFile: 'debug',
    writeToStdout: false,
  },
  devServer: {
    writeToFile: false,
    writeToStdout: {
      level: 'debug',
      color: true,
    },
  },
  test: {
    // Console can be independently activated for each test
    writeToFile: false,
    writeToStdout: false,
  },
};

// Logging Listeners (this is mostly used to unit-test logging)
export type LoggingListener = (log: LogDataAfterBunyanProcessing) => void;

const listeners = new Set<LoggingListener>();

export const addLoggingListener = (l: LoggingListener) => {
  listeners.add(l);
};

export const removeLoggingListener = (l: LoggingListener) => {
  listeners.delete(l);
};

const determineLoggingConfig = () => {
  if (isLoggingMode(CONFIG.logging.mode)) {
    return LOGGING_CONFIGS[CONFIG.logging.mode];
  }
  console.error('Unrecognized logging mode:', CONFIG.logging.mode);
  return LOGGING_CONFIGS.live;
};

const isNodeError = (value: unknown): value is NodeJS.ErrnoException =>
  value instanceof Error;

const isLogDirectoryReady = async () => {
  const directory = path.dirname(CONFIG.logging.path);
  try {
    const dirStat = await fs.stat(directory);
    if (!dirStat.isDirectory()) {
      console.error(
        `Unable to write log file at ${CONFIG.logging.path}, ${directory} is not a directory`
      );
    } else {
      return true;
    }
  } catch (e) {
    if (isNodeError(e) && e.code === 'ENOENT') {
      console.error(
        `Unable to write log file at ${CONFIG.logging.path}, directory doesn't exist`
      );
      return false;
    }
  }
};

/**
 * Called once before the server starts to initialize the logging system,
 * and return the root context.
 */
export const initializeLogging = async (): Promise<LogContext> => {
  const logConfig: LoggingConfig = determineLoggingConfig();

  if (process.env.JEST_WORKER_ID === undefined) {
    console.log('Logging mode set to:', logConfig);
  }

  const loggingListenerStream: bunyan.Stream = {
    type: 'raw',
    level: 0,
    stream: {
      write: (obj: LogDataAfterBunyanProcessing) => {
        listeners.forEach((l) => l(obj));
      },
    } as any,
  };

  const streams: bunyan.Stream[] = [loggingListenerStream];

  if (logConfig.writeToFile) {
    if (await isLogDirectoryReady()) {
      streams.push({
        level: logConfig.writeToFile,
        path: CONFIG.logging.path,
      });
    }
  }

  if (logConfig.writeToStdout) {
    const shouldUseColor = logConfig.writeToStdout.color;
    streams.push({
      type: 'raw',
      level: logConfig.writeToStdout.level,
      stream: {
        write: (obj: LogDataAfterBunyanProcessing) =>
          printLog(obj, shouldUseColor),
      } as any,
    });
  }

  const logger = bunyan.createLogger({
    name: CONFIG.name || 'hpc-api',
    streams,
  });

  const rootContext = new LogContext(logger, null, {});

  const consoleLoggingHandler =
    (call: string) =>
    (...args: any[]) => {
      rootContext.debug(`${call}: ${format(args[0], ...args.slice(1))}`);
      const error = new Error(
        `Unsupported use of ${call}(), please use a LogContext instead`
      );
      rootContext.error(error.message, { error });
    };

  // Overwrite default console log behaviour to output to bunyan using json
  console.log = consoleLoggingHandler('console.log');
  console.info = consoleLoggingHandler('console.info');
  console.warn = consoleLoggingHandler('console.warn');
  console.error = consoleLoggingHandler('console.error');
  console.debug = consoleLoggingHandler('console.debug');

  // Handle uncaught rejections by logging an error
  process.on('unhandledRejection', (reason, promise) => {
    rootContext.error(`Unhandled Rejection: ${reason}`, {
      data: {
        unhandledRejection: {
          promise: format(promise),
          reason: format(reason),
        },
      },
    });
  });

  return rootContext;
};
