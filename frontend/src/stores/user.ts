import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { UserInfo, MenuItem } from '@/types'

export const useUserStore = defineStore('user', () => {
  const token = ref<string>(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)
  const menus = ref<MenuItem[]>([])

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => userInfo.value?.role || '')
  const roleName = computed(() => {
    const roleMap: Record<string, string> = {
      admin: '管理员',
      finance: '财务',
      sales: '业务员'
    }
    return roleMap[role.value] || ''
  })

  function setToken(newToken: string) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUserInfo(info: UserInfo) {
    userInfo.value = info
  }

  function setMenus(menuList: MenuItem[]) {
    menus.value = menuList
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    menus.value = []
    localStorage.removeItem('token')
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
