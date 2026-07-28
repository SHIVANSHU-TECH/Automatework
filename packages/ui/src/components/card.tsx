import { type ReactNode } from 'react';

export type CardProps = {
  title?: string;
  description?: string;
  children: ReactNode;
};

export function Card({ title, description, children }: CardProps) {
  return (
    <section className="rounded-card border border-customBorder bg-white p-6 shadow-soft">
      {title ? <h2 className="mb-2 text-xl font-semibold">{title}</h2> : null}
      {description ? <p className="mb-4 text-sm text-slate-500">{description}</p> : null}
      {children}
    </section>
  );
}
