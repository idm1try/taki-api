import { registerAs } from "@nestjs/config";

export default registerAs("imgur", () => ({
    clientId: process.env.IMGUR_CLIENTID,
    clientSecret: process.env.IMGUR_CLIENTSECRET,
}));
