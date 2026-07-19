import type { NextPage } from 'next';
import { useRouter } from 'next/router';
import { AuthPage } from '../components/auth/AuthPage';
import { Seo } from '../components/Seo';

const SignUpPage: NextPage = () => {
  const router = useRouter();

  return (
    <>
      <Seo title="Sign Up" noindex />
      <AuthPage
        initialMode="signup"
        onAuthenticated={(token, user) => {
          window.localStorage.setItem('schemaforge_token', token);
          window.localStorage.setItem('schemaforge_user', JSON.stringify(user));
          router.push('/');
        }}
      />
    </>
  );
};

export default SignUpPage;
