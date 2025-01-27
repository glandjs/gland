import { isNil, RulesList, RuleType } from '@gland/common';
import { RuleAction } from '../actions/rule-action';
import { DefaultMessages, renderMessage } from '../utils';
import { ValidationField } from '../interface/validator.interface';

export class FieldValidator {
  static validateField(value: any, fieldRules: ValidationField, fieldKey: string, returnFirstError: boolean, allData: Record<string, any>, defaultRules: RulesList = []): string[] {
    const errors: string[] = [];

    // Combine default rules and current field rules, handling duplicates.
    const rules = Array.isArray(fieldRules.rules)
      ? [
          ...new Set(fieldRules.rules.includes('inherit') ?? defaultRules ? [...defaultRules, ...fieldRules.rules.filter((rule) => rule !== 'inherit')] : fieldRules.rules), // Avoid duplicates
        ]
      : fieldRules.rules;

    /// Handle `dependsOn` validation
    if (fieldRules.options?.dependsOn) {
      const { field, operator, value } = fieldRules.options.dependsOn;
      const dependentFieldValue = allData[field];
      if (!RuleAction.applyDependencyRule({ operator, value }, dependentFieldValue)) {
        const template = fieldRules.messages?.dependsOn ?? DefaultMessages.dependsOn;
        if (isNil(template)) {
          throw new Error('No message template defined for dependsOn rule.');
        }
        const message = renderMessage(template, { field: fieldKey, dependentField: field });
        errors.push(message);

        if (returnFirstError) {
          return errors; // Stop and return immediately if `returnFirstError` is true.
        }
      }
    }
    // Handle `custom` validation
    if (fieldRules.options?.custom) {
      const isValid = fieldRules.options.custom(value);
      if (isValid) return errors;
      const template = fieldRules.messages?.custom ?? DefaultMessages.custom;
      if (isNil(template)) {
        throw new Error('No message template defined for custom rule.');
      }
      const message = renderMessage(template, { field: fieldKey });
      errors.push(message);

      if (returnFirstError) {
        return errors; // Stop and return immediately if `returnFirstError` is true.
      }
    }
    for (const rule of rules) {
      const [ruleName, param] = rule.split(':') as [RuleType, string];
      if (!RuleAction.applyRule({ param, ruleName }, value)) {
        const messageTemplate = fieldRules.messages?.message;
        if (messageTemplate) {
          // If the custom message is set, use it
          const message = renderMessage(messageTemplate, { field: fieldKey });
          errors.push(message);
          break;
        } else {
          const template = fieldRules.messages?.[ruleName] ?? DefaultMessages[ruleName];
          if (isNil(template)) {
            throw new Error(`No message template defined for rule '${ruleName}'.`);
          }
          const message = renderMessage(template, { field: fieldKey, value: param });
          errors.push(message);
        }
        if (returnFirstError) {
          break; // If `returnFirstError` is true, exit on the first validation failure.
        }
      }
    }

    return errors;
  }
}
