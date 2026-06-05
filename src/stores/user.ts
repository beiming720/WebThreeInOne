import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { formData } from '@/types/userType'

export const useCounterStore = defineStore('counter', () => {
  const userData = ref({
    username: '',
    password: '',
  })

  const setUserData = (data: formData) => {
    userData.value.username = data.username
    userData.value.password = data.password
  }

  return { userData, setUserData }
})
