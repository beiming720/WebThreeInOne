# 花卉识别后端接口文档

## 项目概述

为 `RecognitionView.vue` 花卉识别页面提供后端推理服务。后端加载 CNN 模型对用户上传的花卉图片进行分类，返回识别结果。

**模型文件**: `flower_model_cnn.pth`（PyTorch CNN 模型权重）
**类别文件**: `classes.txt`（花卉类别名称，每行一个类别）

---

## 1. 花卉识别接口

### 1.1 接口信息

| 项目 | 内容 |
|------|------|
| 接口路径 | `POST /api/flower/identify` |
| 请求方式 | `POST` |
| Content-Type | `multipart/form-data` |
| 超时时间 | 30s |

### 1.2 请求参数

| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| `image` | File | 是 | 花卉图片文件，支持 JPG/PNG/WEBP，大小 ≤10MB |

### 1.3 成功响应

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "name": "向日葵",
    "latin": "Helianthus annuus",
    "confidence": 96.35,
    "desc": "向日葵是菊科向日葵属的一年生草本植物，因花序随太阳转动而得名。原产北美洲，花期夏秋，种子可食用，富含不饱和脂肪酸。"
  }
}
```

| 字段 | 类型 | 说明 |
|------|------|------|
| `code` | int | 状态码，0 表示成功 |
| `message` | string | 状态描述 |
| `data.name` | string | 识别出的花卉中文名称（从 classes.txt 读取对应的中文名） |
| `data.latin` | string | 花卉拉丁学名 |
| `data.confidence` | float | 置信度，范围 0~100，精确到 2 位小数 |
| `data.desc` | string | 花卉简介描述文字 |

### 1.4 错误响应

#### 未上传图片
```json
{
  "code": 1001,
  "message": "请上传图片文件",
  "data": null
}
```

#### 文件格式不支持
```json
{
  "code": 1002,
  "message": "仅支持 JPG、PNG、WEBP 格式的图片",
  "data": null
}
```

#### 文件过大
```json
{
  "code": 1003,
  "message": "图片文件大小不能超过 10MB",
  "data": null
}
```

#### 识别失败
```json
{
  "code": 2001,
  "message": "花卉识别失败，请重试",
  "data": null
}
```

#### 服务器内部错误
```json
{
  "code": 5000,
  "message": "服务器内部错误",
  "data": null
}
```

---

## 2. 错误码表

| 状态码 | HTTP 状态码 | 说明 |
|--------|------------|------|
| 0 | 200 | 成功 |
| 1001 | 400 | 未上传图片文件 |
| 1002 | 400 | 文件格式不支持 |
| 1003 | 400 | 文件大小超限 |
| 2001 | 422 | 模型推理失败 |
| 5000 | 500 | 服务器内部错误 |

---

## 3. 后端实现方案

### 3.1 技术栈推荐

| 层级 | 技术 | 说明 |
|------|------|------|
| Web 框架 | Flask 或 FastAPI | FastAPI 支持异步，更适合高并发 |
| 深度学习 | PyTorch | 加载 `.pth` 模型 |
| 图像处理 | Pillow / torchvision | 图片预处理（缩放、归一化） |
| 跨域 | flask-cors / FastAPI CORSMiddleware | 解决前后端跨域问题 |

### 3.2 项目结构

```
backend/
├── app.py                 # Flask/FastAPI 主入口
├── model/
│   ├── flower_model_cnn.pth   # CNN 模型权重文件
│   ├── classes.txt            # 花卉类别名称文件
│   └── flower_info.json       # 花卉详细信息（名称、拉丁名、描述）
├── inference.py           # 模型推理逻辑
├── requirements.txt       # Python 依赖
└── uploads/               # 临时上传目录（可选）
```

### 3.3 依赖安装

```
# requirements.txt
flask==3.1.0
flask-cors==5.0.1
torch==2.6.0
torchvision==0.21.0
Pillow==11.1.0
```

### 3.4 模型推理实现

```python
# inference.py
import torch
import torch.nn as nn
from torchvision import transforms
from PIL import Image
import json
import os

