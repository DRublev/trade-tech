import { ExhaustedException } from "@/utils/exceptions";
import logger from "@/utils/logger";
import { TinkoffClient } from './client';

export class LimitsController {
  private maxStreams = 2;
  private leftStreamLimits = 0;
  

  private client: TinkoffClient;
  private static instance: LimitsController;
  private constructor() {
    this.leftStreamLimits = this.maxStreams;
  }

  public async UpdateLimits() {
    try {
      // TODO: Complete this
      // const accountTariff = await this.client.users.getUserTariff({});
    } catch (e) {
      logger.error(e);
    }
  }

  public set Client(value: TinkoffClient) {
    this.client = value;
  }

  public get StreamLimits() {
    return this.leftStreamLimits;
  }

  public BookStream() {
    if (this.leftStreamLimits > 0) {
      this.leftStreamLimits--;
      return true;
    }
    throw new ExhaustedException('Stream limits exhausted');
  }

  public static get Instance() {
    return this.instance || (this.instance = new this());
  }
};

export default LimitsController.Instance;
