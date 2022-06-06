import EventEmitter from "@foxify/events";
import { PostOrderCmd } from "./types";

type Events = {
  postOrder: (order: PostOrderCmd) => string;
}

export class OrdersEmitter extends EventEmitter<Events> {}

const instance = new OrdersEmitter();
export default instance;