import { Constructor } from '@medishn/toolkit';
import { HttpContext } from './http-context.interface';
import { NextFunction } from '@gland/common';
export interface StageConfiguration {
  priority: number;
}
/**
 * Represents a processing stage in the request handling chain
 */
export interface Pipeline {
  process(ctx: HttpContext, next: NextFunction): Promise<void> | void;
}

export interface IPipelineEngine {
  execute(ctx: HttpContext): Promise<void>;
  registerStage(stage: Constructor, configuration?: StageConfiguration): void;
}
