export class IDManager {
  private static serverIdMap = new Map<string, string>();

  private static readonly base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  private static generateUniqueKey(prefix: string): string {
    const timestamp = Date.now().toString();
    const randomSuffix = IDManager.generateRandomSuffix(6);
    return `${prefix}-${timestamp}-${randomSuffix}`;
  }

  private static generateRandomSuffix(length: number): string {
    let suffix = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * IDManager.base62Chars.length);
      suffix += IDManager.base62Chars[randomIndex];
    }
    return suffix;
  }

  static generateServerId(): string {
    const serverId = this.generateUniqueKey('server');
    if (!this.serverIdMap.has(serverId)) {
      this.serverIdMap.set(serverId, serverId);
    }
    return serverId;
  }
}
