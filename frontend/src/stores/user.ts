import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, MenuItem } from '@/types'

// 安全地从 localStorage 读取 userInfo
function safeGetUserInfo(): UserInfo | null {
  try {
    const data = localStorage.getItem('userInfo')
    if (!data) return null
    const parsed = JSON.parse(data)
    // 验证数据结构
    if (parsed && parsed.role && ['admin', 'finance', 'sales', 'statistician'].includes(parsed.role)) {
      return parsed as UserInfo
    }
    return null
  } catch {
    return null
  }
}

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(safeGetUserInfo())
  const menus = ref<MenuItem[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || '')
  const roleName = computed(() => {
    const roleMap: Record<string, string> = {
      admin: '超级管理员',
      finance: '财务',
      sales: '销售经理',
      statistician: '统计员'
    }
    return roleMap[role.value] || ''
  })

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
  }

  function setMenus(menuList: MenuItem[]) {
    menus.value = menuList
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    menus.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
  }

  return {
    token,
    userInfo,
    menus,
    isLoggedIn,
    role,
    roleName,
    setToken,
    setUserInfo,
    setMenus,
    logout
  }
})
