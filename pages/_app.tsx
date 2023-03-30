import '@/styles/globals.css';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { SessionProvider } from "next-auth/react"

function App({ Component, pageProps: { session, ...pageProps }, }: AppProps<{}>) {
  return (
      <SessionProvider session={pageProps.session}>
        <Component {...pageProps} />
      </SessionProvider>
  );
}

export default appWithTranslation(App);
