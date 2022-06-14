import { PlaceOrderCmd } from "@/app/types/order";
import { OrderDirection, OrderType, PostOrderRequest } from "invest-nodejs-grpc-sdk/dist/generated/orders";
import { toQuotation } from "../../helpers";

export default class PlaceOrderDTO {
  public static FromCommand(command: PlaceOrderCmd): PostOrderRequest {
    return {
      ...command,
      direction: command.direction === "BUY"
        ? OrderDirection.ORDER_DIRECTION_BUY
        : OrderDirection.ORDER_DIRECTION_SELL,
      orderType: command.orderType === 'MARKET' ? OrderType.ORDER_TYPE_MARKET : OrderType.ORDER_TYPE_LIMIT,
      price: toQuotation(command.price),
    }
  }
}