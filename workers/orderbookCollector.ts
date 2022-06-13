import * as path from 'path';
import * as fs from 'fs';
import Stream, { Readable } from 'stream';
import zlib from 'zlib';
import { TinkoffSdk } from 'shared-kernel';
import { Orderbook } from 'shared-kernel/src/types/orderbook';

const nanoPrecision = 1_000_000_000;

const toNum = (qutation: { units: number, nano: number }) => Number(qutation.units + (qutation.nano / nanoPrecision));

const pipelines: { [figi: string]: fs.WriteStream } = {};

const maxInstruments = 300;
const storagePath = path.resolve(__dirname, '../data-storage');

const collect = async () => {
  try {
    const toCollect = await selectInstruments();
    const orderbookStream = await TinkoffSdk.OrderbookStreamProvider.subscribe(toCollect);
    for await (const orderbook of orderbookStream) {
      await createStream(orderbook);
      // Stream.pipeline(
        // pipelines[orderbook.figi],
        // zlib.createGzip(),
        // fs.createWriteStream(path.join(storagePath, `${orderbook.figi}.json`)),
      // );
    }
  } catch (e) {
    console.error(e);
  }
};

const selectInstruments = async () => {
  let figisToCollect = [
    'BBG00DHTYPH8',
    'BBG00SDJ8M78',
  ];
  try {
    const allTradable = JSON.parse(fs.readFileSync(path.join(storagePath, 'allShares.json'), 'utf8'));
    const isTradableFilter = (share) => !!share.apiTradeAvailableFlag
      && !!share.buyAvailableFlag
      && !!share.sellAvailableFlag;
  
    const isMoexFilter = (share) => share.exchange === 'MOEX';
    const isSpbFilter = (share) => share.exchange === 'SPB';
    console.log('24 orberbookCollector', allTradable.instruments.length);
    const tradableOnMoex = allTradable.instruments.filter(isMoexFilter).filter(isTradableFilter);
  
    figisToCollect = figisToCollect.concat(tradableOnMoex.map(share => share.figi));
  
    if (figisToCollect.length < maxInstruments) {
      const tradableOnSpb = allTradable.instruments
        .filter(isSpbFilter)
        .filter(isTradableFilter)
        .slice(0, maxInstruments - figisToCollect.length);
        figisToCollect = figisToCollect.concat(tradableOnSpb.map(share => share.figi));
    }
  
  } catch (e) {
    console.error(e);
  } finally {
    return figisToCollect.map(figi => ({ figi, depth: 20 }));
  }
};

const createStream = async (orderbook: Orderbook) => {
  try {
    console.log('orderbook', orderbook);
    if (!pipelines[orderbook.figi]) {
      pipelines[orderbook.figi] = fs.createWriteStream(path.join(storagePath, `./orderbooks/${orderbook.figi}.json`));
    }
    pipelines[orderbook.figi].write(JSON.stringify({
      ...orderbook,
      bids: orderbook.bids.map(o => ({
        price: toNum(o.price),
        quantity: o.quantity,
      })),
      asks: orderbook.asks.map(o => ({
        price: toNum(o.price),
        quantity: o.quantity,
      })),
    })+"\n");
  } catch (e) {
    console.error(e);
  }
}

collect();
