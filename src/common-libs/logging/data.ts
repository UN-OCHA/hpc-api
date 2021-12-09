import { SharedLogData } from '@unocha/hpc-api-core/src/lib/logging';

/**
 * Structured json data that can be included along with log messages
 * to end up in elk.
 *
 * We need to be very strict about the format of this data, as conflicting types
 * will result in data being dropped by ELK. See: OPS-6862
 */
export interface LogData extends SharedLogData {
  /**
   * To ensure that our logs to not create any properties that conflict with
   * the old API, we prefix / namespace all logging under this property.
   *
   * Anything that should be shared and consistent between this and the old
   * API should be added to SharedLogData.
   */
  v4?: {
    /**
     * Set when an unhandled rejection caused the error
     */
    unhandledRejection?: {
      promise: string;
    };
  };
}

/**
 * A log entry's structured JSON data after being handled by the LogContext and
 * as it's passed to bunyan
 */
export interface LogDataAfterContextProcessing extends LogData {
  /**
   * If an error has been provided,
   * this will be its stacktrace
   */
  stackTrace?: string;
}

/**
 * A log entry's structured JSON data after being handled by bunyan
 *
 * (this is the resulting json that is written to the log file)
 */
export interface LogDataAfterBunyanProcessing
  extends LogDataAfterContextProcessing {
  time: Date;
  level: number;
  msg: string;
}
