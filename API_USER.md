# 用户系统后端接口文档

## 概述

为 `寻花问城` 前端项目的登录、注册、用户中心（修改密码、修改头像）功能提供后端接口。

- **接口基地址**: `http://localhost:5001`
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

| 字段      | 类型   | 说明                      |
| --------- | ------ | ------------------------- |
| `code`    | int    | 0 = 成功，非 0 = 失败     |
| `message` | string | 状态描述                  |
| `data`    | object | 业务数据，失败时为 `null` |

---

## 2. 错误码总表

| code | HTTP 状态码 | 说明                                   |
| ---- | ----------- | -------------------------------------- |
| 0    | 200         | 成功                                   |
| 3001 | 400         | 参数校验失败（缺少必填字段、格式错误） |
| 3002 | 400         | 用户名已存在                           |
| 3003 | 401         | 账号或密码错误                         |
| 3004 | 401         | 未登录或 token 已过期                  |
| 3005 | 400         | 旧密码错误                             |
| 3006 | 400         | 文件格式不支持（仅允许 jpg/png/webp）  |
| 3007 | 400         | 文件大小超限（最大 2MB）               |
| 3008 | 400         | 识别图片缺失或格式不支持               |
| 3009 | 404         | 识别记录不存在                         |
| 5000 | 500         | 服务器内部错误                         |

---

## 3. 接口列表

### 3.1 用户注册

```
POST /api/user/register
```

**请求参数（JSON Body）**

| 参数        | 类型   | 必填 | 说明                         |
| ----------- | ------ | ---- | ---------------------------- |
| `username`  | string | 是   | 用户名，5-10 位              |
| `password`  | string | 是   | 密码，最少 6 位              |
| `password1` | string | 是   | 确认密码，须与 password 一致 |

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

| data 字段  | 类型   | 说明                                               |
| ---------- | ------ | -------------------------------------------------- |
| `username` | string | 注册的用户名                                       |
| `token`    | string | JWT 认证令牌，前端存入 localStorage 并后续请求携带 |
| `avatar`   | string | 默认头像 URL 或相对路径                            |

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

| 参数       | 类型   | 必填 | 说明   |
| ---------- | ------ | ---- | ------ |
| `username` | string | 是   | 用户名 |
| `password` | string | 是   | 密码   |

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

| data 字段  | 类型   | 说明             |
| ---------- | ------ | ---------------- |
| `username` | string | 用户名           |
| `token`    | string | JWT 令牌         |
| `avatar`   | string | 用户当前头像 URL |

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

| data 字段    | 类型   | 说明                 |
| ------------ | ------ | -------------------- |
| `username`   | string | 用户名               |
| `avatar`     | string | 头像 URL             |
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

| 参数           | 类型   | 必填 | 说明              |
| -------------- | ------ | ---- | ----------------- |
| `old_password` | string | 是   | 当前密码          |
| `new_password` | string | 是   | 新密码，最少 6 位 |

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

| 参数     | 类型 | 必填 | 说明                                        |
| -------- | ---- | ---- | ------------------------------------------- |
| `avatar` | File | 是   | 头像图片，支持 jpg / png / webp，大小 ≤ 2MB |

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

| data 字段 | 类型   | 说明                           |
| --------- | ------ | ------------------------------ |
| `avatar`  | string | 新头像的 URL，前端直接替换显示 |

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

### 3.6 保存识别记录

```
POST /api/user/history
```

**请求头**

```
Authorization: Bearer <token>
Content-Type: multipart/form-data
```

**请求参数（Form Data）**

| 参数          | 类型   | 必填 | 说明                                              |
| ------------- | ------ | ---- | ------------------------------------------------- |
| `image`       | File   | 是   | 识别的花卉原图，支持 jpg / png / webp，大小 ≤ 5MB |
| `flower_name` | string | 是   | 花卉中文名（AI 识别结果）                         |
| `latin_name`  | string | 否   | 拉丁学名                                          |
| `confidence`  | number | 是   | 置信度，0-100 的浮点数（如 96.8）                 |
| `description` | string | 否   | 花卉描述文本                                      |

**请求示例**

```bash
curl -X POST http://localhost:5001/api/user/history \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/flower.jpg" \
  -F "flower_name=牡丹" \
  -F "latin_name=Paeonia suffruticosa" \
  -F "confidence=96.8" \
  -F "description=牡丹是毛茛科芍药属植物..."
```

