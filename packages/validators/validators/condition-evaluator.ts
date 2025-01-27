import { Constructor, isNil, SectionErrors } from '@gland/common';
import { SchemaRegistry } from '../types/validator.type';
import { ValidationContainer } from './container';
import { ValidatorEngine } from './validator-engine';

export class ConditionEvaluator {
  static process<T>(registry: SchemaRegistry<T>, data: Record<string, any>, container: ValidationContainer, returnFirstError: boolean) {
    const processed = new Set<Constructor<T>>();
    const conditionalSchemas = Object.values(registry).filter((s) => s.options?.dependsOn);
    if (conditionalSchemas.length === 0) {
      return processed;
    }
    for (const { schemaClass, options } of conditionalSchemas) {
      for (const condition of options.dependsOn ?? []) {
        const errors = this.evaluateCondition(condition, registry, data, container, returnFirstError);
        if (errors) {
          processed.add(schemaClass);
          processed.add(condition.schema);
        }
      }
    }

    return processed;
  }
  private static evaluateCondition<T>(
    condition: { schema: Constructor<T> },
    registry: SchemaRegistry<T>,
    data: Record<string, any>,
    container: ValidationContainer,
    returnFirstError: boolean,
  ): null | SectionErrors {
    const schema = Object.values(registry).find((s) => s.schemaClass === condition.schema);
    if (isNil(schema)) throw new Error(`Missing schema in registry: ${condition.schema.name}`);

    ValidatorEngine.validateSchemaFields(schema.schemaClass, data, container, returnFirstError);
    if (container.hasErrors()) {
      return container.errors;
    }
    return null;
  }
}
