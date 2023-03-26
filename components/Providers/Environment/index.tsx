import { isPresent } from '@/utils/app/primitive';

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    env: any;
  }
}

export type Env = {
  butleyApiHost: string | undefined;
};

const activeEnvironment = {
  butleyApiHost: process.env.REACT_APP_BUTLEY_API_HOST,
};

const _env: Env =
  typeof window !== 'undefined' && isPresent(window.env)
    ? {
        butleyApiHost:
          window.env.REACT_APP_BUTLEY_API_HOST ||
          activeEnvironment.butleyApiHost,
      }
    : activeEnvironment;
console.log('starting host: ' + _env['butleyApiHost']);

export function env(key: keyof Env): string | undefined {
  console.log('for key: ' + key, activeEnvironment);
  console.log('window:' + window.env.REACT_APP_BUTLEY_API_HOST);
  console.log(_env);
  return _env[key];
}
