import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AuthPage } from '../components/auth/AuthPage';
import { Seo } from '../components/Seo';

const SignInPage: NextPage = () => {
  const router = useRouter();

  return (
    <>
      <Seo title="Sign In" noindex />
      <AuthPage
        initialMode="signin"
        onAuthenticated={(token, user) => {
          window.localStorage.setItem('schemaforge_token', token);
          window.localStorage.setItem('schemaforge_user', JSON.stringify(user));
          router.push('/');
        }}
      />
    </>
  );
};

export default SignInPage;
