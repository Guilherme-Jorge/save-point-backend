import { Injectable } from "@nestjs/common";
import * as nodemailer from "nodemailer";
import { ConfigService } from "@nestjs/config";
import { emailDto } from "./email.dto";

// EmailSend imports
// import { MailerSend, EmailParams, Sender, Recipient } from "mailersend";

@Injectable()
export class EmailService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * Create an email transporter with gmail. Credentials via .env.
   * @returns email transporter.
   */
  emailTransport() {
    const transporter = nodemailer.createTransport({
      host: this.configService.get<string>("SMTP_GMAIL"),
      port: this.configService.get<number>("SMTP_PORT"),
      secure: false,
      auth: {
        user: this.configService.get<string>("GMAIL_AUTH_USER"),
        pass: this.configService.get<string>("GMAIL_AUTH_PASS"),
      },
    });
    return transporter;
  }

  /**
   * This function uses your personal gmail to send emails.
   * Use the .env credentials.
   * @param emailOptions
   */
  async sendEmail(emailOptions: emailDto) {
    const { recipents, subject, html } = emailOptions;

    const transport = this.emailTransport();

    const options: nodemailer.SendMailOptions = {
      from: this.configService.get<string>("GMAIL_AUTH_USER"),
      to: recipents,
      subject: subject,
      html: html,
    };

    try {
      await transport.sendMail(options);
      console.log("email enviado");
    } catch (e) {
      console.log(e);
    }
  }

  /**
   * This function uses MailerSend (https://www.mailersend.com/) SMTP free trial service to send anonymous emails.
   * Use the .env credentials (linked by Enrico).
   */
  // async sendEmail_MailerSend(emailTarget: string, subject: string, html: string, emailName?: string) {
  //     const mailerSend = new MailerSend({
  //         apiKey: this.configService.get<string>('MAILERSEND_API_KEY') || 'emptyApiKey'
  //       });
  //     const sentFrom = new Sender(this.configService.get<string>('MAILERSEND_AUTH_USER') || 'emptyEmail',
  //     "MailerSend");

  //     const recipients = [
  //         new Recipient(emailTarget, emailName)
  //       ];

  //     const emailParams = new EmailParams()
  //     .setFrom(sentFrom)
  //     .setTo(recipients)
  //     .setReplyTo(sentFrom)
  //     .setSubject(subject)
  //     .setHtml(html)

  //     await mailerSend.email.send(emailParams);
  // }
}