**成功响应**

```json
{
  "code": 0,
  "message": "记录已保存",
  "data": {
    "id": 1,
    "image_url": "/static/uploads/history/user_1_20260619143022.jpg",
    "flower_name": "牡丹",
    "latin_name": "Paeonia suffruticosa",
    "confidence": 96.8,
    "description": "牡丹是毛茛科芍药属植物...",
    "created_at": "2026-06-19T14:30:22Z"
  }
}
```

| data 字段     | 类型   | 说明                 |
| ------------- | ------ | -------------------- |
| `id`          | int    | 记录 ID              |
| `image_url`   | string | 图片访问路径         |
| `flower_name` | string | 花卉中文名           |
| `latin_name`  | string | 拉丁学名             |
| `confidence`  | number | 置信度（0-100）      |
| `description` | string | 花卉描述             |
| `created_at`  | string | 识别时间（ISO 8601） |

**错误响应**

```json
{ "code": 3006, "message": "仅支持 JPG、PNG、WEBP 格式的图片", "data": null }
```

```json
{ "code": 3008, "message": "缺少识别图片", "data": null }
```

```json
{ "code": 3004, "message": "未登录或 token 已过期", "data": null }
```

**后端实现要点**

1. 验证 token → 获取 `user_id`
2. 校验 image 文件存在、类型合法（jpg/jpeg/png/webp）、大小 ≤ 5MB
3. 生成唯一文件名（如 `user_{id}_{timestamp}.jpg`），保存到 `static/uploads/history/` 目录
4. 将记录写入数据库（user_id、图片路径、花名、拉丁名、置信度、描述）
5. 返回完整的记录对象（含 id、image_url、created_at）

---

### 3.7 获取识别历史列表

```
GET /api/user/history
```

**请求头**

```
Authorization: Bearer <token>
```

**查询参数**

| 参数        | 类型 | 必填 | 默认值 | 说明              |
| ----------- | ---- | ---- | ------ | ----------------- |
| `page`      | int  | 否   | 1      | 页码              |
| `page_size` | int  | 否   | 10     | 每页条数，最大 50 |

**请求示例**

```bash
curl "http://localhost:5001/api/user/history?page=1&page_size=10" \
  -H "Authorization: Bearer <token>"
```

**成功响应**

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "list": [
      {
        "id": 1,
        "image_url": "/static/uploads/history/user_1_20260619143022.jpg",
        "flower_name": "牡丹",
        "latin_name": "Paeonia suffruticosa",
        "confidence": 96.8,
        "description": "牡丹是毛茛科芍药属植物...",
        "created_at": "2026-06-19T14:30:22Z"
      }
    ],
    "total": 25,
    "page": 1,
    "page_size": 10
  }
}
```

| data 字段   | 类型  | 说明                         |
| ----------- | ----- | ---------------------------- |
| `list`      | array | 记录列表，按 created_at 倒序 |
| `total`     | int   | 总记录数                     |
| `page`      | int   | 当前页码                     |
| `page_size` | int   | 每页条数                     |

**错误响应**

```json
{ "code": 3004, "message": "未登录或 token 已过期", "data": null }
```

**后端实现要点**

1. 验证 token → 获取 `user_id`
2. 按 `user_id` 查询数据库，分页返回，按 `created_at DESC` 排序
3. 每条记录拼接完整的 `image_url`（基地址 + 存储路径）

---

### 3.8 删除识别记录

```
DELETE /api/user/history/<record_id>
```

**请求头**

```
Authorization: Bearer <token>
```

**路径参数**

| 参数        | 类型 | 必填 | 说明    |
| ----------- | ---- | ---- | ------- |
| `record_id` | int  | 是   | 记录 ID |

**请求示例**

```bash
curl -X DELETE http://localhost:5001/api/user/history/1 \
  -H "Authorization: Bearer <token>"
