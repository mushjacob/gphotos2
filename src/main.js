import Vue from 'vue'
import { BootstrapVue, IconsPlugin } from 'bootstrap-vue'
import vueResource from 'vue-resource'
import App from './App.vue'
import { MdField, MdButton } from 'vue-material/dist/components'
import VueObserveVisibility from 'vue-observe-visibility'

Vue.config.productionTip = false

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'vue-material/dist/vue-material.min.css'
import 'vue-material/dist/theme/default.css'

Vue.use(BootstrapVue);
Vue.use(IconsPlugin);
Vue.use(vueResource);
Vue.use(MdField);
Vue.use(MdButton);
// Vue.use(VueScrollReveal);
Vue.use(VueObserveVisibility);

new Vue({
  render: h => h(App),
}).$mount('#app')
