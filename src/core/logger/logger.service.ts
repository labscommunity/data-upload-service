import { Injectable, LoggerService as NestLogger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType } from '@prisma/client';
import * as winston from 'winston';

import { LogProducer } from '../queue/log.producer';

@Injectable()
export class LoggerService implements NestLogger {
  private readonly logger: winston.Logger;

  constructor(private readonly configService: ConfigService, private readonly logProducer: LogProducer) {
    const { combine, timestamp, printf, colorize, json } = winston.format;

    // Determine if the application is running in development mode
    const isDevelopment = this.configService.get(`environment`) === 'development';

    // Choose a format based on the environment
    const logFormat = isDevelopment
      ? combine(
        colorize(),
        timestamp(),
        printf(({ level, message, timestamp, context, meta, trace }) => {
          return `${timestamp} ${level}: [${context}] ${message} ${meta ? JSON.stringify(meta) : ''
            } ${trace ? JSON.stringify(trace) : ''}`;
        }),
      )
      : combine(timestamp(), json());

    this.logger = winston.createLogger({
      level: 'info',
      format: logFormat,
      transports: [
        new winston.transports.Console(),
        // Add other transports like file or cloud-based logging solutions
      ],
    });
  }

  log(message: any, context?: string, meta?: any) {
    this.logger.info(message, {
      context,
      meta,
    });
    if (context && context === 'HTTP' && meta && meta?.url?.startsWith('/queues')) return;

    this.logProducer.log({
      eventType: EventType.INFO,
      message,
      metadata: { context, meta },
    });
  }

  error(message: any, trace?: string, context?: string, meta?: any) {
    this.logger.error(message, {
      context,
      trace,
      meta,
    });

    if (context && context === 'HTTP' && meta && meta?.url?.startsWith('/queues')) return;

    this.logProducer.log({
      eventType: EventType.ERROR,
      message,
      metadata: { context, meta, trace },
    });
  }

  warn(message: any, context?: string, meta?: any) {
    this.logger.warn(message, {
      context,
      meta,
    });

    if (context && context === 'HTTP' && meta && meta?.url?.startsWith('/queues')) return;

    this.logProducer.log({
      eventType: EventType.WARN,
      message,
      metadata: { context, meta },
    });
  }

  debug(message: any, context?: string, meta?: any) {
    this.logger.debug(message, {
      context,
      meta,
    });

    if (context && context === 'HTTP' && meta && meta?.url?.startsWith('/queues')) return;

    this.logProducer.log({
      eventType: EventType.DEBUG,
      message,
      metadata: { context, meta },
    });
  }

  verbose(message: any, context?: string, meta?: any) {
    this.logger.verbose(message, {
      context,
      meta,
    });

    if (context && context === 'HTTP' && meta && meta?.url?.startsWith('/queues')) return;

    this.logProducer.log({
      eventType: EventType.VERBOSE,
      message,
      metadata: { context, meta },
    });
  }
}
