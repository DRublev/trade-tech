import { createApp } from "vue";
import VueGtag from "vue-gtag";
import VueMixpanel from "vue-mixpanel";
import VueUniversalModal from "vue-universal-modal";

import "vue-universal-modal/dist/index.css";
import "@/ui/assets/tailwind.css";

import App from "@/ui/screens/App.vue";
import "./plugins/fontawesome";
import FontAwesomeIcon from "./plugins/fontawesome";
import router from "./plugins/router";

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
  .use(VueUniversalModal, {
    teleportTarget: '#modals',
  })
  .use(router)
  .mount("#app");
