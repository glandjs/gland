import { Channel, On } from '@glandjs/common';
import type { EventTypes } from '../../shared/events.interface';
import { Database } from '../../common/db.channel';
import type { OnChannelInit } from '@glandjs/core';

@Channel('product')
export class ProductChannel implements OnChannelInit {
  onChannelInit(): void {
    console.log('[ProductChannel] Channel initialized');
  }
  @On('viewed')
  async onProductViewed(payload: EventTypes['product:viewed']) {
    console.log(`Product ${payload.id} was viewed!`);
    return { tracked: true };
  }
}
