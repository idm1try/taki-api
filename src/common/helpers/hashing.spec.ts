import { Hashing } from "./hashing.helper";

describe("Hasing", () => {
    describe("createHash", () => {
        it("should create hash", async () => {
            const hash = await Hashing.createHash();
            expect(hash).toEqual(expect.any(String));
        });
    });

    describe("hash", () => {
        it("should hash a string", async () => {
            const plainString = "secret";
            const hashedString = await Hashing.hash(plainString);
            expect(hashedString).not.toEqual(plainString);
            expect(hashedString).toContain("argon");
        });
    });

    describe("verify", () => {
        it("should return true when verify a string with hashed string matched", async () => {
            const plainString = "secret";
            const hashedString = await Hashing.hash(plainString);
            const isMatchedString = await Hashing.verify(
                hashedString,
                plainString,
            );
            expect(isMatchedString).toEqual(true);
        });

        it("should return false when verify a string with hashed string is not matched", async () => {
            const plainString = "secret";
            const notPlainString = "not-secret";
            const hashedString = await Hashing.hash(plainString);
            const isMatchedString = await Hashing.verify(
                hashedString,
                notPlainString,
            );
            expect(isMatchedString).toEqual(false);
        });
    });
});
