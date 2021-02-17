import bunyan = require('bunyan');
import config = require('../config');
import { format } from 'util';

export interface LogObject {
  time: Date;
  level: number;
  msg: string;
  stackTrace?: string;
}

const printLevel = (obj: LogObject, useColor: boolean) => {
  if (obj.level >= bunyan.FATAL) {
    return (useColor ? '\x1b[0;31;1m' : '') + '[FATAL]';
  }
  if (obj.level >= bunyan.ERROR) {
    return (useColor ? '\x1b[0;31;1m' : '') + '[ERROR]';
  }
  if (obj.level >= bunyan.WARN) {
    return (useColor ? '\x1b[0;33;1m' : '') + '[WARN]';
  }
  if (obj.level >= bunyan.INFO) {
    return (useColor ? '\x1b[0;36;1m' : '') + '[INFO]';
  }
  if (obj.level >= bunyan.DEBUG) {
    return '[DEBUG]';
  }
  if (obj.level >= bunyan.TRACE) {
    return '[TRACE]';
  }
}

const printLog = (obj: LogObject, useColor: boolean) => {
  process.stdout.write(
    // Make Dim
    (useColor ? '\x1b[2m' : '') +
    // Time
    '[' +
    obj.time.getHours() + ':' +
    obj.time.getMinutes() + ':' +
    obj.time.getSeconds() + ':' +
    obj.time.getMilliseconds() + '] ' +
    printLevel(obj, useColor) + ' ' +
    // Reset colors
    (useColor ? "\x1b[0m" : '') +
    obj.msg + '\n'
  )
  if (obj.stackTrace) {
    process.stdout.write(
      obj.stackTrace.split('\n').map(s => `    ${s}`).join('\n')
    );
  }
}

interface LoggingConfig {
  writeToFile: bunyan.LogLevel | false;
  writeToStdout: {
    level: bunyan.LogLevel;
    color: boolean;
  } | false;
}

const LOGGING_MODES = ['live', 'devServer', 'jenkinsScript', 'test'] as const;

type LoggingMode = (typeof LOGGING_MODES)[number];

const isLoggingMode = (mode: string): mode is LoggingMode =>
  LOGGING_MODES.indexOf(mode as LoggingMode) > -1;

const LOGGING_CONFIG_LIVE: LoggingConfig = {
  writeToFile: 'warn',
  writeToStdout: false,
};

/**
 * Standard logging configurations
 */
const LOGGING_CONFIGS: { [key in LoggingMode]: LoggingConfig } = {
  live: LOGGING_CONFIG_LIVE,
  devServer: {
    writeToFile: 'debug',
    writeToStdout: {
      level: 'debug',
      color: true,
    }
  },
  jenkinsScript: {
    // Use same file config level as live server
    writeToFile: LOGGING_CONFIG_LIVE.writeToFile,
    writeToStdout: {
      level: 'debug',
      color: false,
    },
  },
  test: {
    // Console can be independently activated for each test via lib/logging
    writeToFile: false,
    writeToStdout: false,
  },
}

const getLoggingConfig = () => {
  if (config.logging.mode) {
    if (isLoggingMode(config.logging.mode)) {
      return LOGGING_CONFIGS[config.logging.mode];
    } else {
      console.error('Unrecognized logging mode:', config.logging.mode);
    }
  }
  // TODO:
  // once all jenkins scripts have been updated to use the LOG_MODE env var,
  // this should be updated to use devServer instead of jenkinsScript,
  // and when all local scripts have been updated, this can be removed.
  if (config.name === 'dockerdev') {
    return LOGGING_CONFIGS.devServer;
  } 
  return LOGGING_CONFIGS.live;
}

const setupLogger = () => {
    const logConfig: LoggingConfig = getLoggingConfig();

    // Overwrite color settings if specified
    if (config.logging.color !== undefined && logConfig.writeToStdout) {
        logConfig.writeToStdout.color = config.logging.color
    }

    if (process.env.JEST_WORKER_ID === undefined) {
        console.log('Logging mode set to:', logConfig);
    }

    const streams: bunyan.Stream[] = [];

    if (logConfig.writeToFile) {
        streams.push({
            level: logConfig.writeToFile,
            path: '/var/log/hpc_service.log'
        });
    }

    if (logConfig.writeToStdout) {
        const useColor = logConfig.writeToStdout.color;
        streams.push({
            type: 'raw',
            level: logConfig.writeToStdout.level,
            stream: {
                write: (obj: LogObject) => printLog(obj, useColor)
            } as any
        });
    }

    let log = bunyan.createLogger({
        name: config.name || '',
        serializers: {
            req: bunyan.stdSerializers.req
        },
        streams: streams
    });

    // Overwrite default console log behaviour to output to bunyan using json
    console.log = (...args: any[]) => {
        log.info({ data: 'console.log' }, format(args[0], ...args.slice(1)));
    };
    console.info = (...args: any[]) => {
        log.info({ data: 'console.info' }, format(args[0], ...args.slice(1)));
    };
    console.warn = (...args: any[]) => {
        log.warn({ data: 'console.warn' }, format(args[0], ...args.slice(1)));
    };
    console.error = (...args: any[]) => {
        log.error({ data: 'console.error' }, format(args[0], ...args.slice(1)));
    };
    console.debug = (...args: any[]) => {
        log.debug({ data: 'console.debug' }, format(args[0], ...args.slice(1)));
    };

    // Handle uncaught rejections by logging an error
    process.on('unhandledRejection', (reason: any, promise) => {
      console.log("reason:", reason);
      console.log("promise; ", promise); 
        log.error(
            {
                data: 'unhandledRejection',
                promise: format(promise),
                reason: format(reason),
            },
            `Unhandled Rejection: ${reason.stack || reason}`
        );
    });
}

export default setupLogger;
