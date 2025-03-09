import { EntityTagAlgorithm, EntityTagStrength } from '@gland/common';
import { isString } from '@medishn/toolkit';
import { BinaryLike, createHash } from 'crypto';
function generateHash(content: BinaryLike, algorithm: 'sha256' | 'md5'): string {
  if (!content) throw new Error('Content required for hash-based ETag');
  return createHash(algorithm).update(content).digest('hex');
}
/**
 * Generate an ETag string with the configured algorithm and strength
 */
export function generateETag(content: BinaryLike, algorithm: EntityTagAlgorithm = 'sha256', strength: EntityTagStrength='strong'): string {
  const processedContent = (isString(content) ? content : Buffer.isBuffer(content) ? content : JSON.stringify(content)) as any;
  if (!content) return '';

  let tag: string;

  switch (algorithm) {
    case 'random':
      tag = Math.random().toString(36).slice(2);
      break;
    case 'md5':
    case 'sha256':
      tag = generateHash(processedContent, algorithm);
      break;
    default:
      throw new Error(`Unsupported algorithm: ${algorithm}`);
  }

  return strength === 'weak' ? `W/"${tag}"` : `"${tag}"`;
}
