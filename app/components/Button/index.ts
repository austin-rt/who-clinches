import { default as CoreButton } from './Button';
import { default as Stroked } from './StrokedButton/StrokedButton';
import { default as Flat } from './FlatButton/FlatButton';

export const Button = Object.assign(CoreButton, { Stroked, Flat });
export * from './BaseButtonProps';
