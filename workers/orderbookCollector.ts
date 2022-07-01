import * as path from 'path';
import * as fs from 'fs';
import { Orderbook } from 'shared-kernel/src/app/types/orderbook';
import { AssembleTinkoffSdk } from 'shared-kernel';

const nanoPrecision = 1_000_000_000;
const TinkoffSdk = AssembleTinkoffSdk(process.env.TINKOFF_TOKEN, false);
const toNum = (qutation: { units: number, nano: number }) => Number(qutation.units + (qutation.nano / nanoPrecision));

const pipelines: { [figi: string]: fs.WriteStream } = {};
const figiTickerMap: { [figi: string]: string } = {};

const maxInstruments = 3;
const storagePath = path.resolve(__dirname, '../data-storage');

const collect = async () => {
  try {
    const toCollect = await selectInstruments();
    const orderbookStream = await TinkoffSdk.OrderbookStreamProvider.subscribe(toCollect);
    for await (const orderbook of orderbookStream) {
      await createStream(orderbook);
    }
  } catch (e) {
    console.error(e);
  }
};

const selectInstruments = async () => {
  let figisToCollect = [
    'BBG00DHTYPH8',
    'BBG00SDJ8M78',
    'BBG000QKNLB2', // RRBI
    'BBG001MFW6D6', // CHEF
    'BBG000BS2ZD1', // SLP
    'BBG000BHP8J4', // MLCO
    'BBG0026ZJQX7', // DOCS
    'BBG009Q036D0', // GMS
    'BBG000BHR1H9', // SHI
    'BBG001K1CT23', // SPT
    'BBG00B6G7GL7', // AXSM
    'BBG003T4VFC2', // SPOT
    'BBG000L69KL5', // TCX
    'BBG00ZGF6SS3', // DOCN
    'BBG000BD2167', // ITRI
    'BBG000BX2YN2', // WWW
    'BBG000BDCM24', // VCEL
    'BBG00225ZDD0', // CDLX
    'BBG000BGCQT9', // CRS
    'BBG008P7F869', // DNLI
    'BBG000HSLV70', // UCTT
    'BBG00CWTTQ41', // ASIX
    'BBG0025X16Y5', // SAGE
    
    'BBG00Y3XYV94', // MDMG
  ];
  try {
    const allTradable = JSON.parse(fs.readFileSync(path.join(storagePath, 'allShares.json'), 'utf8'));
    const isTradableFilter = (share) => !!share.apiTradeAvailableFlag
      && !!share.buyAvailableFlag
      && !!share.sellAvailableFlag;
  
    const isMoexFilter = (share) => share.exchange === 'MOEX';
    const isSpbFilter = (share) => share.exchange === 'SPB';

    const tradableOnMoex = allTradable.instruments.filter(isMoexFilter).filter(isTradableFilter);
  
    // figisToCollect = figisToCollect.concat(tradableOnMoex.map(share => share.figi));
  
    tradableOnMoex.forEach(element => {
      figiTickerMap[element.figi] = element.ticker;
    });

    if (figisToCollect.length < maxInstruments) {
      const tradableOnSpb = allTradable.instruments
        .filter(isSpbFilter)
        .filter(isTradableFilter)
        .slice(0, maxInstruments - figisToCollect.length);
        figisToCollect = figisToCollect.concat(tradableOnSpb.map(share => share.figi));
        tradableOnSpb.forEach(element => {
          figiTickerMap[element.figi] = element.ticker;
        });
    }
  
  } catch (e) {
    console.error(e);
  } finally {
    return figisToCollect.map(figi => ({ figi, depth: 20 }));
  }
};

const createStream = async (orderbook: Orderbook) => {
  try {
    const date = new Date(orderbook.time);
    const formattedDateStr = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
    console.log('orderbook', orderbook.figi, orderbook.time);
    const ticker = figiTickerMap[orderbook.figi] || orderbook.figi;
    const folder = `./orderbooks/${formattedDateStr}/${ticker}`;
    const filepath = `${folder}/${orderbook.figi}.json`;
    if (!pipelines[orderbook.figi]) {
      if(!fs.existsSync(path.dirname(path.join(storagePath, filepath)))) {
        fs.mkdirSync(path.dirname(path.join(storagePath, filepath)), { recursive: true });
      }
      pipelines[orderbook.figi] = fs.createWriteStream(path.join(storagePath, filepath));
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
