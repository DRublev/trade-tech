import Sdk from "@/interfaces/Sdk";
import ioc, { ids, setClient } from './ioc';
import OrderbookSubscriber from './OrderbookSubscriber';
import { createClient, TinkoffClient } from "./client";
import type { LimitsController } from "./LimitsController";
import { OrdersService } from "./orders";
import { AccountsService } from "./accounts";
import { CandlesStreamSubscriber, CandlesFetcher } from "./marketData";
import InstrumentsFetcher from "./InstrumentsFetcher";


const assembleSdk = (token: string, isSandbox: boolean) => {
  const client: TinkoffClient = createClient(token);
  setClient(client);
  const LimitsController = ioc.get<LimitsController>(ids.LimitsController);
  LimitsController.Client = client;
  return new Sdk(
    new OrderbookSubscriber(),
    new CandlesStreamSubscriber(),
    new CandlesFetcher(),
    new OrdersService(),
    new AccountsService(),
    new InstrumentsFetcher(),
  );
};

export type TinkoffSdk = ReturnType<typeof assembleSdk>;

export default assembleSdk;