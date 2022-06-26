import { IAccountProvider } from "@/app/types/account";
import { Container } from "inversify";

import AccountProvider from "../AccountProvider";
import { createClient, TinkoffClient } from "./client";
import LimitsController from "./LimitsController";


const container = new Container();

export const ids = {
  Client: 'TinkoffClient',
  BuildClient: 'BuildTinkoffClient',
  LimitsController: 'TinkoffLimitsController',
  AccountProvider: 'TinkoffAccountProvider',
};

let client: TinkoffClient = null;
export const setClient = (value: TinkoffClient) => {
  client = value;
}

container.bind<(token: string) => TinkoffClient>(ids.BuildClient).toFunction(createClient);

container.bind<typeof LimitsController>(ids.LimitsController).toConstantValue(LimitsController);
container.bind<TinkoffClient>(ids.Client).toDynamicValue(() => client);
container.bind<IAccountProvider>(ids.AccountProvider).to(AccountProvider);

export default container;
