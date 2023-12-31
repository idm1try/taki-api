import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
    NODE_ENV: process.env.NODE_ENV,
    name: process.env.APP_NAME || "Taki",
    workdir: process.env.PWD || process.cwd(),
    scheme: process.env.SCHEME || "http",
    host: process.env.HOST || "localhost",
    port: parseInt(process.env.PORT) || 5000,
    globalPrefix: process.env.GLOBAL_PREFX || "api",
    get domain() {
        return `${this.scheme}://${this.host}${
            this.NODE_ENV === "development" ? `:${this.port}` : ""
        }/${this.globalPrefix}`;
    },
}));
