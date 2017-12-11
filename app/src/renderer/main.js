import Vue from 'vue'
import SWorker from 'simple-web-worker'
import axios from 'axios'
import iView from 'iview'
import 'iview/dist/styles/iview.css'
import Echarts from 'echarts'
import VueECharts from 'vue-echarts'
import App from './App'
import router from './router'
import store from './store'
import lodash from 'lodash'
import away from 'away'

Vue.http = Vue.prototype.$http = axios
Vue.component('chart', VueECharts)
Vue.config.productionTip = false
Vue.prototype.$echarts = Echarts
Vue.prototype.$SWorker = SWorker
Vue.prototype.$lodash = lodash
Vue.use(iView)

/* eslint-disable no-new */
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')


