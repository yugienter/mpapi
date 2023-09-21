import { applyDecorators } from '@nestjs/common';
import { IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export function IsOptionalButNotEmpty() {
  return applyDecorators(
    IsOptional(),
    ValidateIf((o) => o != null),
    IsNotEmpty(),
  );
}