# ---------- 模型定义（需与训练时的网络结构一致） ----------
class FlowerCNN(nn.Module):
    def __init__(self, num_classes):
        super(FlowerCNN, self).__init__()
        self.features = nn.Sequential(
            nn.Conv2d(3, 64, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),

            nn.Conv2d(64, 128, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),

            nn.Conv2d(128, 256, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),

            nn.Conv2d(256, 512, kernel_size=3, padding=1),
            nn.ReLU(inplace=True),
            nn.MaxPool2d(2),
        )
        self.classifier = nn.Sequential(
            nn.AdaptiveAvgPool2d((1, 1)),
            nn.Flatten(),
            nn.Linear(512, 256),
            nn.ReLU(inplace=True),
            nn.Dropout(0.5),
            nn.Linear(256, num_classes),
        )

    def forward(self, x):
        x = self.features(x)
        x = self.classifier(x)
        return x


# ---------- 图片预处理 ----------
transform = transforms.Compose([
    transforms.Resize((224, 224)),       # 缩放到模型输入尺寸
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],     # ImageNet 均值
        std=[0.229, 0.224, 0.225]       # ImageNet 标准差
    ),
])


# ---------- 加载资源 ----------
MODEL_DIR = os.path.join(os.path.dirname(__file__), 'model')

# 加载类别名称
with open(os.path.join(MODEL_DIR, 'classes.txt'), 'r', encoding='utf-8') as f:
    CLASS_NAMES = [line.strip() for line in f.readlines()]

# 加载花卉详细信息（name, latin, desc）
with open(os.path.join(MODEL_DIR, 'flower_info.json'), 'r', encoding='utf-8') as f:
    FLOWER_INFO = json.load(f)

# 加载模型
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = FlowerCNN(num_classes=len(CLASS_NAMES))
model.load_state_dict(torch.load(
    os.path.join(MODEL_DIR, 'flower_model_cnn.pth'),
    map_location=device
))
model.to(device)
model.eval()


# ---------- 推理函数 ----------
def predict(image: Image.Image) -> dict:
    """
    对输入的 PIL Image 进行花卉分类推理

    Args:
        image: PIL Image 对象（RGB 模式）

    Returns:
        {
            "name": str,        # 中文名称
            "latin": str,       # 拉丁学名
            "confidence": float,# 置信度 0~100
            "desc": str,        # 简介描述
        }
    """
    # 预处理
    img_tensor = transform(image).unsqueeze(0).to(device)  # (1, 3, 224, 224)

    # 推理
    with torch.no_grad():
        outputs = model(img_tensor)
        probabilities = torch.nn.functional.softmax(outputs, dim=1)
        confidence, predicted = torch.max(probabilities, 1)

    class_idx = predicted.item()
    confidence_val = round(confidence.item() * 100, 2)
    class_name = CLASS_NAMES[class_idx]

    # 查找花卉详细信息
    info = FLOWER_INFO.get(class_name, {})

    return {
        "name": info.get("name", class_name),
        "latin": info.get("latin", ""),
        "confidence": confidence_val,
        "desc": info.get("desc", ""),
    }
```

### 3.5 Flask 主入口实现

```python
# app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import io

from inference import predict

app = Flask(__name__)
CORS(app)  # 允许跨域

ALLOWED_EXTENSIONS = {'jpg', 'jpeg', 'png', 'webp'}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


def allowed_file(filename: str) -> bool:
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route('/api/flower/identify', methods=['POST'])
def identify():
    # 1. 校验文件是否存在
    if 'image' not in request.files:
        return jsonify({"code": 1001, "message": "请上传图片文件", "data": None}), 400

    file = request.files['image']
    if file.filename == '':
        return jsonify({"code": 1001, "message": "请上传图片文件", "data": None}), 400

    # 2. 校验文件格式
    if not allowed_file(file.filename):
        return jsonify({
            "code": 1002,
            "message": "仅支持 JPG、PNG、WEBP 格式的图片",
            "data": None
        }), 400

    # 3. 校验文件大小
    file.seek(0, 2)  # 移到文件末尾
    size = file.tell()
    file.seek(0)     # 回到开头
    if size > MAX_FILE_SIZE:
        return jsonify({
            "code": 1003,
            "message": "图片文件大小不能超过 10MB",
            "data": None
        }), 400

    # 4. 读取并识别
    try:
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        result = predict(image)
        return jsonify({"code": 0, "message": "success", "data": result})
    except Exception as e:
        app.logger.error(f"识别失败: {str(e)}")
        return jsonify({
            "code": 2001,
            "message": "花卉识别失败，请重试",
            "data": None
        }), 422


@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"code": 0, "message": "ok"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
```

### 3.6 FastAPI 主入口实现（备选）

```python
# app_fastapi.py
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from PIL import Image
import io

from inference import predict

