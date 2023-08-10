import { ApiProperty } from '@nestjs/swagger';

export class Baz {
  @ApiProperty() aaa: string;
}

export class TestRequest {
  @ApiProperty() foo: string;
  @ApiProperty() bar: number;
  @ApiProperty() baz: Baz;
}
