# 🎬 Adobe After Effects MCP Server

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/your-repo/after-effects-mcp)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**专业的Adobe After Effects MCP (Model Context Protocol) 服务器**，为LLM提供完整的After Effects集成接口，支持项目管理、图层操作、特效应用、动画创建等全面功能。

## 🚀 核心特性

### ✨ **统一架构设计**
- **3个核心工具**: `get-help`, `run-script`, `get-results` 
- **21个专业脚本**: 涵盖创建、修改、特效、信息获取、批处理操作
- **4个动态资源**: 实时获取项目状态和数据
- **2个智能提示**: 项目分析和动画创建助手

### 🔧 **技术架构**
- **统一参数验证**: 严格的类型检查和范围验证
- **模块化设计**: `//@include` 方式整合所有功能
- **异步通信**: 基于临时文件的可靠通信机制
- **错误处理**: 完整的错误捕获和友好提示
- **批处理引擎**: 高效的批量操作处理框架

### 🎯 **面向LLM优化**
- **结构化接口**: 标准化的参数和返回格式
- **详细文档**: 完整的使用示例和最佳实践
- **智能提示**: 上下文相关的操作建议
- **测试验证**: 100%测试覆盖率保证可靠性
- **批处理支持**: 一次操作处理多个对象，大幅提升效率

## 📦 安装配置

### 前置要求
- **Adobe After Effects 2021+** (已测试 2021-2024)
- **Node.js v18+** 
- **PowerShell 7+** (Windows) 或 **Bash** (macOS/Linux)

### 快速开始

```bash
# 1. 克隆项目
git clone https://github.com/your-repo/after-effects-mcp.git
cd after-effects-mcp

# 2. 安装依赖
yarn install

# 3. 构建项目
yarn build

# 4. 安装After Effects脚本
yarn install-bridge

# 5. 启动服务器
yarn start
```

### After Effects配置

1. **启动After Effects**
2. **打开脚本面板**: `Window > mcp-bridge-auto.jsx`
3. **保持面板打开**: 该面板是通信桥梁，必须保持运行状态
4. **验证连接**: 面板会显示"Ready - Auto-run is ON"

## 🛠️ 核心工具 (Tools)

### 📋 1. get-help - 获取帮助
**用途**: 获取详细的使用指南和文档

```json
{
  "tool": "get-help",
  "arguments": {
    "topic": "setup"  // 可选: setup, tools, effects, animation, troubleshooting, performance, all
  }
}
```

**返回内容**:
- 完整的安装配置指南
- 详细的工具和脚本说明  
- 使用示例和最佳实践
- 故障排除和性能优化

### 🎯 2. run-script - 统一脚本执行
**用途**: 执行所有After Effects操作的统一入口

```json
{
  "tool": "run-script", 
  "arguments": {
    "script": "createComposition",
    "parameters": {
      "name": "My Composition",
      "width": 1920,
      "height": 1080,
      "frameRate": 30.0,
      "duration": 10.0
    },
    "waitForResult": false,  // 可选: 是否等待并直接返回结果
    "timeout": 5000         // 可选: 超时时间(毫秒)
  }
}
```

**支持的脚本列表**:

#### 📊 **信息获取类**
- `getProjectInfo` - 获取项目详细信息
- `listCompositions` - 列出所有合成
- `getLayerInfo` - 获取图层信息

#### 🎨 **创建操作类**  
- `createComposition` - 创建新合成
- `createTextLayer` - 创建文本图层
- `createShapeLayer` - 创建形状图层
- `createSolidLayer` - 创建纯色图层

#### 🚀 **批量创建类**
- `batchCreateTextLayers` - 批量创建多个文本图层
- `batchCreateShapeLayers` - 批量创建多个形状图层
- `batchCreateSolidLayers` - 批量创建多个纯色图层

#### ⚙️ **修改操作类**
- `setLayerProperties` - 设置图层属性
- `setLayerKeyframe` - 设置关键帧
- `setLayerExpression` - 设置表达式

#### 🔄 **批量修改类**
- `batchSetLayerProperties` - 批量设置图层属性
- `batchSetLayerKeyframes` - 批量设置关键帧
- `batchSetLayerExpressions` - 批量设置表达式

#### ✨ **特效操作类**
- `applyEffect` - 应用单个特效
- `batchApplyEffects` - 批量应用特效
- `applyEffectTemplate` - 应用特效模板
- `batchApplyEffectTemplates` - 批量应用特效模板

