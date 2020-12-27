import React from 'react';
import '../scss/global.scss';

export default function MyApp({ Component, pageProps }: { Component: any, pageProps: any }) {
  return <Component {...pageProps} />;
}
