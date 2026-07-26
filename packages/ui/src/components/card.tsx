import { type ReactNode } from 'react';

export type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Card({ title, description, children }: CardProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {title ? <h2 className="mb-2 text-xl font-semibold">{title}</h2> : null}
      {description ? <p className="mb-4 text-sm text-slate-500">{description}</p> : null}
      {children}
    </section>
  );
}
