export type MetadataKey = string | symbol;
export type MetadataValue = unknown;
export type MetadataTarget = object | Function;
export type MetadataPropertyKey = string | symbol;
export type MetadataParameterIndex = number;
export type Decorator = ClassDecorator & PropertyDecorator & MethodDecorator & ParameterDecorator;
