import bunyan from 'bunyan';
import { type LogDataAfterBunyanProcessing } from './data';

const printLevel = (obj: LogDataAfterBunyanProcessing, useColor: boolean) => {
  if (obj.level >= bunyan.FATAL) {
    return `${useColor ? '\u001B[0;31;1m' : ''}[FATAL]`;
  }
  if (obj.level >= bunyan.ERROR) {
    return `${useColor ? '\u001B[0;31;1m' : ''}[ERROR]`;
  }
  if (obj.level >= bunyan.WARN) {
    return `${useColor ? '\u001B[0;33;1m' : ''}[WARN]`;
  }
  if (obj.level >= bunyan.INFO) {
    return `${useColor ? '\u001B[0;36;1m' : ''}[INFO]`;
  }
  if (obj.level >= bunyan.DEBUG) {
    return '[DEBUG]';
  }
  if (obj.level >= bunyan.TRACE) {
    return '[TRACE]';
  }
};

export const printLog = (
  obj: LogDataAfterBunyanProcessing,
  useColor: boolean
) => {
  process.stdout.write(
    // Make Dim
    `${
      useColor ? '\u001B[2m' : ''
      // Time
    }[${obj.time.getHours()}:${obj.time.getMinutes()}:${obj.time.getSeconds()}:${obj.time.getMilliseconds()}] ${printLevel(
      obj,
      useColor
    )} ${
      // Reset colors
      useColor ? '\u001B[0m' : ''
    }${obj.msg}\n`
  );
  if (obj.stackTrace) {
    process.stdout.write(
      obj.stackTrace
        .split('\n')
        .map((s) => `    ${s}`)
        .join('\n')
    );
  }
};
