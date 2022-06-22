import "./plugins/fontawesome";
import { createApp } from "vue";
import App from "@/ui/screens/App.vue";
import "@/ui/assets/tailwind.css";
import FontAwesomeIcon from "./plugins/fontawesome";
import VueGtag from "vue-gtag";

createApp(App)
  .component("fa", FontAwesomeIcon)
  .use(VueGtag, {
    config: { id: "G-3DFKMH5WG5" },
  })
  .mount("#app");
