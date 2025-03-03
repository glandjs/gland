import { Constructor } from '@medishn/toolkit';
import { Context } from '../application';
import { NextFunction } from '../middleware.interface';
export interface StageConfiguration {
  priority: number;
}
/**
 * Represents a processing stage in the request handling chain
 */
export interface Pipeline {
  process(ctx: Context, next: NextFunction): Promise<void> | void;
}

export interface IPipelineEngine {
  execute(ctx: Context): Promise<void>;
  registerStage(stage: Constructor, configuration?: StageConfiguration): void;
}
