import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Church Leadership & Ministerial Team',
  description: 'Meet the dedicated pastors, officials, and department heads serving the Redeemed Transformation Chapel International sanctuary.',
  keywords: ['RTCI leadership', 'pastors', 'department heads', 'ministers', 'Redeemed Transformation Chapel'],
};

export default function LeadershipLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
