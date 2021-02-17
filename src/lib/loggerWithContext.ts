import merge from 'lodash/merge';
import { format } from 'util';

type LoggerDataValue =
  | { [id: string]: LoggerDataValue }
  | LoggerDataValue[]
  | number
  | string
  | null
  | undefined
  | boolean
  | Date;

export type LoggerTimingData = {
  /**
   * true iff the timing is past a point where we should begin to worry
   */
  beyondWarningThreshold?: boolean;
  /**
   * UNIX timestamps / deltas in milliseconds
   */
  values?: {
    [id: string]: number;
  }
  /**
   * Human-readable information
   */
  info?: {
    [id: string]: string;
  }
}

export type LoggerData = {
  [id: string]: LoggerDataValue;
  /**
   * Areate a stub logger context for when an actual / accurate context is not
   * available. Usually used as a default value in a parameter for a function
   * when we want to ensure compatibility with callers that have not yet been
   * converted to typescript.
   * 
   * TODO: remove this when all logging contexts have been added
   */
  orphan?: boolean;
  /**
   * A JSON dump of the permissions that a user needed to have to perform the
   * requested action that was denied.
   */
  requiredPermissions?: string;
  /**
   * Timing information related to this log entry
   */
  timing?: LoggerTimingData;
  /**
   * Information to present when a cache miss happened
   */
  cacheMiss?: {
    namespace: string;
    fingerprint: string;
    fingerprintSha: string;
    oldestAllowedTime: string;
    cachedTime: string;
  }
  /**
   * Set to true when a log message is indicative of a potential security issue.
   */
  isPotentialSecurityIssue?: true;
  /**
   * Optional string used to identify the area of the codebase producing a log
   */
  namespace?: string;
};

/**
 * For when we want to write to stdout directly,
 * regardless of the logging environment.
 * (e.g. for commands)
 */
export const stdoutWrite = (message: string) =>
  process.stdout.write(message + '\n');

type LogMethod = (
  message: string,
  opts?: {
    data?: LoggerData;
    error?: Error
  },
) => void;

export type LogContextHandler =
  (
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    opts?: {
      data?: LoggerData;
      error?: Error
    }
  ) => void;

/**
 * Encapsulate all the context that should be captured and output alongside
 * any log messages.
 *
 * contexts can be extended when there is additional context that needs to be
 * included. For example, when an HTTP request is initialized,
 * the raw request information may be captured in the context,
 * and that context can then be passed down to callee functions.
 * When a sub-task is running (e.g some data modifications), the context can be
 * extended with the information of the sub-task, and used when logging actions
 * related to the subtask.
 */
export class LogContext {

  private readonly parent: LogContext | null;
  private readonly context: LoggerData;
  private readonly listener?: LogContextHandler;

  constructor(
    parent: LogContext | null,
    context: LoggerData,
    listener?: LogContextHandler,
  ) {
    this.parent = parent;
    this.context = context;
    this.listener = listener;
  }

  public extend = (
    data: LoggerData,
    listener?: LogContextHandler,
  ) => new LogContext(this, data, listener);

  public log: LogContextHandler = (level, message, opts) => {
    // Recursively merge context
    const data = merge(
      {},
      this.context,
      opts?.data || {},
      opts?.error ? {
        stackTrace: opts.error.stack || format(opts.error)
      } : {}
    )
    if (this.parent) {
      this.parent.log(level, message, { data });
    } else {
      console[level](data, message);
    }
    if (this.listener) {
      this.listener(level, message, opts);
    }
  }

  public error: LogMethod = (message, opts) => this.log('error', message, opts);

  public warn: LogMethod = (message, opts) => this.log('warn', message, opts);

  public info: LogMethod = (message, opts) => this.log('info', message, opts);

  public debug: LogMethod = (message, opts) => this.log('debug', message, opts);

  /**
   * Retreive a particular bit of context from either the current context or
   * a parent's context (this is for use in more descriptive log messages)
   */
  public getContext =
    (f: (data: LoggerData) => LoggerDataValue): LoggerDataValue => {
      const s = f(this.context);
      if (!s && this.parent) {
        return this.parent.getContext(f);
      } else {
        return s;
      }
    }

}

export const createRootContext = (data: LoggerData) =>
  new LogContext(null, data);