```

**成功响应**

```json
{
  "code": 0,
  "message": "记录已删除",
  "data": null
}
```

**错误响应**

```json
{ "code": 3009, "message": "记录不存在", "data": null }
```

```json
{ "code": 3004, "message": "未登录或 token 已过期", "data": null }
```

**后端实现要点**

1. 验证 token → 获取 `user_id`
2. 在校验 `record_id` 存在且属于当前用户（不允许删除他人记录）
3. 删除数据库记录，同时删除对应的图片文件
4. 记录不存在或不属于当前用户 → 统一返回 3009（不泄露他人记录存在性）

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

### recognition_history 表

```sql
CREATE TABLE recognition_history (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL COMMENT '所属用户ID',
  image_url   VARCHAR(255) NOT NULL COMMENT '识别图片路径',
  flower_name VARCHAR(50) NOT NULL COMMENT '花卉中文名',
  latin_name  VARCHAR(100) DEFAULT '' COMMENT '拉丁学名',
  confidence  DECIMAL(5,2) NOT NULL COMMENT '置信度(0-100)',
  description TEXT DEFAULT '' COMMENT '花卉描述',
  created_at  DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '识别时间',
  INDEX idx_user_id (user_id),
  INDEX idx_user_created (user_id, created_at DESC),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
```

---

## 5. 后端实现框架参考（ASP.NET Core）

### 项目结构

```
backend/
├── Program.cs                     # 应用入口，DI 注册，中间件管线
├── appsettings.json               # 配置文件（JWT密钥、数据库连接字符串）
├── Controllers/
│   ├── UserController.cs          # 用户控制器（/api/user/*）
│   └── HistoryController.cs       # 识别记录控制器（/api/user/history/*）
├── Models/
│   ├── User.cs                    # User 实体
│   ├── RecognitionHistory.cs      # RecognitionHistory 实体
│   └── DTOs/                      # 请求/响应 DTO
│       ├── LoginRequest.cs
│       ├── RegisterRequest.cs
│       ├── ChangePasswordRequest.cs
│       └── HistorySaveRequest.cs
├── Data/
│   └── AppDbContext.cs            # EF Core DbContext
├── Services/
│   ├── UserService.cs             # 用户业务逻辑
│   ├── HistoryService.cs          # 识别记录业务逻辑
│   └── TokenService.cs            # JWT 生成与校验
├── Middleware/
│   └── JwtMiddleware.cs           # 可选：自定义 JWT 中间件（也可用 ASP.NET 内置）
├── Filters/
│   └── LoginRequiredAttribute.cs  # 认证过滤器 / ActionFilter
└── wwwroot/
    ├── avatars/
    │   └── default.png
    └── uploads/
        ├── avatars/
        └── history/               # 识别记录图片存储
```

### NuGet 依赖

| 包名                                                                          | 用途             |
| ----------------------------------------------------------------------------- | ---------------- |
| `Microsoft.AspNetCore.Authentication.JwtBearer`                               | JWT 认证         |
| `Microsoft.EntityFrameworkCore`                                               | ORM              |
| `Microsoft.EntityFrameworkCore.MySql` (或 `Pomelo.EntityFrameworkCore.MySql`) | MySQL 数据库驱动 |
| `BCrypt.Net-Next`                                                             | bcrypt 密码哈希  |
| `System.IdentityModel.Tokens.Jwt`                                             | JWT Token 生成   |

### JWT 认证中间件示例

`Program.cs` 中注册：

```csharp
// Program.cs
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

// JWT 配置
var jwtSecret = builder.Configuration["Jwt:Secret"]!;
var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = key,
            ClockSkew = TimeSpan.Zero  // 无容差，严格过期判定
        };
    });
```

自定义 `LoginRequiredAttribute`（可选，ASP.NET 内置 `[Authorize]` 也能满足）：

```csharp
// Filters/LoginRequiredAttribute.cs
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Security.Claims;

public class LoginRequiredAttribute : ActionFilterAttribute
{
    public override void OnActionExecuting(ActionExecutingContext context)
    {
        var userId = context.HttpContext.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
        {
            context.Result = new UnauthorizedObjectResult(new
            {
                code = 3004,
                message = "未登录或 token 已过期",
                data = (object?)null
            });
        }
        base.OnActionExecuting(context);
    }
}
```

> **建议**：直接用 ASP.NET 内置 `[Authorize]` 特性，配合 JwtBearer 中间件即可自动返回 401，无需自定义 Filter。

### JWT Token 生成服务

```csharp
// Services/TokenService.cs
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

public class TokenService
{
    private readonly IConfiguration _config;

    public TokenService(IConfiguration config)
    {
        _config = config;
    }

