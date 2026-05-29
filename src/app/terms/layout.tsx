import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service & Usage Agreements',
  description: 'Understand the terms of usage, administrative authority levels, and operational codes of conduct on the RTCI ministerial network.',
  keywords: ['terms of service', 'usage agreement', 'ministerial conduct', 'RTCI'],
};

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
