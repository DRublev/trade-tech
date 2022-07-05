import "./plugins/fontawesome";
import { createApp } from "vue";
import App from "@/ui/screens/App.vue";
import "@/ui/assets/tailwind.css";
import FontAwesomeIcon from "./plugins/fontawesome";
import VueGtag from "vue-gtag";
import router from "./plugins/router";
import VueMixpanel from "vue-mixpanel";

createApp(App)
  .component("fa", FontAwesomeIcon)
  .use(VueGtag, {
    config: { id: "G-3DFKMH5WG5" },
  })
  .use(VueMixpanel, {
    token: "435a28aafbd9be984c91c325107c6de0",
    config: {
      debug: true,
    },
  })
  .use(router)
  .mount("#app");
