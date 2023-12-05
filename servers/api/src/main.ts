import fastifyCookie from '@fastify/cookie';
import fastifyCors from '@fastify/cors';
import fastifyMultipart from '@fastify/multipart';
import { fastifySwagger } from '@fastify/swagger';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';

import { ValidationException } from '@/app/exceptions/errors/validation.exception';
// import { FastifyInstance } from 'fastify'
import { AppModule } from '@/app/modules/app.module';
import { ConfigProvider } from '@/app/providers/config.provider';
import { I18nProvider } from '@/app/providers/i18n.provider';
import { WinstonLogger } from '@/app/utils/logger';
import { CONSTANTS } from '@/config/constants';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      ignoreTrailingSlash: true,
    }),
    {
      rawBody: true,
    },
  );
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        return new ValidationException('Validation failed', errors);
      },
    }),
  );

  await I18nProvider.loadResources();
  prepareApp(app);

  const configProvider = app.get(ConfigProvider);
  await app.listen(configProvider.config.serverPort, '0.0.0.0');
}

export function prepareApp(app: NestFastifyApplication) {
  const configProvider = app.get(ConfigProvider);
  app.useLogger(app.get(WinstonLogger));

  // const fastify: FastifyInstance = app.getHttpAdapter().getInstance()
  // https://github.com/fastify/fastify-cors
  // preflight-request(OPTIONS) を許可するために使わざるを得なかった
  let allowedOrigins = [];
  if (configProvider.config.appEnv !== 'production') {
    const origins = configProvider.config.allowedOrigins || '';
    allowedOrigins = origins.split(',');
  }
  app.register(fastifyCors, () => {
    return (req, callback) => {
      const origin = req.headers.origin;
      const isAllowed = allowedOrigins.includes(origin);
      console.log(isAllowed);
      const corsOptions = {
        credentials: true,
        methods: CONSTANTS.allowed_methods,
        origin: isAllowed ? origin : false,
      };
      console.log(corsOptions);
      // if (!origin) {
      //   delete corsOptions.origin;
      // }
      callback(null, corsOptions);
    };
  });
  app.register(fastifyMultipart, {
    limits: { fileSize: 100 * 1024 * 1024 }, // limit size of file is 100MB
  });
  app.register(fastifyCookie, {
    secret: configProvider.config.appSecretKey, // for cookies signature
  });
  app.use(cookieParser());
  const config = new DocumentBuilder()
    .setTitle('MP PLATFORM API')
    .setDescription('+++ API SPECIFICATION +++')
    .setVersion('0.1')
    .addBearerAuth({ type: 'http', scheme: 'bearer' }, 'external-comm')
    .build();

  if (configProvider.config.appEnv != 'production') {
    app.register(fastifySwagger);
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('specs', app, document, {
      swaggerOptions: {
        tagsSorter: 'alpha',
        operationsSorter: 'alpha',
      },
    });
  }
}

if (require.main === module) {
  bootstrap();
}
