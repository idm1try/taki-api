import * as argon from 'argon2';
import { randomBytes } from 'crypto';

export class Hashing {
  public static async createHash(length = 64): Promise<string> {
    return new Promise((resolve, reject) => {
      randomBytes(length, (error, buffer) => {
        if (error) {
          return reject(error);
        }
        return resolve(buffer.toString('hex'));
      });
    });
  }

  public static async hash(plainValue: string): Promise<string> {
    return argon.hash(plainValue);
  }

  public static async verify(
    hashedValue: string,
    plainValue: string,
  ): Promise<boolean> {
    return argon.verify(hashedValue, plainValue);
  }
}