#### 🧪 **测试调试类**
- `bridgeTestEffects` - 桥接通信测试

### 📊 3. get-results - 获取执行结果
**用途**: 获取上次脚本执行的结果

```json
{
  "tool": "get-results",
  "arguments": {
    "format": "formatted",        // 可选: raw, formatted, summary, debug
    "includeMetadata": true       // 可选: 是否包含元数据
  }
}
```

**格式说明**:
- `formatted`: 格式化的JSON输出 (默认)
- `summary`: 简洁的摘要信息
- `raw`: 原始数据输出
- `debug`: 调试详细信息

## 📁 动态资源 (Resources)

### 🎬 1. 合成列表 - `aftereffects://compositions`
**用途**: 获取项目中所有合成的详细信息

```json
{
  "resource": "aftereffects://compositions"
}
```

**返回数据结构**:
```json
{
  "compositions": [
    {
      "id": 1,
      "name": "Main Comp",
      "width": 1920,
      "height": 1080,
      "duration": 10.0,
      "frameRate": 30.0,
      "numLayers": 5,
      "pixelAspect": 1.0,
      "bgColor": [0, 0, 0]
    }
  ],
  "summary": {
    "totalCompositions": 3,
    "totalDuration": 30.5,
    "averageFrameRate": 30.0
  }
}
```

### 📊 2. 项目信息 - `aftereffects://project/info`
**用途**: 获取当前项目的综合信息

```json
{
  "resource": "aftereffects://project/info"
}
```

**返回数据包含**:
- 项目基本信息 (名称、路径、保存状态)
- 项目设置 (颜色深度、线性混合)
- 素材统计 (合成、素材、文件夹数量)
- 系统信息 (可选)

### 🎭 3. 图层信息 - `aftereffects://composition/active/layers`
**用途**: 获取当前活动合成的图层详情

```json
{
  "resource": "aftereffects://composition/active/layers"
}
```

**图层信息包含**:
- 基本属性 (名称、类型、启用状态)
- 时间属性 (入点、出点、开始时间)  
- 变换属性 (位置、缩放、旋转、透明度)
- 特效列表 (如果存在)
- 文本内容 (文本图层)

### ✨ 4. 特效模板 - `aftereffects://effects/templates`
**用途**: 获取预定义的特效模板库

**模板分类**:

#### **基础特效模板**
```json
{
  "basic": {
    "gaussian-blur": {
      "description": "高斯模糊 - 创建柔和模糊效果",
      "category": "blur",
      "matchName": "ADBE Gaussian Blur 2",
      "parameters": {
        "blurriness": {
          "type": "number",
          "default": 20,
          "range": [0, 1000],
          "unit": "pixels"
        }
      },
      "performance": "Medium"
    }
  }
}
```

#### **复合特效模板**
```json
{
  "composite": {
    "cinematic-look": {
      "description": "电影级调色 - 专业色彩分级效果组合",
      "category": "color-grading", 
      "effects": [
        {"matchName": "ADBE CurvesCustom"},
        {"matchName": "ADBE Vibrance"},
        {"matchName": "ADBE Vignette"}
      ],
      "performance": "High"
    }
  }
}
```

#### **动画预设模板**
```json
{
  "animation": {
    "fade-in-up": {
      "description": "上滑淡入动画",
      "type": "keyframe-preset",
      "properties": {
        "Opacity": [
          {"time": 0, "value": 0},
          {"time": 1, "value": 100}
        ],
        "Position": [
          {"time": 0, "value": [0, 50], "relative": true},
          {"time": 1, "value": [0, 0], "relative": true}
        ]
      }
    }
  }
}
```

## 💬 智能提示 (Prompts)

### 🔍 1. analyze-project - 项目分析助手
**用途**: 深度分析After Effects项目并提供优化建议

```json
{
  "prompt": "analyze-project",
  "arguments": {
    "analysisType": "comprehensive",        // structure, performance, optimization, comprehensive
    "includeRecommendations": "yes"        // yes/no
  }
}
```

**分析类型**:
- `structure`: 项目结构分析
- `performance`: 性能评估  
- `optimization`: 优化建议
- `comprehensive`: 综合分析 (推荐)

**输出内容**:
- 📊 项目概览 (合成数量、图层复杂度、效果使用)
- 🔍 详细分析 (结构层次、资源利用、性能要点)
- 💡 优化建议 (结构优化、性能改进、工作流建议)

### 🎬 2. create-animation - 动画创建助手  
**用途**: 协助创建各种类型的动画效果

