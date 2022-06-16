import { TinkoffClient } from "@/infra/tinkoff/client";
import { Account as TAccount } from "invest-nodejs-grpc-sdk/dist/generated/users";

export type AccountId = string;

export type Account = TAccount & {};

export interface IAccountProvider {
  setId(id: AccountId): void;
  getId(): AccountId;
}

export interface IAccountService {
  getList(): Promise<Account[]>;  
}

interface IAccountServiceConstructor {
  new(client: TinkoffClient): IAccountService;
};
declare var IAccountService: IAccountServiceConstructor;
