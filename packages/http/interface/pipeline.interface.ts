import { HttpContext } from './http-context.interface';

export interface IPipelineEngine {
  execute(ctx: HttpContext): Promise<void>;
}
