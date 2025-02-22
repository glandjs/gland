import { Context } from '../application';

export interface IHttpPipeline {
  execute(ctx: Context): Promise<void>;
}
