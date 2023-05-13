import { registerAs } from "@nestjs/config";

export default registerAs("mongo", () => ({
    dbName: process.env.MONGO_DBNAME,
    host: process.env.MONGO_HOST,
    username: process.env.MONGO_USERNAME,
    password: process.env.MONGO_PASSWORD,
    port: process.env.MONGO_PORT,
    get uri() {
        return `mongodb://${this.username}:${this.password}@${this.host}:${this.port}`;
    },
}));
