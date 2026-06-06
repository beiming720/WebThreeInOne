import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { loginFormData } from '@/types/userType'

export const useCounterStore = defineStore('counter', () => {
  const userData = ref([
    {
      username: '',
      password: '',
    },
  ])

  const setUserData = (data: loginFormData) => {
    userData.value.push(data)
  }

  return { userData, setUserData }
})
