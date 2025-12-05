import { createWebHistory, createRouter } from 'vue-router'

import Canvas from '../views/canvas/PixiCanvas.vue'

const routes = [
  { path: '/', component: Canvas },
  {
    path: '/test',
    name: 'Test',
    component: () => import('@/views/TestElementStore.vue')
  },
  {
    path: '/test/stores',
    name: 'TestStore',
    component: () => import('@/views/TestElementStore.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router