```json
{
  "prompt": "create-animation",
  "arguments": {
    "animationType": "text",                // text, logo, transition, ui, motion-graphics
    "style": "modern fade-in with bounce", 
    "duration": "2.5",                     // 可选: 持续时间(秒)
    "complexity": "moderate"               // 可选: simple, moderate, complex
  }
}
```

**动画类型**:
- `text`: 文字动画 (出现、消失、动态效果)
- `logo`: 标志动画 (品牌展示、标识效果)
- `transition`: 转场动画 (场景切换、过渡效果)  
- `ui`: UI动画 (界面元素效果)
- `motion-graphics`: 动态图形 (复合图形动画)

**输出指导**:
- 🎬 动画分解 (关键步骤拆解)
- 🛠️ 图层规划 (所需图层类型和结构)
- ⏱️ 关键帧设置 (主要关键帧时间点和数值)
- ✨ 特效应用 (推荐特效和参数设置)
- 🚀 优化建议 (性能优化和最佳实践)

## 🎯 使用示例

### 完整工作流程示例

#### 1️⃣ **创建新项目**
```json
// 1. 创建主合成
{
  "tool": "run-script",
  "arguments": {
    "script": "createComposition",
    "parameters": {
      "name": "主合成",
      "width": 1920,
      "height": 1080,
      "frameRate": 30.0,
      "duration": 10.0,
      "backgroundColor": {"r": 0, "g": 0, "b": 0}
    }
  }
}

// 2. 获取执行结果
{
  "tool": "get-results",
  "arguments": {"format": "formatted"}
}
```

#### 2️⃣ **添加文本图层**
```json
// 创建标题文本
{
  "tool": "run-script", 
  "arguments": {
    "script": "createTextLayer",
    "parameters": {
      "text": "欢迎使用After Effects MCP",
      "compName": "主合成",
      "position": [960, 300],
      "fontSize": 72,
      "color": [1, 1, 1],
      "fontFamily": "Arial",
      "alignment": "center"
    }
  }
}
```

#### 3️⃣ **应用动画效果**
```json
// 设置透明度关键帧
{
  "tool": "run-script",
  "arguments": {
    "script": "setLayerKeyframe", 
    "parameters": {
      "compName": "主合成",
      "layerIndex": 1,
      "propertyName": "Opacity",
      "timeInSeconds": 0.0,
      "value": 0
    }
  }
}

// 设置结束透明度
{
  "tool": "run-script",
  "arguments": {
    "script": "setLayerKeyframe",
    "parameters": {
      "compName": "主合成", 
      "layerIndex": 1,
      "propertyName": "Opacity",
      "timeInSeconds": 1.0,
      "value": 100
    }
  }
}
```

#### 4️⃣ **应用特效模板**
```json
// 应用发光效果
{
  "tool": "run-script",
  "arguments": {
    "script": "applyEffectTemplate",
    "parameters": {
      "templateName": "glow",
      "compName": "主合成",
      "layerIndex": 1,
      "customSettings": {
        "glow_intensity": 2.0,
        "glow_color": [0.2, 0.6, 1.0]
      }
    }
  }
}
```

#### 5️⃣ **项目分析优化**
```json
// 获取项目分析
{
  "prompt": "analyze-project",
  "arguments": {
    "analysisType": "comprehensive",
    "includeRecommendations": "yes"
  }
}
```

### 高级用法示例

#### 🚀 **批处理功能 - 高效批量操作**

After Effects MCP 提供强大的批处理功能，支持一次性处理多个对象，大幅提升工作效率：

##### **批量创建文本图层**
```json
{
  "tool": "run-script",
  "arguments": {
    "script": "batchCreateTextLayers",
    "parameters": {
      "textLayers": [
        {
          "text": "主标题",
          "compName": "标题合成",
          "position": [960, 200],
          "fontSize": 72,
          "color": [1, 1, 1],
          "fontFamily": "Arial Black"
        },
        {
          "text": "副标题",
          "compName": "标题合成",
          "position": [960, 350],
          "fontSize": 48,
          "color": [0.8, 0.8, 0.8]
        },
        {
          "text": "描述文字",
          "compName": "标题合成",
          "position": [960, 450],
          "fontSize": 32,
          "color": [0.6, 0.6, 0.6]
        }
      ],
      "skipErrors": true
    }
  }
}
```