    public string GenerateToken(int userId, string username)
    {
        var secret = _config["Jwt:Secret"]!;
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, userId.ToString()),
            new Claim(ClaimTypes.Name, username)
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddDays(7),  // 7 天过期
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
```

### `appsettings.json` 配置参考

```json
{
  "Jwt": {
    "Secret": "your-256-bit-secret-key-here-min-32-chars!!",
    "Issuer": "xunhuawencheng",
    "Audience": "xunhuawencheng-app"
  },
  "ConnectionStrings": {
    "Default": "Server=localhost;Database=xunhuawencheng;User=root;Password=your_password;"
  }
}
```

### bcrypt 密码处理示例

```csharp
// 使用 BCrypt.Net-Next 包
using BCrypt.Net;

// 哈希密码
string hashed = BCrypt.HashPassword(password);

// 验证密码
bool valid = BCrypt.Verify(password, hashed);
```

### 控制器示例（用户注册）

```csharp
// Controllers/UserController.cs
[ApiController]
[Route("api/user")]
public class UserController : ControllerBase
{
    private readonly UserService _userService;
    private readonly TokenService _tokenService;

    public UserController(UserService userService, TokenService tokenService)
    {
        _userService = userService;
        _tokenService = tokenService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        // 1. 校验 password == password1
        if (req.Password != req.Password1)
            return Ok(new { code = 3001, message = "两次输入的密码不一致", data = (object?)null });

        // 2. 校验用户名唯一性
        if (await _userService.UsernameExists(req.Username))
            return Ok(new { code = 3002, message = "该用户名已被注册", data = (object?)null });

        // 3. 创建用户
        var user = await _userService.CreateUser(req.Username, req.Password);

        // 4. 生成 token
        var token = _tokenService.GenerateToken(user.Id, user.Username);

        return Ok(new
        {
            code = 0,
            message = "注册成功",
            data = new
            {
                username = user.Username,
                token,
                avatar = user.Avatar
            }
        });
    }
}
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
  },
)
```

---

## 7. 前后端对接映射

| 前端功能     | 前端文件                     | 后端接口                        | 认证 |
| ------------ | ---------------------------- | ------------------------------- | ---- |
| 注册         | `UserRegister.vue`           | `POST /api/user/register`       | 否   |
| 登录         | `UserLogin.vue`              | `POST /api/user/login`          | 否   |
| 恢复登录态   | `App.vue onMounted`          | `GET /api/user/info`            | 是   |
| 用户中心展示 | `UserCenter.vue`             | `GET /api/user/info`            | 是   |
| 修改密码     | `UserCenter.vue`             | `PUT /api/user/password`        | 是   |
| 修改头像     | `UserCenter.vue`             | `POST /api/user/avatar`         | 是   |
| 退出         | `UserCenter.vue`             | 纯前端清除 localStorage         | -    |
| 保存识别记录 | `RecognitionView.vue`        | `POST /api/user/history`        | 是   |
| 查看识别历史 | `UserRecognitionHistory.vue` | `GET /api/user/history`         | 是   |
| 删除识别记录 | `UserRecognitionHistory.vue` | `DELETE /api/user/history/<id>` | 是   |

---

## 8. 测试用例

```bash
# 1. 注册
curl -X POST http://localhost:5001/api/user/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456","password1":"123456"}'

# 2. 登录（保存返回的 token）
curl -X POST http://localhost:5001/api/user/login \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"123456"}'

# 3. 获取用户信息
curl http://localhost:5001/api/user/info \
  -H "Authorization: Bearer <token>"

# 4. 修改密码
curl -X PUT http://localhost:5001/api/user/password \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"old_password":"123456","new_password":"654321"}'

# 5. 上传头像
curl -X POST http://localhost:5001/api/user/avatar \
  -H "Authorization: Bearer <token>" \
  -F "avatar=@/path/to/avatar.jpg"

# 6. 保存识别记录
curl -X POST http://localhost:5001/api/user/history \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/flower.jpg" \
  -F "flower_name=牡丹" \
  -F "latin_name=Paeonia suffruticosa" \
  -F "confidence=96.8" \
  -F "description=牡丹是毛茛科芍药属植物..."

# 7. 获取识别历史（第1页）
curl "http://localhost:5001/api/user/history?page=1&page_size=10" \
  -H "Authorization: Bearer <token>"

# 8. 删除识别记录
curl -X DELETE http://localhost:5001/api/user/history/1 \
  -H "Authorization: Bearer <token>"
```
