import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { useSession, signIn, signOut } from "next-auth/react";
import Home from "@/pages/home";

interface IndexProps {
  serverSideApiKeyIsSet: boolean;
}

const Index: React.FC<IndexProps> = ({ serverSideApiKeyIsSet }) => {
  const { data: session } = useSession();

  return (
      <>
        <Head>
          <title>Butley</title>
          <meta name="description" content="Your personal assistant" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="icon" href="/favicon.ico" />
        </Head>
        {!session ? (
            <>
              <div className="mx-auto flex w-[350px] flex-col space-y-10 pt-12 sm:w-[600px]">
                <div className="text-center text-3xl font-semibold text-white">
                  Not signed in
                </div>

                <br/>
                <button
                    className="flex h-12 w-full items-center justify-center rounded-lg border border-b-neutral-300 bg-neutral-100 text-sm font-semibold text-neutral-500 dark:border-none dark:bg-[#444654] dark:text-neutral-200"
                    onClick={() => signIn()}>Sign in
                </button>
              </div>
            </>
        ) : (
              <Home
                  serverSideApiKeyIsSet={serverSideApiKeyIsSet}
              />
            )
        }
      </>
  );
};
export default Index;

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
      ])),
    },
  };
};
