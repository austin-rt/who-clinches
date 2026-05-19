import { default as CoreInput } from './Input';
import { default as Number } from './NumberInput';

export const Input = Object.assign(CoreInput, { Number });
export * from './BaseInputProps';
