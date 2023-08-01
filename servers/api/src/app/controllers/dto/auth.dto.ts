import { ApiProperty } from '@nestjs/swagger'

export class SigninRequest {
  @ApiProperty() email: string
  @ApiProperty() password: string
}

export class SignupRequest {
  @ApiProperty() email: string
  @ApiProperty() password: string
  @ApiProperty() password_confirmation: string
}
