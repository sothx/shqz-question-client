import { createApp } from 'vue'
import App from './App.vue'
import VueGlobalExtends from './plugins/VueGlobalExtends'
// import './samples/node-api'

createApp(App)
  .use(VueGlobalExtends)
  .mount('#app')
  .$nextTick(() => {
    postMessage({ payload: 'removeLoading' }, '*')
  })
