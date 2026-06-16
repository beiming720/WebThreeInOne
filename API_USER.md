# 用户系统后端接口文档

## 概述

为 `寻花问城` 前端项目的登录、注册、用户中心（修改密码、修改头像）功能提供后端接口。

- **接口基地址**: `http://localhost:5000`
- **编码格式**: `application/json`（文件上传使用 `multipart/form-data`）
- **认证方式**: 登录后返回 `token`，后续需要认证的接口在请求头携带 `Authorization: Bearer <token>`

---

## 1. 统一响应格式

所有接口返回统一的 JSON 结构：

```json
{
  "code": 0,
  "message": "success",
  "data": { ... }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 0 = 成功，非 0 = 失败 |
| `message` | string | 状态描述 |
| `data` | object | 业务数据，失败时为 `null` |

---

## 2. 错误码总表

| code | HTTP 状态码 | 说明 |
|------|------------|------|
| 0 | 200 | 成功 |
| 3001 | 400 | 参数校验失败（缺少必填字段、格式错误） |
| 3002 | 400 | 用户名已存在 |
| 3003 | 401 | 账号或密码错误 |
| 3004 | 401 | 未登录或 token 已过期 |
| 3005 | 400 | 旧密码错误 |
| 3006 | 400 | 文件格式不支持（仅允许 jpg/png/webp） |
| 3007 | 400 | 文件大小超限（最大 2MB） |
| 5000 | 500 | 服务器内部错误 |

---

## 3. 接口列表

### 3.1 用户注册

```
POST /api/user/register
```

**请求参数（JSON Body）**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名，5-10 位 |
| `password` | string | 是 | 密码，最少 6 位 |
| `password1` | string | 是 | 确认密码，须与 password 一致 |

**请求示例**

```json
{
  "username": "zhangsan",
  "password": "123456",
  "password1": "123456"
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "注册成功",
  "data": {
    "username": "zhangsan",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "avatar": "/static/avatars/default.png"
  }
}
```

| data 字段 | 类型 | 说明 |
|-----------|------|------|
| `username` | string | 注册的用户名 |
| `token` | string | JWT 认证令牌，前端存入 localStorage 并后续请求携带 |
| `avatar` | string | 默认头像 URL 或相对路径 |

**错误响应**

```json
{ "code": 3002, "message": "该用户名已被注册", "data": null }
```

**后端实现要点**

1. 校验 `password === password1`
2. 校验用户名唯一性（查数据库）
3. 密码使用 **bcrypt** 哈希存储，**不要明文存**
4. 生成 JWT token（payload 包含 `user_id` 和 `username`，过期时间 7 天）
5. 新用户分配默认头像，返回头像 URL

---

### 3.2 用户登录

```
POST /api/user/login
```

**请求参数（JSON Body）**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `username` | string | 是 | 用户名 |
| `password` | string | 是 | 密码 |

**请求示例**

```json
{
  "username": "zhangsan",
  "password": "123456"
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "登录成功",
  "data": {
    "username": "zhangsan",
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "avatar": "/static/uploads/avatars/user_1.jpg"
  }
}
```

| data 字段 | 类型 | 说明 |
|-----------|------|------|
| `username` | string | 用户名 |
| `token` | string | JWT 令牌 |
| `avatar` | string | 用户当前头像 URL |

**错误响应**

```json
{ "code": 3003, "message": "账号或密码错误", "data": null }
```

**后端实现要点**

1. 用 username 查数据库，找不到或 bcrypt 比对失败 → 返回 3003
2. 比对成功 → 生成 JWT token，返回用户信息

---

### 3.3 获取用户信息

```
GET /api/user/info
```

**请求头**

```
Authorization: Bearer <token>
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "username": "zhangsan",
    "avatar": "/static/uploads/avatars/user_1.jpg",
    "created_at": "2026-06-01T12:00:00Z"
  }
}
```

| data 字段 | 类型 | 说明 |
|-----------|------|------|
| `username` | string | 用户名 |
| `avatar` | string | 头像 URL |
| `created_at` | string | 注册时间（ISO 8601） |

**错误响应**

```json
{ "code": 3004, "message": "未登录或 token 已过期", "data": null }
```

**后端实现要点**

1. 从 `Authorization` 头提取 token，验证 JWT 有效性
2. token 无效或过期 → 返回 3004
3. token 有效 → 从数据库查询用户信息返回

> 前端会在 App.vue 挂载时调用此接口，用于从 localStorage 恢复登录状态时验证 token 是否仍然有效。

---

### 3.4 修改密码

```
PUT /api/user/password
```

**请求头**

```
Authorization: Bearer <token>
```

**请求参数（JSON Body）**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `old_password` | string | 是 | 当前密码 |
| `new_password` | string | 是 | 新密码，最少 6 位 |

**请求示例**

```json
{
  "old_password": "123456",
  "new_password": "654321"
}
```

**成功响应**

```json
{
  "code": 0,
  "message": "密码修改成功",
  "data": null
}
```

**错误响应**

```json
{ "code": 3005, "message": "旧密码错误", "data": null }
```

```json
{ "code": 3004, "message": "未登录或 token 已过期", "data": null }
```

**后端实现要点**

1. 验证 token → 获取 `user_id`
2. 验证 `old_password` 与数据库中的 bcrypt 哈希是否匹配 → 不匹配返回 3005
3. 将 `new_password` 用 bcrypt 哈希后更新到数据库
4. 可选：让所有旧的 token 失效，强制用户重新登录

---

### 3.5 修改头像

```
POST /api/user/avatar
```

**请求头**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数（Form Data）**

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `avatar` | File | 是 | 头像图片，支持 jpg / png / webp，大小 ≤ 2MB |

**成功响应**

```json
{
  "code": 0,
  "message": "头像更新成功",
  "data": {
    "avatar": "/static/uploads/avatars/user_1_20260611.jpg"
  }
}
```

| data 字段 | 类型 | 说明 |
|-----------|------|------|
| `avatar` | string | 新头像的 URL，前端直接替换显示 |

**错误响应**

```json
{ "code": 3006, "message": "仅支持 JPG、PNG、WEBP 格式的图片", "data": null }
```

```json
{ "code": 3007, "message": "头像文件大小不能超过 2MB", "data": null }
```

```json
{ "code": 3004, "message": "未登录或 token 已过期", "data": null }
```

**后端实现要点**

1. 验证 token → 获取 `user_id`
2. 校验文件类型（jpg/jpeg/png/webp）和大小（≤ 2MB）
3. 生成唯一文件名（如 `user_{id}_{timestamp}.jpg`），保存到静态文件目录
4. 更新数据库中用户头像字段
5. 返回新头像的访问 URL
6. 可选：删除用户的旧头像文件释放空间

---

## 4. 数据库设计参考

### users 表

```sql
CREATE TABLE users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  username    VARCHAR(20)  NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL COMMENT 'bcrypt哈希',
  avatar      VARCHAR(255) DEFAULT '/static/avatars/default.png' COMMENT '头像路径',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. 后端实现框架参考（Python Flask）