##### **批量设置关键帧动画**
```json
{
  "tool": "run-script",
  "arguments": {
    "script": "batchSetLayerKeyframes",
    "parameters": {
      "keyframes": [
        {
          "compName": "动画合成",
          "layerIndex": 1,
          "propertyName": "Opacity",
          "timeInSeconds": 0,
          "value": 0
        },
        {
          "compName": "动画合成",
          "layerIndex": 1,
          "propertyName": "Opacity",
          "timeInSeconds": 1,
          "value": 100
        },
        {
          "compName": "动画合成",
          "layerIndex": 2,
          "propertyName": "Position",
          "timeInSeconds": 0,
          "value": [100, 540]
        },
        {
          "compName": "动画合成",
          "layerIndex": 2,
          "propertyName": "Position",
          "timeInSeconds": 2,
          "value": [1820, 540]
        }
      ],
      "skipErrors": true
    }
  }
}
```

##### **批量应用特效模板**
```json
{
  "tool": "run-script",
  "arguments": {
    "script": "batchApplyEffectTemplates",
    "parameters": {
      "effectApplications": [
        {
          "templateName": "glow",
          "compName": "文本合成",
          "layerIndex": 1,
          "customSettings": {
            "glow_intensity": 2.5,
            "glow_color": [0.2, 0.6, 1.0]
          }
        },
        {
          "templateName": "drop-shadow",
          "compName": "文本合成",
          "layerIndex": 1,
          "customSettings": {
            "shadow_distance": 8,
            "shadow_opacity": 75
          }
        },
        {
          "templateName": "cinematic-look",
          "compName": "色彩合成",
          "layerIndex": 2
        }
      ],
      "skipErrors": true
    }
  }
}
```

##### **批量设置图层属性**
```json
{
  "tool": "run-script",
  "arguments": {
    "script": "batchSetLayerProperties",
    "parameters": {
      "layerProperties": [
        {
          "compName": "动画合成",
          "layerIndex": 1,
          "position": [300, 200],
          "opacity": 80,
          "scale": [120, 120]
        },
        {
          "compName": "动画合成",
          "layerIndex": 2,
          "position": [700, 200],
          "opacity": 90,
          "rotation": 15
        },
        {
          "compName": "文本合成",
          "layerName": "标题",
          "text": "新标题",
          "fontSize": 72,
          "fillColor": [1, 1, 1]
        }
      ],
      "skipErrors": true
    }
  }
}
```

##### **批处理功能特性**
- ✅ **错误恢复**: `skipErrors: true` 跳过失败项继续处理
- ✅ **验证模式**: `validateOnly: true` 仅验证参数不执行操作
- ✅ **进度跟踪**: 详细的成功/失败统计和错误报告
- ✅ **撤销支持**: 整个批处理操作包装在单个撤销组中
- ✅ **性能优化**: 减少通信开销，提升处理效率

#### 🎨 **传统批量特效应用**
```json
{
  "tool": "run-script",
  "arguments": {
    "script": "batchApplyEffects",
    "parameters": {
      "compName": "主合成",
      "layerIndices": [1, 2, 3],
      "effectTemplate": "Glow",
      "effectSettings": {
        "intensity": 1.5,
        "threshold": 50
      },
      "skipErrors": true
    }
  }
}
```

#### 🔄 **表达式动画**
```json
{
  "tool": "run-script", 
  "arguments": {
    "script": "setLayerExpression",
    "parameters": {
      "compName": "主合成",
      "layerIndex": 1,
      "propertyName": "Position",
      "expressionString": "wiggle(2, 30)"
    }
  }
}
```

#### 📊 **实时数据获取**
```json
// 获取所有合成信息
{
  "resource": "aftereffects://compositions"
}

// 获取当前图层状态
{
  "resource": "aftereffects://composition/active/layers"
}
```

## 🔧 参数验证规范

### 通用验证规则

#### **字符串参数**
- `name`: 1-255字符，必需
- `compName`: 非空字符串，用于标识合成
- `text`: 1-1000字符，文本内容

#### **数值参数**  
- `width`, `height`: 1-8192像素
- `frameRate`: 1-120 fps
- `duration`: 0.1-3600秒
- `layerIndex`: 1-1000 (1开始索引)
- `timeInSeconds`: 0-3600秒

#### **颜色参数**
- RGB格式: `[r, g, b]` (0-1范围)  
- RGBA格式: `[r, g, b, a]` (0-1范围)
- 整数格式: `{"r": 0-255, "g": 0-255, "b": 0-255}`

