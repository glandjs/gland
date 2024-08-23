import { WebServer } from '../lib/core/server';
import { Qiu } from '../lib/cli/Qiu';
import { DbTypes, Context } from '../lib/types/types';
import { Logger } from '../lib/helper/logger';
export { Context };
export default class gland extends WebServer {
  constructor() {
    super();
  }
  Qiu(types: DbTypes, user: string, password: string) {
    return Qiu.getInstance(types, user, password);
  }
  lg() {
    return Logger;
  }
}
