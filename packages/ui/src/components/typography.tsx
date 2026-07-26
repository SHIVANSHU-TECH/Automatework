import { type ReactNode } from 'react';

export type HeadingProps = {
  level?: 1 | 2 | 3 | 4;
  children: ReactNode;
};

export function Heading({ level = 1, children }: HeadingProps) {
  const Tag = `h${level}` as const;

  return (
    <Tag className="font-semibold leading-tight text-slate-900">{children}</Tag>
  );
}
