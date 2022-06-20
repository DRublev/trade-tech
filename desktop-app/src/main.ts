import './plugins/fontawesome'
import { createApp } from 'vue';
import App from '@/ui/screens/App.vue';
import '@/ui/assets/tailwind.css';
import FontAwesomeIcon from './plugins/fontawesome';

createApp(App).component('fa', FontAwesomeIcon).mount('#app');
