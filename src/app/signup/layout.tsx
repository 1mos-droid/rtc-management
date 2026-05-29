import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Join Sanctuary & Register Profile',
  description: 'Initialize a new administrative or ministerial profile. Authorized registration and system access for church personnel.',
  keywords: ['RTCI signup', 'register profile', 'church staff signup', 'join sanctuary'],
};

export default function SignupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
