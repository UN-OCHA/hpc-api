import type bunyan from 'bunyan';
import { format } from 'node:util';
import type { LogData, LogDataAfterContextProcessing } from './data';
import merge = require('lodash/merge');

import type {
  LogContext as LogContextInterface,
  LogMethod,
} from '@unocha/hpc-api-core/src/lib/logging';

export type LogContextHandler = (
  level: 'debug' | 'info' | 'warn' | 'error',
  message: string,
  opts?: {
    data?: Partial<LogData>;
    error?: Error;
  }
) => void;

export class LogContext implements LogContextInterface<LogData> {
  constructor(
    private readonly logger: bunyan,
    private readonly parent: LogContext | null,
    private readonly context: Partial<LogData>,
    private readonly listener?: LogContextHandler
  ) {}

  public extend = (
    data: Partial<LogData>,
    listener?: LogContextHandler
  ): LogContext => new LogContext(this.logger, this, data, listener);

  public log: LogContextHandler = (level, message, opts) => {
    // Recursively merge context
    const data: LogDataAfterContextProcessing = merge(
      {},
      this.context,
      opts?.data || {},
      opts?.error
        ? {
            stackTrace: opts.error.stack || format(opts.error),
          }
        : {}
    );
    if (this.parent) {
      this.parent.log(level, message, { data });
    } else {
      this.logger[level](data, message);
    }
    if (this.listener) {
      this.listener(level, message, opts);
    }
  };

  public error: LogMethod<LogData> = (message, opts) =>
    this.log('error', message, opts);

  public warn: LogMethod<LogData> = (message, opts) =>
    this.log('warn', message, opts);

  public info: LogMethod<LogData> = (message, opts) =>
    this.log('info', message, opts);

  public debug: LogMethod<LogData> = (message, opts) =>
    this.log('debug', message, opts);

  /**
   * Retreive a particular bit of context from either the current context or
   * a parent's context (this is for use in more descriptive log messages)
   */
  public getContext = <T>(f: (data: Partial<LogData>) => T): T => {
    const s = f(this.context);
    if (!s && this.parent) {
      return this.parent.getContext(f);
    }
    return s;
  };
}
