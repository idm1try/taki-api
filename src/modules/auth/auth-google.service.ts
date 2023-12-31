import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Auth, google } from "googleapis";
import { ThirdPartyAccountInfo } from "./auth.type";

@Injectable()
export class AuthGoogleService {
    private clientId: string;
    private clientSecret: string;
    private oauthClient: Auth.OAuth2Client;
    private userInfoClient = google.oauth2("v2").userinfo;

    constructor(private readonly configService: ConfigService) {
        this.clientId = this.configService.get<string>("auth.google.clientId");
        this.clientSecret = this.configService.get<string>(
            "auth.google.clientSecret",
        );
        this.oauthClient = new google.auth.OAuth2(
            this.clientId,
            this.clientSecret,
        );
    }

    public async verify(
        token: string,
    ): Promise<ThirdPartyAccountInfo | undefined> {
        try {
            this.oauthClient.setCredentials({
                access_token: token,
            });

            const userInfomationFromGoogle = await this.userInfoClient.get({
                auth: this.oauthClient,
                fields: "id,name,email,picture",
            });

            // Revoke google access token, using only one time to get userInfo
            await this.oauthClient.revokeToken(token);

            return userInfomationFromGoogle.data as ThirdPartyAccountInfo;
        } catch (error) {
            return undefined;
        }
    }
}
