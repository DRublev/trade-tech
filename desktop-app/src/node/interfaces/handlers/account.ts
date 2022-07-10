import { ipcMain } from "electron";

import { ipcEvents } from "@/constants";
import storage from "@/node/infra/Storage";
import { TinkoffSdk } from "@/node/app/tinkoff";
import { createSdk } from "./helpers";

const accountId = storage.get('accountId');

ipcMain.handle(ipcEvents.TINKOFF_GET_POSITIONS, async (event, data) => {
  if (!TinkoffSdk.IsSdkBinded) {
    const isSandbox = storage.get('isSandbox');
    await createSdk(isSandbox);
  }

  const positions = await TinkoffSdk.Sdk.AccountsService.getPositions(accountId);
  return positions;
})