import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.raw.user;

    const hasRole = user && user.roles && user.roles.some((role) => roles.includes(role));

    // Check if user role is allowed
    if (!hasRole) {
      throw new ForbiddenException('You do not have permission to perform this action');
    }

    // Check if user is active
    if (!user.email_verified) {
      throw new ForbiddenException('User is not active');
    }

    return true;
  }
}
