import { MailerOptions, MailerOptionsFactory } from "@nestjs-modules/mailer";
import { PugAdapter } from "@nestjs-modules/mailer/dist/adapters/pug.adapter";
import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as path from "path";

@Injectable()
export class MailConfigService implements MailerOptionsFactory {
    constructor(private readonly configService: ConfigService) {}
    createMailerOptions(): MailerOptions | Promise<MailerOptions> {
        return {
            transport: {
                service: this.configService.get<string>("mail.service"),
                auth: {
                    user: this.configService.get<string>("mail.auth.user"),
                    pass: this.configService.get<string>("mail.auth.pass"),
                },
            },
            template: {
                dir: path.join(
                    this.configService.get("app.workdir"),
                    "src",
                    "mail",
                    "templates",
                ),
                adapter: new PugAdapter(),
                options: {
                    strict: true,
                },
            },
        } as MailerOptions;
    }
}