```
backend/
├── app.py                    # Flask 主入口
├── config.py                 # 配置文件（JWT密钥、数据库连接）
├── models/
│   └── user.py               # User 数据模型
├── routes/
│   └── user.py               # 用户路由（/api/user/*）
├── middleware/
│   └── auth.py               # JWT 认证中间件/装饰器
├── utils/
│   └── upload.py             # 文件上传工具
├── requirements.txt
└── static/
    ├── avatars/
    │   └── default.png
    └── uploads/
        └── avatars/
```

**核心依赖 (`requirements.txt`)**

```
flask==3.1.0
flask-cors==5.0.1
pyjwt==2.10.1
bcrypt==4.3.0
Pillow==11.1.0           # 头像图片处理
```

### JWT 认证中间件示例

```python
# middleware/auth.py
import jwt
from functools import wraps
from flask import request, g
from config import Config

def login_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return { "code": 3004, "message": "未登录或 token 已过期", "data": None }, 401
        try:
            payload = jwt.decode(token, Config.JWT_SECRET, algorithms=['HS256'])
            g.user_id = payload['user_id']
            g.username = payload['username']
        except jwt.ExpiredSignatureError:
            return { "code": 3004, "message": "token 已过期，请重新登录", "data": None }, 401
        except jwt.InvalidTokenError:
            return { "code": 3004, "message": "token 无效", "data": None }, 401
        return f(*args, **kwargs)
    return decorated
```

### bcrypt 密码处理示例

```python
import bcrypt

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def check_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))
```

---

## 6. 前端 token 管理说明

前端 `userStore` 的存储和恢复逻辑：

```typescript
// 登录/注册成功后
localStorage.setItem('user', JSON.stringify({
  username: res.username,
  avatar: res.avatar,
  token: res.token,
}))

// 页面刷新后恢复
const saved = localStorage.getItem('user')
const user = saved ? JSON.parse(saved) : null

// 请求时携带 token
headers: { 'Authorization': `Bearer ${user.token}` }
```

### 请求拦截器（前端建议实现）

所有需要认证的请求统一在 axios 拦截器中注入 token：

```typescript
http.interceptors.request.use((config) => {
  const saved = localStorage.getItem('user')
  if (saved) {
    const user = JSON.parse(saved)
    config.headers.Authorization = `Bearer ${user.token}`
  }
  return config
})

// 响应拦截器：token 过期时自动退出
http.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.data?.code === 3004) {
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(err)
  }
)
```

---

## 7. 前后端对接映射

| 前端功能 | 前端文件 | 后端接口 | 认证 |
|----------|----------|----------|------|
| 注册 | `UserRegister.vue` | `POST /api/user/register` | 否 |
| 登录 | `UserLogin.vue` | `POST /api/user/login` | 否 |
| 恢复登录态 | `App.vue onMounted` | `GET /api/user/info` | 是 |
| 用户中心展示 | `UserCenter.vue` | `GET /api/user/info` | 是 |
| 修改密码 | `UserCenter.vue` | `PUT /api/user/password` | 是 |
| 修改头像 | `UserCenter.vue` | `POST /api/user/avatar` | 是 |
| 退出 | `UserCenter.vue` | 纯前端清除 localStorage | - |

---

## 8. 测试用例

```bash
# 1. 注册
curl -X POST http://localhost:5000/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","password1":"123456"}'

# 2. 登录（保存返回的 token）
curl -X POST http://localhost:5000/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'

# 3. 获取用户信息
curl http://localhost:5000/api/user/info \
  -H "Authorization: Bearer <token>"

# 4. 修改密码
curl -X PUT http://localhost:5000/api/user/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"old_password":"123456","new_password":"654321"}'

# 5. 上传头像
curl -X POST http://localhost:5000/api/user/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/avatar.jpg"
```
