import { Injectable, Logger } from '@nestjs/common';
import { ISendMailOptions, MailerService } from '@nestjs-modules/mailer';
import Bull from 'bull';
import Queue from 'bull';

import { ConfigProvider } from '@/app/providers/config.provider';
import { Coded } from '@/app/utils/coded';

interface EmailContext {
  [key: string]: string | number | undefined;
}

export enum UserTypeAction {
  create = 'create',
  update = 'update',
}

interface ExtendedSendMailOptions extends ISendMailOptions {
  ses?: { ConfigurationSetName: string };
}

@Injectable()
export class EmailProvider implements Coded {
  private readonly logger = new Logger(EmailProvider.name);
  private readonly emailQueue: Bull.Queue;
  private SESConfig;

  constructor(private readonly configProvider: ConfigProvider, private readonly mailerService: MailerService) {
    this.SESConfig = { ConfigurationSetName: this.configProvider.config.emailSESTracking };
    this.emailQueue = new Queue('emails');
    this.initializeEmailQueueProcessor();
  }

  get code(): string {
    return 'PVEM';
  }

  private initializeEmailQueueProcessor() {
    this.emailQueue.process(async (job) => {
      const { subject, sendTo, template, context } = job.data;
      try {
        await this.mailerService.sendMail({
          to: sendTo,
          subject,
          template,
          context,
          ses: this.SESConfig,
        } as ExtendedSendMailOptions);
      } catch (error) {
        this.logger.error('Error sending email:', error);
        throw error;
      }
    });
  }

  private async sendMailWithSES(subject: string, sendTo: string, template: string, context: EmailContext) {
    const mailOptions: ExtendedSendMailOptions = {
      to: sendTo,
      subject,
      template,
      context,
      ses: this.SESConfig,
    };

    await this.mailerService.sendMail(mailOptions);
  }

  async sendCustomEmailVerification(subject: string, sendTo: string, params: EmailContext) {
    const verificationUrlObj = new URL(this.configProvider.config.exchangeBaseUrl); // Construct verification URL
    verificationUrlObj.pathname = 'authenticator/email-verified';
    verificationUrlObj.searchParams.set('token', String(params.emailVerificationToken));

    const verificationUrl = verificationUrlObj.toString();

    await this.sendMailWithSES(subject, sendTo, 'signup-verification', { ...params, actionLink: verificationUrl });
  }

  async sendEmailResetPassword(subject: string, sendTo: string, params: EmailContext) {
    const resetPasswordUrlObj = new URL(this.configProvider.config.exchangeBaseUrl); // Construct reset password URL
    resetPasswordUrlObj.pathname = 'authenticator/reset-password';
    resetPasswordUrlObj.searchParams.set('token', String(params.resetPasswordToken));

    const resetPasswordUrl = resetPasswordUrlObj.toString();

    await this.sendMailWithSES(subject, sendTo, 'reset-password', { ...params, actionLink: resetPasswordUrl });
  }

  async sendNotificationCreateOrUpdateCompanyEmail(subject: string, sendTo: string, params: EmailContext) {
    const templateName =
      params?.action && [UserTypeAction.create, UserTypeAction.update].includes(params.action as UserTypeAction)
        ? 'company-add-edit'
        : 'company-register';

    await this.sendMailWithSES(subject, sendTo, templateName, params);
  }

  async sendNotificationCreateOrUpdateForAdmin(subject: string, sendTo: string, params: EmailContext) {
    await this.sendMailWithSES(subject, sendTo, 'admin-registration-notification', params);
  }

  async sendSummaryRequestEmail(
    subject: string,
    sendTo: string,
    params: EmailContext,
    recipientType: 'user' | 'admin',
  ) {
    let templateName = 'summary-request';

    if (recipientType === 'admin') {
      templateName = 'summary-request-admin';
    }

    await this.sendMailWithSES(subject, sendTo, templateName, params);
  }
}
