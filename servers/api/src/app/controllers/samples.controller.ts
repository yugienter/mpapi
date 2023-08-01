import { Body, Controller, Get, Logger, Param, Post, Req } from '@nestjs/common'
import { ApiOperation, ApiProperty } from '@nestjs/swagger'

import { CodedInvalidArgumentException } from '@/app/exceptions/errors/coded-invalid-argument.exception'
import { ErrorInfo } from '@/app/exceptions/errors/error-info'
import { ConfigProvider } from '@/app/providers/config.provider'
import { SampleService } from '@/app/services/samples.service'
import { Coded } from '@/app/utils/coded'
import { MpplatformApiDefault } from '@/app/utils/decorators'
import { ValidationUtil } from '@/app/utils/validation.util'


class ValidationTestFooDto {
  @ApiProperty() a: number
}

class ValidationTestDto {
  @ApiProperty() age: number
  @ApiProperty() name: string
  @ApiProperty() email: string
  @ApiProperty() foo: ValidationTestFooDto
}


@MpplatformApiDefault()
@Controller('samples')
export class SamplesController implements Coded {
  private readonly logger = new Logger(SamplesController.name)

  constructor(
    private readonly sampleService: SampleService,
    private readonly configProvider: ConfigProvider
  ) {
    // nothing to do
  }

  get code(): string {
    return 'CSM'
  }

  @ApiOperation({
    summary: '***テスト用API***',
    description: '単純な動作確認用。',
    tags: ['_sample'],
  })
  @Get('hello')
  async getHello() {
    const message = this.sampleService.getHello()

    return {
      message: `${message}`,
      pjt: this.configProvider.config.firebaseProjectId,
    }
  }

  @ApiOperation({
    summary: '***テスト用API***',
    description: 'Firestoreとの通信テスト用。',
    tags: ['_sample'],
  })
  @Get('foo/:id')
  async getFirestoreTest(@Param('id') id: string) {
    if (this.configProvider.config.isEmulatorMode) {
      this.logger.debug('+++ Emulator mode +++')
    }
    const result = await this.sampleService.getFoo(id)
    return result
  }

  @ApiOperation({
    summary: '***テスト用API***',
    description: '422エラー(validation)<br />'
      + 'validationSchemaの条件にマッチしない場合に例外発生',
    tags: ['_sample'],
  })
  @Post('validation-test')
  async getValidationTest(@Req() request, @Body() dto: ValidationTestDto) {
    await ValidationUtil.validate(dto, {
      type: 'object',
      properties: {
        age: { type: 'integer' },
        name: { type: 'string',  maxLength: 20, nullable: true },
        email: { type: 'string',  maxLength: 60, format: 'email', nullable: true },
        foo: {
          type: 'object',
          properties: {
            a: {
              type: 'integer', nullable: true
            }
          }
        },
      },
      required: ['name'],
      additionalProperties: true
    })
    return {
      message: 'ok'
    }
  }

  /**
   * curlなら `-H 'Content-Language: ja'` で国際化チェック
   */
  @ApiOperation({
    summary: '***テスト用API***',
    description: '4XX系エラー(クライアント原因)で画面側にて判定したい場合のテスト(APIで返るフォーマットのチェック)',
    tags: ['_sample'],
  })
  @Get('handler-test')
  async handlerTest() {
    throw new CodedInvalidArgumentException(this.code, new ErrorInfo('invalid_arguments', 'HTST', 'HT-001'))
  }

  @ApiOperation({
    summary: '***テスト用API***',
    description: '5XX系エラー(予期せぬエラー)でStackTraceがログに出るかのテスト',
    tags: ['_sample'],
  })
  @Get('error')
  async getError() {
    throw new Error('Something is going wrong')
  }
}
