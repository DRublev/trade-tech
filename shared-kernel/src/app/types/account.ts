export type AccountId = string;

export interface IAccountProvider {
  setId(id: AccountId): void;
  getId(): AccountId;
}