app = FastAPI(title="花卉识别API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_TYPES = {"image/jpeg", "image/png", "image/webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024


@app.post("/api/flower/identify")
async def identify(image: UploadFile = File(...)):
    # 校验文件格式
    if image.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail={"code": 1002, "message": "仅支持 JPG、PNG、WEBP 格式的图片", "data": None}
        )

    # 读取并校验大小
    image_bytes = await image.read()
    if len(image_bytes) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail={"code": 1003, "message": "图片文件大小不能超过 10MB", "data": None}
        )

    try:
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        result = predict(img)
        return {"code": 0, "message": "success", "data": result}
    except Exception as e:
        raise HTTPException(
            status_code=422,
            detail={"code": 2001, "message": f"识别失败: {str(e)}", "data": None}
        )


@app.get("/api/health")
async def health():
    return {"code": 0, "message": "ok"}
```

---

## 4. flower_info.json 格式

`model/flower_info.json` 存储每种花卉的详细信息：

```json
{
  "向日葵": {
    "name": "向日葵",
    "latin": "Helianthus annuus",
    "desc": "向日葵是菊科向日葵属的一年生草本植物，因花序随太阳转动而得名。原产北美洲，花期夏秋，种子可食用，富含不饱和脂肪酸。"
  },
  "玫瑰": {
    "name": "玫瑰",
    "latin": "Rosa rugosa",
    "desc": "玫瑰是蔷薇科蔷薇属的直立灌木，原产中国，花色丰富，香气浓郁，是世界著名的观赏和香料植物。"
  },
  "郁金香": {
    "name": "郁金香",
    "latin": "Tulipa gesneriana",
    "desc": "郁金香是百合科郁金香属的多年生球根花卉，原产地中海沿岸及中亚，花型优雅，色彩艳丽，是荷兰国花。"
  }
}
```

> **注意**: `flower_info.json` 中的 key 必须与 `classes.txt` 中每一行的类别名称完全一致。

---

## 5. classes.txt 格式

每行一个花卉类别名称，行尾无空格：

```
向日葵
玫瑰
郁金香
牡丹
梅花
菊花
兰花
荷花
樱花
桃花
...
```

> **注意**: `classes.txt` 中的类别名称必须与 `flower_info.json` 的 key 一致。

---

## 6. 前端对接代码

`RecognitionView.vue` 中的 `identify()` 函数修改为实际 API 调用：

```typescript
async function identify() {
  if (!previewUrl.value) return
  loading.value = true
  result.value = null

  try {
    // 将 base64 预览图转为 Blob
    const res = await fetch(previewUrl.value)
    const blob = await res.blob()

    // 构建 FormData
    const formData = new FormData()
    formData.append('image', blob, 'flower.jpg')

    // 调用后端接口
    const response = await fetch('http://localhost:5000/api/flower/identify', {
      method: 'POST',
      body: formData,
    })

    const json = await response.json()

    if (json.code === 0) {
      result.value = json.data
    } else {
      // 错误提示
      console.error('识别失败:', json.message)
      alert(json.message || '识别失败，请重试')
    }
  } catch (err) {
    console.error('网络错误:', err)
    alert('网络请求失败，请检查后端服务是否启动')
  } finally {
    loading.value = false
  }
}
```

---

## 7. 启动方式

```bash
# 1. 安装依赖
cd backend
pip install -r requirements.txt

# 2. 确保模型文件和类别文件就位
# backend/
#   model/
#     flower_model_cnn.pth
#     classes.txt
#     flower_info.json

# 3. 启动 Flask 服务
python app.py          # Flask
# 或
uvicorn app_fastapi:app --host 0.0.0.0 --port 5000   # FastAPI

# 4. 验证服务
curl http://localhost:5000/api/health
# 返回: {"code": 0, "message": "ok"}

# 5. 测试识别接口
curl -X POST http://localhost:5000/api/flower/identify \
  -F "image=@test_flower.jpg"
```

---

## 8. 部署建议

| 环境 | 方案 |
|------|------|
| 开发环境 | Flask 自带服务器，`debug=True` 热重载 |
| 生产环境 | Gunicorn + Flask 或 uvicorn + FastAPI，配合 Nginx 反向代理 |
| GPU 推理 | 服务器安装 CUDA 版 PyTorch，`device = cuda` 自动启用 GPU |
| Docker | 构建包含模型文件的镜像，`EXPOSE 5000` |

### Dockerfile 示例

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 5000
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```