#### **枚举参数**
- `propertyName`: `["Position", "Scale", "Rotation", "Opacity", "Anchor Point"]`
- `shapeType`: `["rectangle", "ellipse", "polygon", "star"]`
- `alignment`: `["left", "center", "right"]`

### 脚本特定验证

#### **createComposition**
```json
{
  "name": "string (1-255字符, 必需)",
  "width": "number (1-8192, 默认1920)",
  "height": "number (1-8192, 默认1080)", 
  "frameRate": "number (1-120, 默认30.0)",
  "duration": "number (0.1-3600, 默认10.0)",
  "pixelAspect": "number (0.1-10.0, 默认1.0)",
  "backgroundColor": "object {r:0-255, g:0-255, b:0-255}"
}
```

#### **createTextLayer**
```json
{
  "text": "string (1-1000字符, 必需)",
  "compName": "string (默认活动合成)",
  "position": "array [x, y] (默认[960, 540])",
  "fontSize": "number (1-500, 默认72)",
  "color": "array [r, g, b] 0-1范围 (默认[1,1,1])",
  "fontFamily": "string (默认Arial)",
  "alignment": "enum [left,center,right] (默认center)"
}
```

#### **setLayerKeyframe**  
```json
{
  "compName": "string (必需)",
  "layerIndex": "number (1-1000, 必需)",
  "propertyName": "enum [Position,Scale,Rotation,Opacity,Anchor Point] (必需)",
  "timeInSeconds": "number (0-3600, 必需)",
  "value": "number|array (必需, 根据属性类型)"
}
```

## ⚡ 性能优化指南

### 🚀 **执行性能**
- **异步执行**: 默认使用异步模式，提高响应速度
- **批量操作**: 优先使用批量特效应用减少通信开销
- **结果缓存**: 合理利用get-results获取上次执行结果

### 🔄 **通信优化**
- **Keep Alive**: 保持MCP Bridge Auto面板开启
- **超时设置**: 复杂操作适当增加timeout值
- **错误重试**: 失败时检查After Effects状态后重试

### 💾 **内存管理**
- **项目大小**: 监控项目复杂度，必要时分解合成
- **素材优化**: 使用代理素材和预合成优化性能
- **清理缓存**: 定期清理After Effects缓存

## 🐛 故障排除

### 常见问题解决

#### ❌ **"After Effects未响应"**
```bash
# 检查项目
1. 确认After Effects正在运行
2. 检查MCP Bridge Auto面板是否打开
3. 面板显示"Ready - Auto-run is ON"
4. 重启After Effects和MCP服务器
```

#### ❌ **"脚本执行失败"**
```bash
# 诊断步骤
1. 使用get-results查看详细错误信息
2. 检查参数格式和数值范围
3. 确认合成名称和图层索引正确
4. 查看After Effects控制台错误信息
```

#### ❌ **"参数验证失败"**
```bash
# 解决方案
1. 检查必需参数是否提供
2. 确认参数类型匹配schema定义
3. 验证数值范围符合限制
4. 查看get-help获取正确格式
```

#### ❌ **"通信超时"**
```bash
# 优化措施
1. 增加timeout参数值
2. 简化复杂操作，分步执行
3. 检查系统资源占用
4. 重启通信组件
```

## 🔬 测试验证

项目包含完整的测试套件，验证所有功能：

```bash
# 运行完整测试
node comprehensive-test-suite.js

# 测试覆盖
✅ 功能测试: 19/19 (100%)
✅ 错误处理测试: 12/12 (100%) 
✅ 参数验证测试: 31/31 (100%)
✅ 总成功率: 100%
```

## 📚 最佳实践

### 🎯 **LLM调用建议**

#### **1. 标准工作流程**
1. 使用`get-help`了解功能
2. 通过`run-script`执行操作  
3. 用`get-results`获取结果
4. 利用resources获取实时数据
5. 使用prompts进行智能分析

#### **2. 错误处理策略**
```javascript
// 推荐的错误处理模式
1. 执行操作前验证参数
2. 设置合理的超时时间
3. 失败时获取详细错误信息
4. 必要时重试或调整参数
5. 记录操作日志便于调试
```

#### **3. 性能优化技巧**
- 批量操作优于单个操作
- 复杂效果分步骤应用
- 定期检查项目状态
- 合理使用异步模式

### 🔄 **开发调试**

#### **Debug模式**
```json
{
  "tool": "get-results",
  "arguments": {
    "format": "debug",
    "includeMetadata": true
  }
}
```

