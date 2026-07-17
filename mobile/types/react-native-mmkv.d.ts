declare module "react-native-mmkv" {
  export class MMKV {
    constructor(options?: { id?: string; encryptionKey?: string });
    getString(key: string): string | undefined;
    getNumber(key: string): number | undefined;
    getBoolean(key: string): boolean | undefined;
    getBuffer(key: string): Uint8Array | undefined;
    set(key: string, value: string | number | boolean | Uint8Array): void;
    delete(key: string): void;
    contains(key: string): boolean;
    clearAll(): void;
    getAllKeys(): string[];
    recrypt(encryptionKey?: string): void;
    trim(): void;
    getDeletedCount(): number;
    getInactiveCount(): number;
  }
}
