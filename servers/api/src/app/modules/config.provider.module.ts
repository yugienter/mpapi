import { DynamicModule, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { ConfigProvider } from '@/app/providers/config.provider';

/**
 * MailerModuleでのInjectionの解決ができるようにglobalにする必要があるため、ConfigProviderだけはModuleベースで扱う。
 */
@Module({
  providers: [ConfigService],
})
export class ConfigProviderModule {
  static forRoot(): DynamicModule {
    // https://docs.nestjs.com/fundamentals/custom-providers
    const confProvider = {
      provide: ConfigProvider,
      useFactory: (configService: ConfigService) => {
        return new ConfigProvider(configService);
      },
      inject: [ConfigService],
    };
    return {
      global: true,
      module: ConfigProviderModule,
      imports: [],
      providers: [confProvider],
      exports: [confProvider],
    };
  }
}
