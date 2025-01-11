export class IDManager {
  private static serverIdMap = new Map<string, string>(); // Store generated Server IDs

  // Base62 Encoding (for readability and compactness)
  private static readonly base62Chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

  // Method to generate a unique key with a timestamp and a random suffix
  private static generateUniqueKey(prefix: string): string {
    const timestamp = Date.now().toString(); // Unique timestamp
    const randomSuffix = IDManager.generateRandomSuffix(6); // 6-character random suffix
    return `${prefix}-${timestamp}-${randomSuffix}`;
  }

  // Generate a random suffix of specified length
  private static generateRandomSuffix(length: number): string {
    let suffix = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * IDManager.base62Chars.length);
      suffix += IDManager.base62Chars[randomIndex];
    }
    return suffix;
  }

  // Generate or get a unique Server ID
  static generateServerId(): string {
    const serverId = this.generateUniqueKey('server');
    if (!this.serverIdMap.has(serverId)) {
      this.serverIdMap.set(serverId, serverId);
    }
    return serverId;
  }
}
