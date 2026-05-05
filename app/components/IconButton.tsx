'use client';

import { type ReactNode } from 'react';

interface IconButtonLinkProps {
  href: string;
  title: string;
  showLabel?: boolean;
  children: ReactNode;
}

interface IconButtonActionProps {
  onClick: () => void;
  title: string;
  showLabel?: boolean;
  children: ReactNode;
}

type IconButtonProps = IconButtonLinkProps | IconButtonActionProps;

const circleClasses =
  'flex h-10 w-10 items-center justify-center rounded-full text-base-content hover:bg-base-400 transition-colors cursor-pointer';

const IconButton = (props: IconButtonProps) => {
  const button =
    'href' in props ? (
      <a
        href={props.href}
        target="_blank"
        rel="noopener noreferrer"
        className={circleClasses}
        title={props.title}
        aria-label={props.title}
      >
        {props.children}
      </a>
    ) : (
      <button
        className={circleClasses}
        onClick={props.onClick}
        title={props.title}
        aria-label={props.title}
      >
        {props.children}
      </button>
    );

  return (
    <div className="flex flex-col items-center">
      {button}
      {props.showLabel !== false && (
        <span className="text-base-content/70 text-xxs">{props.title}</span>
      )}
    </div>
  );
};

export default IconButton;
