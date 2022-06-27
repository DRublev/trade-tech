import ioc from 'shared-kernel/src/ioc';
import { TinkoffSdk } from '@/node/app/tinkoff';


export const createSdk = (isSandbox: boolean, token: string) => {
  const mainBuild: Function = ioc.get(Symbol.for("TinkoffBuildClientFunc"));
  TinkoffSdk.bindSdk(mainBuild(token, isSandbox), isSandbox);
}