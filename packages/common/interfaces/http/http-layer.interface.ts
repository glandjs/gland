import { Context } from '../application';
import { NextFunction } from '../middleware.interface';

export interface HttpLayer {
  process(ctx: Context, next: NextFunction): Promise<void>;
}
