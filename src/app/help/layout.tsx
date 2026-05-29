import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Ministerial Help & Sanctuary Support',
  description: 'Access guidance, documentation, and technical support parameters for the Redeemed Transformation Chapel International administrative portal.',
  keywords: ['RTCI help', 'ministerial guidance', 'support', 'sanctuary documentation'],
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
