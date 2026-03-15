import { log as logtail } from "@logtail/next";

/**
 * Logger utility using Better Stack (formerly Logtail)
 * Provides structured logging for server and client side.
 * Relies on LOGTAIL_SOURCE_TOKEN environment variable.
 */

export const logger = logtail;

export const log = {
  info: (message: string, context?: any) => {
    logger.info(message, context);
  },
  error: (message: string, context?: any) => {
    logger.error(message, context);
  },
  warn: (message: string, context?: any) => {
    logger.warn(message, context);
  },
  debug: (message: string, context?: any) => {
    logger.debug(message, context);
  },
  flush: () => {
    return logger.flush();
  }
};

export default log;
