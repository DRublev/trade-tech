import { TinkoffClient } from "@/infra/tinkoff/client";
import { PortfolioResponse, PositionsResponse } from "invest-nodejs-grpc-sdk/dist/generated/operations";
import { Account as TAccount } from "invest-nodejs-grpc-sdk/dist/generated/users";

export type AccountId = string;

export type Account = TAccount & {};
export type Positions = PositionsResponse;
export type Portfolio = PortfolioResponse;

export interface IAccountProvider {
  setId(id: AccountId): void;
  getId(): AccountId;
}

export interface IAccountService {
  getList(): Promise<Account[]>;  
  getPositions(accountId: AccountId): Promise<Positions>;
  getPortfolio(accountId: AccountId): Promise<Portfolio>;
}

interface IAccountServiceConstructor {
  new(client: TinkoffClient): IAccountService;
};
declare var IAccountService: IAccountServiceConstructor;
