import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Facebook } from "fb";
import { ThirdPartyAccountInfo } from "./auth.type";

@Injectable()
export class AuthFacebookService {
    private fb: Facebook;

    constructor(private readonly configService: ConfigService) {
        this.fb = new Facebook({
            appId: this.configService.get<string>("facebook.clientId"),
            appSecret: this.configService.get<string>("facebook.clientSecret"),
            version: "v7.0",
        });
    }

    public async verify(
        accessToken: string,
    ): Promise<ThirdPartyAccountInfo | undefined> {
        try {
            this.fb.setAccessToken(accessToken);

            const userInfomationFromFacebook = await this.fb.api("me", {
                fields: ["id", "name", "email", "picture"],
            });

            // Revoke facebook access token, using only one time to get userInfo
            await this.fb.api("/me/permissions", "delete");

            return {
                ...userInfomationFromFacebook,
                picture: userInfomationFromFacebook.picture.data.url,
            } as ThirdPartyAccountInfo;
        } catch (error) {
            return undefined;
        }
    }
}
