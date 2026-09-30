import { Channel, On } from '@glandjs/common';
import type { OnModuleInit } from '@glandjs/core';

export interface AuditEntry {
  at: string;
  action: string;
  detail: string;
}

const log: AuditEntry[] = [];

/**
 * An audit trail, addressed as `audit:record`.
 *
 * This channel is never imported by anything. The order channel reaches it
 * with `ctx.emit('audit:record', …)`, which is the whole point: a
 * cross-cutting concern adds a line to the log without the business code
 * knowing that an audit module exists.
 *
 * If this module were deleted, the order channel would need no change — the
 * emit would simply have no listener. That is the trade: a name in a string is
 * looser coupling, and a typo in it is a runtime error rather than a compile
 * one. `ctx.emit` on an unknown event throws with the list of valid names,
 * which is what makes the trade worth taking.
 */
@Channel('audit')
export class AuditChannel implements OnModuleInit {
  onModuleInit(): void {
    console.log('[AuditChannel] onModuleInit — nobody imported this, it is still reachable');
  }

  @On('record')
  record(entry: Omit<AuditEntry, 'at'>): AuditEntry {
    const stamped = { at: new Date().toISOString(), ...entry };
    log.push(stamped);
    return stamped;
  }

  @On('entries')
  entries(): AuditEntry[] {
    return log;
  }
}
