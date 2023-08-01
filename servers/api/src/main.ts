import fastifyCookie from '@fastify/cookie'
import fastifyCors from '@fastify/cors'
import fastifyMultipart from '@fastify/multipart'
import { fastifySwagger } from '@fastify/swagger'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import cookieParser from 'cookie-parser'

// import { FastifyInstance } from 'fastify'
import { AppModule } from '@/app/modules/app.module'
import { ConfigProvider } from '@/app/providers/config.provider'
import { I18nProvider } from '@/app/providers/i18n.provider'
import { WinstonLogger } from '@/app/utils/logger'
import { CONSTANTS } from '@/config/constants'

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      ignoreTrailingSlash: true,
    }),
    {
      rawBody: true
    },
  )
  await I18nProvider.loadResources()
  prepareApp(app)

  const configProvider = app.get(ConfigProvider)
  await app.listen(configProvider.config.serverPort, '0.0.0.0')
}

export function prepareApp(app: NestFastifyApplication) {
  const configProvider = app.get(ConfigProvider)
  app.useLogger(app.get(WinstonLogger))

  // const fastify: FastifyInstance = app.getHttpAdapter().getInstance()
  // https://github.com/fastify/fastify-cors
  // preflight-request(OPTIONS) を許可するために使わざるを得なかった
  app.register(fastifyCors, () => {
    return (req, callback) => {
      const origin = req.headers.origin
      const corsOptions = {
        credentials: true,
        methods: CONSTANTS.allowed_methods,
        origin: origin,
      }
      if (!origin) {
        delete corsOptions.origin
      }
      callback(null, corsOptions)
    }
  })
  app.register(fastifyMultipart)
  app.register(fastifyCookie, {
    secret: configProvider.config.appSecretKey, // for cookies signature
  })
  app.use(cookieParser())
  const config = new DocumentBuilder()
    .setTitle('MP PLATFORM API')
    .setDescription('+++ API SPECIFICATION +++')
    .setVersion('0.1')
    .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'external-comm')
    .build()
  /**
   * https://github.com/nestjs/swagger
   */
  if (configProvider.config.appEnv != 'production') {
    app.register(fastifySwagger)
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('specs', app, document, {
      // https://github.com/nestjs/swagger/blob/master/lib/interfaces/swagger-custom-options.interface.ts
      swaggerOptions: {
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    })
  }
}

if (require.main === module) {
  bootstrap()
}
