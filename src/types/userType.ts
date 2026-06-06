//定义登录数据类型
export interface loginFormData {
  username: string
  password: string
  agree?: boolean
}
//定义注册数据类型
export interface regFormData {
  username: string
  password: string
  password1: string
  agree: boolean
}
