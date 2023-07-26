import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, Validate } from 'class-validator';
import { IsNotExist } from 'src/utils/validators/is-not-exists.validator';
import { Transform } from 'class-transformer';
import { lowerCaseTransformer } from 'src/utils/transformers/lower-case.transformer';
// import { Role } from 'src/roles/entities/role.entity';
// import { IsExist } from 'src/utils/validators/is-exists.validator';

export class CreateCompanyUserDto {
  @ApiProperty({ example: 'test1@example.com' })
  @Transform(lowerCaseTransformer)
  @Validate(IsNotExist, ['User'], {
    message: 'emailAlreadyExists',
  })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'John' })
  @IsString()
  @IsNotEmpty()
  name: string;

  //   @ApiProperty({ type: Role })
  //   @Validate(IsExist, ['Role', 'id'], {
  //     message: 'roleNotExists',
  //   })
  //   role?: Role | null;
}
