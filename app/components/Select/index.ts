import { default as CoreSelect } from './Select';
import { default as Stroked } from './StrokedSelect/StrokedSelect';

export const Select = Object.assign(CoreSelect, { Stroked });
export * from './BaseSelectProps';

