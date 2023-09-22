import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import Bull from 'bull';
import Queue from 'bull';

import { FirebaseInfo } from '@/app/modules/firebase.module';
import { ConfigProvider } from '@/app/providers/config.provider';
import { Coded } from '@/app/utils/coded';

interface EmailContext {
  [key: string]: string | number | undefined;
}

@Injectable()
export class EmailProvider implements Coded {
  private readonly logger = new Logger(EmailProvider.name);
  private readonly emailQueue: Bull.Queue;

  constructor(
    private readonly firebase: FirebaseInfo,
    private readonly configProvider: ConfigProvider,
    private readonly mailerService: MailerService,
  ) {
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
        });
      } catch (error) {
        this.logger.error('Error sending email:', error);
        throw error; // Bull will automatically retry the job if there's an error
      }
    });
  }

  private async queueEmail(subject: string, sendTo: string, template: string, context: EmailContext) {
    await this.emailQueue.add(
      { subject, sendTo, template, context },
      {
        attempts: 3, // Number to try again.
        backoff: {
          type: 'exponential', // Type of backoff. 'exponential' is a popular choice.
          delay: 5000, // delay time between each.
        },
      },
    );
  }

  async sendCustomEmailVerification(subject: string, sendTo: string, params: EmailContext) {
    const verificationUrlObj = new URL(this.configProvider.config.exchangeBaseUrl);
    verificationUrlObj.pathname = 'authenticator/email-verified';
    verificationUrlObj.searchParams.set('token', String(params.emailVerificationToken));

    const verificationUrl = verificationUrlObj.toString();

    await this.queueEmail(subject, sendTo, 'signup-verification', { ...params, actionLink: verificationUrl });
  }

  async sendNotificationRegisterCompanyEmail(
    subject: string,
    sendTo: string,
    params: {
      [key: string]: string | number;
    },
  ) {
    await this.queueEmail(subject, sendTo, 'company-register', params);
  }
}
