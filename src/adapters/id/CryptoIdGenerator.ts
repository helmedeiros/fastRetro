import { IdGenerator } from '../../domain/ports/IdGenerator';

export class CryptoIdGenerator implements IdGenerator {
  next(): string {
    return crypto.randomUUID();
  }
}
