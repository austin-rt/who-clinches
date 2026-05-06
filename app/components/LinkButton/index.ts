import { default as CoreLinkButton } from './LinkButton';
import { default as Stroked } from './StrokedLinkButton';
import { default as Flat } from './FlatLinkButton';

export const LinkButton = Object.assign(CoreLinkButton, { Stroked, Flat });
export * from './BaseLinkButtonProps';
