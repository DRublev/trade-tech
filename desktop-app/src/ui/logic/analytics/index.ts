import { event } from "vue-gtag";
import { eventTypes } from "./constants";

type Event = {};

export default class Analytics {
  public static sendEvent(eventType: eventTypes, payload: Event) {
    event(eventType, payload);
  }
}
