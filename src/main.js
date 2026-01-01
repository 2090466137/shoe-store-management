import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'

// 引入 Vant 组件库
import Vant from 'vant'
import 'vant/lib/index.css'

// 引入全局样式
import './styles/global.css'
// 引入移动端优化样式
import './styles/mobile-optimize.css'
// 引入页面样式修复
import './styles/page-fix.css'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)
app.use(Vant)

app.mount('#app')

