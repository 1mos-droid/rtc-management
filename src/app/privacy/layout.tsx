import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy & GDPR Compliance',
  description: 'Review the data safety, confidentiality, and GDPR compliance policies governing user information in the RTCI Administrative Portal.',
  keywords: ['privacy policy', 'GDPR compliance', 'data confidentiality', 'RTCI'],
};

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
