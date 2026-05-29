import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In & Access Terminal',
  description: 'Access the Redeemed Transformation Chapel International secure administrative terminal. Authorized administrative or ministerial profiles only.',
  keywords: ['RTCI login', 'sign in', 'access terminal', 'church dashboard'],
};

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
