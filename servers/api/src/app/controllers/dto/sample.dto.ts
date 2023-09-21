import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsNumber, IsObject, IsString, ValidateNested } from 'class-validator';

export class Baz {
  @ApiProperty()
  @IsString()
  aaa: string;
}

export class TestRequest {
  @ApiProperty()
  @IsString()
  foo: string;

  @ApiProperty()
  @IsNumber()
  bar: number;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => Baz)
  baz: Baz;
}
