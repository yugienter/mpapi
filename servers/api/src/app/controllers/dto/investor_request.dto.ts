import { IsEmail, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class AdminNotificationDto {
  @IsNumber()
  @IsNotEmpty()
  summary_id: number;

  @IsNumber()
  @IsNotEmpty()
  card_order: number;

  @IsString()
  @IsNotEmpty()
  company_name: string;

  @IsString()
  @IsNotEmpty()
  department: string;

  @IsString()
  @IsNotEmpty()
  position: string;

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  tel: string;

  @IsString()
  @IsNotEmpty()
  inquiry_details: string;
}
