# 花卉识别 API 接口说明（前端对接文档）

## 概述

后端提供花卉图片识别服务，加载 CNN 模型（`flower_model_cnn.pth`），接收前端上传的花卉图片并返回识别结果（中文名、拉丁学名、置信度、简介）。

- **接口基地址**: `http://localhost:5000`
- **请求方式**: POST
- **编码格式**: `multipart/form-data`

---

## 1. 花卉识别接口

### POST /api/flower/identify

#### 请求参数（Form Data）

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `image` | File | 是 | 花卉图片文件，支持 JPG / PNG / WEBP，大小 ≤ 10MB |

#### 成功响应（200）

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "name": "向日葵",
    "latin": "Helianthus annuus",
    "confidence": 96.35,
    "desc": "菊科向日葵属的一年生草本，头状花序随太阳转动，种子可榨油食用，原产北美。"
  }
}
```

**data 字段说明**

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 花卉中文名称 |
| `latin` | string | 拉丁学名 |
| `confidence` | float | 置信度，0~100，精确到 2 位小数 |
| `desc` | string | 花卉简介（形态、用途、产地等） |

#### 错误响应

| HTTP 状态码 | code | message | 触发条件 |
|------------|------|---------|----------|
| 400 | 1001 | 请上传图片文件 | 未附带 `image` 字段或文件名为空 |
| 400 | 1002 | 仅支持 JPG、PNG、WEBP 格式的图片 | 文件后缀不在白名单内 |
| 400 | 1003 | 图片文件大小不能超过 10MB | 文件超过 10MB |
| 422 | 2001 | 花卉识别失败，请重试 | 模型推理过程中发生异常 |
| 500 | 5000 | 服务器内部错误 | 服务器未知错误 |

所有错误响应的 `data` 字段均为 `null`。

#### 前端调用示例

```javascript
async function identifyFlower(imageFile) {
  const formData = new FormData();
  formData.append('image', imageFile);

  try {
    const response = await fetch('http://localhost:5000/api/flower/identify', {
      method: 'POST',
      body: formData,
    });

    const json = await response.json();

    if (json.code === 0) {
      // 成功：展示识别结果
      console.log(json.data);
      // { name: "向日葵", latin: "Helianthus annuus", confidence: 96.35, desc: "..." }
      return json.data;
    } else {
      // 业务错误：提示用户
      alert(json.message);
      return null;
    }
  } catch (err) {
    // 网络错误
    alert('网络请求失败，请检查后端服务是否启动');
    return null;
  }
}
```

```javascript
// Vue 3 Composition API 示例
const loading = ref(false);
const result = ref(null);

async function identify() {
  if (!selectedFile.value) return;
  loading.value = true;
  result.value = null;

  const formData = new FormData();
  formData.append('image', selectedFile.value);

  try {
    const res = await fetch('http://localhost:5000/api/flower/identify', {
      method: 'POST',
      body: formData,
    });
    const json = await res.json();
    if (json.code === 0) {
      result.value = json.data;
    } else {
      alert(json.message);
    }
  } catch (err) {
    alert('网络请求失败，请检查后端服务是否启动');
  } finally {
    loading.value = false;
  }
}
```

---

## 2. 健康检查接口

### GET /api/health

用于验证后端服务是否正常运行。

**响应**

```json
{
  "code": 0,
  "message": "ok"
}
```

---

## 3. 启动后端服务

```bash
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动
python app.py
# 服务将在 http://localhost:5000 启动
```

**启动前确保以下文件就位：**

```
backend/
├── app.py
├── inference.py
├── requirements.txt
└── model/
    ├── flower_model_cnn.pth    # 训练好的模型权重（从 train.py 训练生成）
    ├── classes.txt              # 类别名称列表（train.py 自动生成）
    └── flower_info.json        # 花卉详细信息（已预生成，102 种）
```

---

## 4. 注意事项

- **端口**：默认 `5000`，如被占用可在 `app.py` 末尾修改
- **跨域**：已启用 CORS，前端无需额外配置
- **首次请求可能较慢**：模型加载在首次调用时完成（或服务启动时），后续请求延迟在 1~3s 内
- **超时建议**：前端 fetch 超时设 30s，覆盖极端网络情况
- **图片格式**：建议前端在上传前做尺寸压缩（最长边 ≤1024px），可大幅降低传输耗时且不影响识别精度
