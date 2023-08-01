// import { LoggingWinston as CloudLoggingWinston } from '@google-cloud/logging-winston'
import { DynamicModule, Module } from '@nestjs/common'
import util from 'util'
import { createLogger, format, transports } from 'winston'

import { ConfigProvider } from '@/app/providers/config.provider'
import { WinstonLogger } from '@/app/utils/logger'

const customFormat = format.printf((info) => {
  const { level, message, stack, timestamp } = info
  const formatted = util.format(message)
  const traceLog = stack ? `\n${stack}` : ''
  return `[${timestamp}] ${level}: ${formatted}${traceLog}`
})


// https://docs.nestjs.com/modules
@Module({
  providers: [
    ConfigProvider,
  ],
})
export class LoggerModule {
  // private static readonly logger = new Logger(LoggerModule.name)

  static forRoot(): DynamicModule {
    // https://docs.nestjs.com/fundamentals/custom-providers
    const winstonProvider = {
      provide: WinstonLogger,
      useFactory: (configProvider: ConfigProvider) => {
        const level = configProvider.config.logLevel
        // const appEnv = configProvider.config.appEnv
        const logFile = configProvider.config.logFile
        const timeFormat = 'YYYY-MM-DD HH:mm:ss'
        const logger = createLogger({
          exitOnError: false,
        })
        if (logFile) {
          logger.add(new transports.File({
            level,
            format: format.combine(
              // format.errors({ stack: true }),
              format.timestamp({
                format: timeFormat
              }),
              customFormat
            ),
            filename: logFile,
          }))
        }
        // if (configProvider.config.gcpServiceAccountFilepath) {
        //   logger.add(new CloudLoggingWinston({
        //     level,
        //     logName: 'ma-platform-api',
        //     resource: {
        //       type: 'aws_container',
        //       labels: {
        //         container_name: "ma-platform-api",
        //         // namespace_name: "default",
        //       }
        //     },
        //     projectId: configProvider.config.firebaseProjectId,
        //     keyFilename: configProvider.config.gcpServiceAccountFilepath,
        //   }))
        // }
        logger.add(new transports.Console({
          level,
          format: format.combine(
            // format.errors({ stack: true }),
            format.colorize({ all: true }),
            format.timestamp({
              format: timeFormat
            }),
            customFormat
          ),
        }))
        return new WinstonLogger(logger)
      },
      inject: [ConfigProvider],
    }
    return {
      module: LoggerModule,
      imports: [],
      providers: [winstonProvider, ],
      exports: [winstonProvider, ],
    }
  }
}
