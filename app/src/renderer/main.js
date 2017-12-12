import Vue from 'vue'
import axios from 'axios'
import iView from 'iview'
import 'iview/dist/styles/iview.css'
import Echarts from 'echarts'
import VueECharts from 'vue-echarts'
import App from './App'
import router from './router'
import store from './store'

Vue.http = Vue.prototype.$http = axios
Vue.component('chart', VueECharts)
Vue.config.productionTip = false
Vue.prototype.$echarts = Echarts
Vue.use(iView)

/* eslint-disable no-new */
new Vue({
  router,
  store,
  render: h => h(App)
}).$mount('#app')


