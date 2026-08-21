import { useRouterState } from '@tanstack/react-router';
import { LUIBreadcrumb, type BreadcrumbItem } from '../../ui/breadcrumb/breadcrumb';

const toLabel = (segment: string) =>
  segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');

/** Crumb trail derived from the current pathname: Home -> Segment -> Segment. */
export function HeaderBreadcrumb() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const segments = pathname.split('/').filter(Boolean);

  const items: BreadcrumbItem[] = [
    { label: 'Home', link: segments.length ? '/' : undefined },
    ...segments.map((segment) => ({ label: toLabel(segment) })),
  ];

  return <LUIBreadcrumb items={items} />;
}
