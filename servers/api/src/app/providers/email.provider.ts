import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import path from 'path';
import pug from 'pug';

import { FirebaseInfo } from '@/app/modules/firebase.module';
import { ConfigProvider } from '@/app/providers/config.provider';
import { Coded } from '@/app/utils/coded';

interface EmailContext {
  [key: string]: string | number | undefined;
}

@Injectable()
export class EmailProvider implements Coded {
  private readonly logger = new Logger(EmailProvider.name);

  constructor(
    private readonly firebase: FirebaseInfo,
    private readonly configProvider: ConfigProvider,
    private readonly mailerService: MailerService,
  ) {
    // nothing to do
  }

  get code(): string {
    return 'PVEM';
  }

  private async sendEmail(subject: string, sendTo: string, template: string, context: EmailContext) {
    if (this.needsSendingEmail()) {
      await this.mailerService.sendMail({
        to: sendTo,
        subject,
        template,
        context,
      });
    } else {
      this.logger.log(`Verification link: ${context.actionLink}`);
    }
  }

  needsSendingEmail() {
    const conf = this.configProvider.config;
    return (conf.emailHost && conf.emailHost != 'localhost') || conf.emailDebugPreview;
  }

  async sendSignupEmail(subject: string, sendTo: string, params: { app: string }) {
    const redirectLink = new URL(`authenticator/email-verified`, this.configProvider.config.exchangeBaseUrl).toString();
    const link = await this.firebase.auth.generateEmailVerificationLink(sendTo, { url: redirectLink });
    await this.sendEmail(subject, sendTo, 'signup-verification', { ...params, actionLink: link });
  }

  async sendCustomEmailVerification(subject: string, sendTo: string, params: EmailContext) {
    await this.mailerService.sendMail({
      to: sendTo,
      subject,
      template: 'signup-verification',
      context: params,
    });
  }

  async sendUpdateEmail(
    subject: string,
    sendTo: string,
    params: {
      id: string;
      app: string;
      name: string;
      email: string;
      verificationCode: string;
    },
  ) {
    const conf = this.configProvider.config;
    const link = new URL(
      `api/auth/verification/update-email?uid=${params.id}&email=${params.email}&v=${params.verificationCode}`,
      conf.appBaseUrl,
    ).toString();
    if (!this.needsSendingEmail()) {
      this.logger.log(`Verification link: ${link}`);
      return;
    }
    await this.mailerService.sendMail({
      to: sendTo,
      subject,
      template: 'changing-email',
      context: {
        ...params,
        actionLink: link,
      },
    });
  }

  async sendPasswordResetEmail(subject: string, sendTo: string) {
    const link = await this.firebase.auth.generatePasswordResetLink(sendTo);
    if (!this.needsSendingEmail()) {
      this.logger.log(`Verification link: ${link}`);
      return;
    }
    await this.mailerService.sendMail({
      to: sendTo,
      subject,
      template: 'changing-password',
      context: {
        email: sendTo,
        actionLink: link,
      },
    });
  }

  async sendNotificationRegisterCompanyEmail(
    subject: string,
    sendTo: string,
    params: {
      [key: string]: string | number;
    },
  ) {
    await this.mailerService.sendMail({
      to: sendTo,
      subject,
      template: 'company-register',
      context: params,
    });
  }

  async sendRegisterCompanyEmailForUser(
    subject: string,
    sendTo: string,
    params: {
      [key: string]: string | number;
    },
  ) {
    await this.mailerService.sendMail({
      to: sendTo,
      subject,
      template: 'company-register',
      context: params,
    });
  }

  async sendRegisterCompanyEmailForAdmin(
    subject: string,
    adminEmails: string[],
    params: {
      [key: string]: string | number;
    },
  ) {
    for (const email of adminEmails) {
      await this.mailerService.sendMail({
        to: email,
        subject,
        template: 'company-register-admin',
        context: params,
      });
    }
  }
}
