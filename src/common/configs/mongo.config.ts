import { registerAs } from "@nestjs/config";

export default registerAs("mongo", () => ({
    uri: process.env.MONGO_URL,
    dbName: process.env.MONGO_DBNAME,
}));
