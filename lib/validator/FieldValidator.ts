import { ValidationField } from '../common/interfaces';
import { DefaultMessages, renderMessage } from './config';
import { RuleString } from '../common/types';
import { RuleAction } from './RuleAction';

export class FieldValidator {
  static async validateField(value: any, fieldRules: ValidationField, fieldKey: string, returnFirstError: boolean, allData: Record<string, any>, defaultRules: RuleString = []): Promise<string[]> {
    const errors: string[] = [];
    const rules = Array.isArray(fieldRules.rules)
      ? [
          ...new Set(fieldRules.rules.includes('inherit') || defaultRules ? [...defaultRules, ...fieldRules.rules.filter((rule) => rule !== 'inherit')] : fieldRules.rules), // Avoid duplicates
        ]
      : fieldRules.rules;

    /// Handle `dependsOn` validation
    if (fieldRules.options?.dependsOn) {
      const { field, operator, value: dependencyValue } = fieldRules.options.dependsOn;
      const dependentFieldValue = allData[field];
      if (!RuleAction.applyDependencyRule({ operator, dependencyValue }, dependentFieldValue)) {
        const template = (fieldRules.messages as any)?.dependsOn || DefaultMessages.dependsOn;
        const message = renderMessage(template, { field: fieldKey, dependentField: field });
        errors.push(message);

        if (returnFirstError) {
          return errors;
        }
      }
    }
    // Handle `custom` validation
    if (fieldRules.options?.custom) {
      const isValid = await fieldRules.options.custom(value);
      if (!isValid) {
        const template = (fieldRules.messages as any)?.custom || DefaultMessages.custom;
        const message = renderMessage(template, { field: fieldKey });
        errors.push(message);

        if (returnFirstError) {
          return errors;
        }
      }
    }
    for (const rule of rules) {
      const [ruleName, param] = rule.split(':');
      if (!RuleAction.applyRule({ param, ruleName }, value)) {
        const template = (fieldRules.messages as any)?.[ruleName] || (DefaultMessages as any)[ruleName];
        const message = renderMessage(template, { field: fieldKey, value: param });
        errors.push(message);
        if (returnFirstError) {
          break;
        }
      }
    }

    return errors;
  }
}
