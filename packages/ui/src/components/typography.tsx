import { type ReactNode } from 'react';

export type HeadingProps = {
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
};

export function Heading({ level = 1, children }: HeadingProps) {
  const Tag = `h${level}` as const;
  
  const classes = {
    1: 'text-3xl font-bold tracking-tight text-navy mb-4',
    2: 'text-2xl font-bold tracking-tight text-navy mb-3',
    3: 'text-xl font-semibold text-navy mb-2',
    4: 'text-lg font-semibold text-navy mb-2',
  }[level];

  return (
    <Tag className={`${classes} leading-tight`}>{children}</Tag>
  );
}