#### **日志分析**
- MCP Bridge Auto面板显示详细日志
- 临时文件位置: `%TEMP%/ae_*.json`
- After Effects控制台错误信息

## 🤝 贡献指南

### 开发环境设置
```bash
# 开发模式
yarn dev

# 类型检查  
yarn type-check

# 代码格式化
yarn format

# 运行测试
yarn test
```

### 代码规范
- TypeScript严格模式
- ESLint + Prettier格式化
- 完整的类型定义
- 100%测试覆盖率

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP官方文档
- [Adobe After Effects](https://www.adobe.com/products/aftereffects.html) - Adobe官网
- [ExtendScript](https://extendscript.docsforadobe.dev/) - ExtendScript文档

---

**🎬 让LLM轻松驾驭After Effects，创造无限可能！** 

## 🚀 详细脚本说明

### 📊 **信息获取类脚本**

#### `getProjectInfo` - 获取项目详细信息
**功能**: 获取当前After Effects项目的完整信息
**参数**: 
```json
{
  "includeItems": true,          // 是否包含项目素材列表
  "maxItems": 50,               // 最大返回素材数量 (1-1000)
  "includeCompositions": false, // 是否包含合成详细信息
  "includeSystemInfo": false    // 是否包含系统信息
}
```

#### `listCompositions` - 列出所有合成
**功能**: 获取项目中所有合成的列表和基本信息
**参数**:
```json
{
  "includeDetails": true,  // 包含详细信息
  "sortBy": "name"        // 排序方式: name, duration, created, size
}
```

#### `getLayerInfo` - 获取图层信息
**功能**: 获取指定合成中的图层详细信息
**参数**:
```json
{
  "compName": "",              // 合成名称，空字符串使用活动合成
  "includeDetails": true,      // 包含详细图层属性
  "includeTransform": false,   // 包含变换属性值
  "layerTypes": []            // 过滤图层类型: text, shape, solid, footage, adjustment, camera, light
}
```

### 🎨 **创建操作类脚本**

#### `createComposition` - 创建新合成
**功能**: 创建新的After Effects合成
**必需参数**: `name` (合成名称)
**可选参数**:
```json
{
  "width": 1920,           // 宽度 (1-8192像素)
  "height": 1080,          // 高度 (1-8192像素)
  "frameRate": 30.0,       // 帧率 (1-120 fps)
  "duration": 10.0,        // 持续时间 (0.1-3600秒)
  "pixelAspect": 1.0,      // 像素长宽比 (0.1-10.0)
  "backgroundColor": {"r": 0, "g": 0, "b": 0}  // 背景颜色
}
```

#### `createTextLayer` - 创建文本图层
**功能**: 在指定合成中创建文本图层
**必需参数**: `text` (文本内容)
**可选参数**:
```json
{
  "compName": "",            // 合成名称，默认使用活动合成
  "position": [960, 540],    // 位置坐标 [x, y]
  "fontSize": 72,            // 字体大小 (1-500)
  "color": [1, 1, 1],       // 文字颜色 [r, g, b] 0-1范围
  "fontFamily": "Arial",     // 字体名称
  "alignment": "center",     // 对齐方式: left, center, right
  "startTime": 0,           // 开始时间 (秒)
  "duration": 5             // 持续时间 (秒)
}
```

#### `createShapeLayer` - 创建形状图层
**功能**: 创建各种几何形状图层
**可选参数**:
```json
{
  "compName": "",              // 合成名称
  "shapeType": "rectangle",    // 形状类型: rectangle, ellipse, polygon, star
  "position": [960, 540],      // 位置坐标
  "size": [200, 200],         // 尺寸 [宽度, 高度]
  "fillColor": [1, 0, 0],     // 填充颜色 [r, g, b]
  "strokeColor": [0, 0, 0],   // 描边颜色
  "strokeWidth": 0,           // 描边宽度 (0-100)
  "points": 5,                // 多边形/星形点数 (3-20)
  "name": "Shape Layer"       // 图层名称
}
```

#### `createSolidLayer` - 创建纯色图层
**功能**: 创建纯色背景或调整图层
**可选参数**:
```json
{
  "compName": "",           // 合成名称
  "color": [1, 1, 1],      // 颜色 [r, g, b]
  "name": "Solid Layer",   // 图层名称
  "position": [960, 540],  // 位置坐标
  "size": [1920, 1080],   // 尺寸，默认合成尺寸
  "isAdjustment": false   // 是否创建为调整图层
}
```

### 🚀 **批量创建类脚本**

#### `batchCreateTextLayers` - 批量创建文本图层
**功能**: 一次性创建多个文本图层，支持不同参数配置
**必需参数**: `textLayers` (文本图层配置数组，1-50个)
**可选参数**: `skipErrors: true`, `validateOnly: false`

**使用示例**:
```json
{
  "script": "batchCreateTextLayers",
  "parameters": {
    "textLayers": [
      {
        "text": "主标题",
        "compName": "标题合成",
        "position": [960, 200],
        "fontSize": 72,
        "color": [1, 1, 1],
        "fontFamily": "Arial Black"
      },
      {
        "text": "副标题", 
        "compName": "标题合成",
        "position": [960, 350],
        "fontSize": 48,
        "color": [0.8, 0.8, 0.8]
      }
    ],
    "skipErrors": true
  }
}
```

#### `batchCreateShapeLayers` - 批量创建形状图层
**功能**: 批量创建不同类型的形状图层
**必需参数**: `shapeLayers` (形状配置数组，1-50个)

**使用示例**:
```json
{
  "script": "batchCreateShapeLayers", 
  "parameters": {
    "shapeLayers": [
      {
        "shapeType": "rectangle",
        "compName": "形状合成",
        "position": [300, 200],
        "size": [200, 100],
        "fillColor": [1, 0, 0],
        "name": "红色矩形"
      },
      {
        "shapeType": "ellipse",
        "position": [700, 200],
        "size": [150, 150], 
        "fillColor": [0, 1, 0],
        "strokeColor": [0, 0, 1],
        "strokeWidth": 5
      }
    ]
  }
}
```

#### `batchCreateSolidLayers` - 批量创建纯色图层
**功能**: 批量创建纯色图层，支持普通图层和调整图层
**必需参数**: `solidLayers` (纯色图层配置数组，1-50个)

**使用示例**:
```json
{
  "script": "batchCreateSolidLayers",
  "parameters": {
    "solidLayers": [
      {
        "compName": "背景合成",
        "color": [0.1, 0.1, 0.1],
        "name": "深色背景",
        "size": [1920, 1080]
      },
      {
        "color": [1, 0, 0],
        "name": "红色调整层",
        "isAdjustment": true
      }
    ]
  }
}
```

### ⚙️ **修改操作类脚本**

#### `setLayerProperties` - 设置图层属性
**功能**: 修改指定图层的各种属性
**必需参数**: `compName` (合成名称)
**图层识别**: `layerName` 或 `layerIndex` 二选一

**可设置属性**:
```json
{
  "position": [x, y],        // 位置
  "scale": [x, y],          // 缩放百分比
  "rotation": 0,            // 旋转角度
  "opacity": 100,           // 透明度 (0-100)
  "text": "新文本",          // 文本内容 (文本图层)
  "fontSize": 72,           // 字体大小 (文本图层)
  "fillColor": [1, 1, 1]    // 文字颜色 (文本图层)
}
```

#### `setLayerKeyframe` - 设置关键帧
**功能**: 为图层属性设置关键帧动画
**必需参数**:
```json
{
  "compName": "合成名称",
  "layerIndex": 1,                    // 图层索引 (1-1000)
  "propertyName": "Opacity",          // 属性名称
  "timeInSeconds": 0,                 // 时间点 (秒)
  "value": 100                        // 属性值
}
```

**支持的属性**: `Position`, `Scale`, `Rotation`, `Opacity`, `Anchor Point`

#### `setLayerExpression` - 设置表达式
**功能**: 为图层属性添加表达式动画
**必需参数**:
```json
{
  "compName": "合成名称",
  "layerIndex": 1,
  "propertyName": "Position",
  "expressionString": "wiggle(2, 30)"  // 表达式代码，空字符串移除表达式
}
```

### 🔄 **批量修改类脚本**

#### `batchSetLayerProperties` - 批量设置图层属性
**功能**: 批量修改多个图层的属性
**必需参数**: `layerProperties` (图层属性配置数组，1-100个)

**使用示例**:
```json
{
  "script": "batchSetLayerProperties",
  "parameters": {
    "layerProperties": [
      {
        "compName": "动画合成",
        "layerIndex": 1,
        "position": [300, 200],
        "opacity": 80,
        "scale": [120, 120]
      },
      {
        "compName": "文本合成", 
        "layerName": "标题",
        "text": "新标题",
        "fontSize": 72,
        "fillColor": [1, 1, 1]
      }
    ]
  }
}
```

#### `batchSetLayerKeyframes` - 批量设置关键帧
**功能**: 批量为多个图层设置关键帧动画
**必需参数**: `keyframes` (关键帧配置数组，1-200个)

**使用示例**:
```json
{
  "script": "batchSetLayerKeyframes",
  "parameters": {
    "keyframes": [
      {
        "compName": "动画合成",
        "layerIndex": 1,
        "propertyName": "Opacity",
        "timeInSeconds": 0,
        "value": 0
      },
      {
        "compName": "动画合成",
        "layerIndex": 1, 
        "propertyName": "Opacity",
        "timeInSeconds": 1,
        "value": 100
      },
      {
        "compName": "动画合成",
        "layerIndex": 2,
        "propertyName": "Position",
        "timeInSeconds": 0,
        "value": [100, 540]
      }
    ]
  }
}
```

#### `batchSetLayerExpressions` - 批量设置表达式
**功能**: 批量为多个图层属性添加表达式
**必需参数**: `expressions` (表达式配置数组，1-100个)

**使用示例**:
```json
{
  "script": "batchSetLayerExpressions",
  "parameters": {
    "expressions": [
      {
        "compName": "动画合成",
        "layerIndex": 1,
        "propertyName": "Position", 
        "expressionString": "wiggle(2, 30)"
      },
      {
        "compName": "动画合成",
        "layerIndex": 2,
        "propertyName": "Rotation",
        "expressionString": "time * 45"
      }
    ]
  }
}
```

### ✨ **特效操作类脚本**

#### `applyEffect` - 应用单个特效
**功能**: 为图层添加单个特效
**必需参数**: `compName`, `layerIndex`
**特效识别**: `effectName`, `effectMatchName` 或 `presetPath` 三选一

#### `batchApplyEffects` - 批量应用特效
**功能**: 为多个图层批量应用相同特效
**必需参数**: `compName`, `layerIndices` (图层索引数组)
**特效识别**: `effectTemplate` 或 `effectMatchName`

#### `applyEffectTemplate` - 应用特效模板
**功能**: 应用预定义的特效模板
**必需参数**: `templateName`
**可选参数**: `compName`, `layerIndex`, `customSettings`

**可用模板**: `gaussian-blur`, `directional-blur`, `color-balance`, `brightness-contrast`, `glow`, `drop-shadow`, `cinematic-look`, `text-pop`

#### `batchApplyEffectTemplates` - 批量应用特效模板
**功能**: 批量为多个图层应用不同的特效模板
**必需参数**: `effectApplications` (特效应用配置数组，1-100个)

**使用示例**:
```json
{
  "script": "batchApplyEffectTemplates",
  "parameters": {
    "effectApplications": [
      {
        "templateName": "glow",
        "compName": "文本合成",
        "layerIndex": 1,
        "customSettings": {
          "glow_intensity": 2.5,
          "glow_color": [0.2, 0.6, 1.0]
        }
      },
      {
        "templateName": "drop-shadow", 
        "compName": "文本合成",
        "layerIndex": 1,
        "customSettings": {
          "shadow_distance": 8,
          "shadow_opacity": 75
        }
      }
    ]
  }
}
```

### 🧪 **测试调试类脚本**

#### `bridgeTestEffects` - 桥接通信测试
**功能**: 测试MCP桥接通信是否正常
**参数**: 无需参数

### 🚀 **批处理功能特性**

所有批处理脚本都支持以下统一特性：

#### **错误处理机制**
- `skipErrors: true` (默认) - 跳过失败项继续处理其他项目
- `skipErrors: false` - 遇到错误立即停止整个批处理操作

#### **验证模式**
- `validateOnly: true` - 仅验证所有参数，不执行实际操作
- `validateOnly: false` (默认) - 执行实际的批处理操作

#### **进度跟踪**
每个批处理操作返回详细的执行结果：
```json
{
  "status": "success",
  "totalItems": 10,
  "successful": 8,
  "failed": 2,
  "results": [...],     // 每个项目的详细结果
  "errors": [...]       // 失败项目的错误信息
}
```

#### **撤销支持**
- 整个批处理操作包装在单个撤销组中
- 可以一键撤销整个批处理操作的所有更改

#### **性能优化**
- 减少MCP通信开销
- 优化After Effects脚本执行效率
- 支持大批量操作 (最高200个关键帧) 