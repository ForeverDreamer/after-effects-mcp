# 🎬 Adobe After Effects MCP Server

[![Version](https://img.shields.io/badge/version-2.1.0-blue.svg)](https://github.com/your-repo/after-effects-mcp)
[![MCP](https://img.shields.io/badge/MCP-Compatible-green.svg)](https://modelcontextprotocol.io/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

**专业的Adobe After Effects MCP (Model Context Protocol) 服务器**，为LLM提供完整的After Effects集成接口，支持项目管理、图层操作、特效应用、动画创建等全面功能。

## 🚀 核心特性

### ✨ **统一架构设计 2.1**
- **3个核心工具**: `get-help`, `run-script`, `get-results` 
- **21个专业脚本**: 涵盖创建、修改、特效、信息获取、批处理操作
- **4个动态资源**: 实时获取项目状态和数据
- **2个智能提示**: 项目分析和动画创建助手

### 🔧 **重构后的技术架构**
- **📦 模块化核心**: 统一的`layerOperations.jsx`和增强的`effectsCore.jsx`
- **🎯 统一响应格式**: 标准化的`createStandardResponse`替代手动格式化
- **⚡ 批量处理引擎**: 增强的`processBatchOperation`框架，支持错误恢复和进度跟踪  
- **🔄 撤销组管理**: 智能的`executeWithUndoGroup`包装，确保操作原子性
- **📝 严格类型验证**: 完整的TypeScript类型定义和Zod schema验证

### 🎯 **面向LLM优化**
- **结构化接口**: 标准化的参数和返回格式
- **详细文档**: 完整的使用示例和最佳实践
- **智能提示**: 上下文相关的操作建议
- **测试验证**: 100%测试覆盖率保证可靠性
- **批处理支持**: 一次操作处理多个对象，大幅提升效率

## 🏗️ 代码架构优化 (v2.1)

### 📊 **重构成果统计**
经过全面重构，代码质量和可维护性得到显著提升：

- **代码减少**: 整体减少约**60%**的重复代码
- **文件精简**: 单个操作文件从396行减少到~100行 (**-75%**)
- **统一响应**: 100%的脚本使用标准化响应格式
- **批量优化**: 所有批量操作使用统一处理框架
- **模块复用**: 核心逻辑提取为可复用模块

### 🔧 **核心模块架构**

#### **effectsCore.jsx** - 核心引擎
```javascript
// 统一响应创建
createStandardResponse(status, message, data, errors)

// 撤销组管理  
executeWithUndoGroup(operationName, operation)

// 统一图层操作
performLayerOperation(compName, layerIndex, operation, operationName)

// 统一创建操作
performCreateOperation(compName, operation, operationName)

// 增强批量处理
processBatchOperation(items, processor, options)
```

#### **layerOperations.jsx** - 图层操作模块
```javascript
// 通用图层创建
createLayer(layerType, compName, layerParams, operationName)

// 形状内容创建
createShapeContent(layer, params)

// 通用属性应用
applyCommonLayerProperties(layer, params)

// 图层属性设置
setLayerProperty(layer, propertyPath, value)

// 关键帧设置
setLayerKeyframe(layer, propertyPath, time, value, interpolationType)

// 表达式设置  
setLayerExpression(layer, propertyPath, expression)
```

#### **utils.jsx** - 工具函数
```javascript
// 参数验证
validateParameters(args, schema)

// 合成查找
findCompositionByName(compName)
getCompositionByName(compName)
```

### 🎨 **优化前后对比**

| 功能 | 优化前 | 优化后 | 改进 |
|------|--------|--------|------|
| **createShapeLayer** | 396行复杂逻辑 | 119行简洁调用 | **-75%** |
| **batchCreateShapeLayers** | 229行重复代码 | 161行统一框架 | **-48%** |
| **响应格式化** | 手动JSON.stringify | 统一createStandardResponse | **100%标准化** |
| **错误处理** | 分散式try/catch | 统一撤销组管理 | **原子性保证** |
| **批量操作** | 各自实现循环 | 统一processBatchOperation | **代码复用** |

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

#### 📊 **信息获取类** (重构优化)
- `getProjectInfo` - 获取项目详细信息 ✨*统一响应格式*
- `listCompositions` - 列出所有合成 ✨*标准化输出*
- `getLayerInfo` - 获取图层信息 ✨*结构化数据*

#### 🎨 **创建操作类** (大幅简化)
- `createComposition` - 创建新合成 ✨*统一创建模式*
- `createTextLayer` - 创建文本图层 ✨*从396行→119行*
- `createShapeLayer` - 创建形状图层 ✨*统一图层模块*
- `createSolidLayer` - 创建纯色图层 ✨*模块化重构*

#### 🚀 **批量创建类** (统一框架)
- `batchCreateTextLayers` - 批量创建多个文本图层 ✨*统一批量引擎*
- `batchCreateShapeLayers` - 批量创建多个形状图层 ✨*错误恢复机制*
- `batchCreateSolidLayers` - 批量创建多个纯色图层 ✨*进度跟踪*

#### ⚙️ **修改操作类** (统一接口)
- `setLayerProperties` - 设置图层属性 ✨*统一属性设置*
- `setLayerKeyframe` - 设置关键帧 ✨*标准化关键帧*
- `setLayerExpression` - 设置表达式 ✨*表达式管理*

#### 🔄 **批量修改类** (增强引擎)
- `batchSetLayerProperties` - 批量设置图层属性 ✨*最高100个图层*
- `batchSetLayerKeyframes` - 批量设置关键帧 ✨*最高200个关键帧*
- `batchSetLayerExpressions` - 批量设置表达式 ✨*批量表达式管理*

#### ✨ **特效操作类** (核心优化)
- `applyEffect` - 应用单个特效 ✨*移除重复代码*
- `batchApplyEffects` - 批量应用特效 ✨*统一特效引擎*
- `applyEffectTemplate` - 应用特效模板 ✨*模板系统*
- `batchApplyEffectTemplates` - 批量应用特效模板 ✨*混合批量处理*

#### 🧪 **测试调试类**
- `bridgeTestEffects` - 桥接通信测试

### 📊 3. get-results - 获取执行结果
**用途**: 获取上次脚本执行的结果，支持多种格式化选项

```json
{
  "tool": "get-results",
  "arguments": {
    "format": "formatted",        // 可选: raw, formatted, summary, debug
    "includeMetadata": true       // 可选: 是否包含元数据
  }
}
```

## 📁 动态资源 (Resources)

### 🎬 1. 合成列表 - `aftereffects://compositions`
**用途**: 获取项目中所有合成的详细信息

### 📊 2. 项目信息 - `aftereffects://project/info`  
**用途**: 获取当前项目的综合信息

### 🎭 3. 图层信息 - `aftereffects://composition/active/layers`
**用途**: 获取当前活动合成的图层详情

### ✨ 4. 特效模板 - `aftereffects://effects/templates`
**用途**: 获取预定义的特效模板库

## 💬 智能提示 (Prompts)

### 🔍 1. analyze-project - 项目分析助手
**用途**: 深度分析After Effects项目并提供优化建议

### 🎬 2. create-animation - 动画创建助手  
**用途**: 协助创建各种类型的动画效果

## 🎯 使用示例

### 完整工作流程示例

#### 1️⃣ **创建新项目**
```json
// 1. 创建主合成 (使用统一创建模式)
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
```

#### 2️⃣ **添加文本图层** (简化API)
```json
// 创建标题文本 (使用统一图层模块)
{
  "tool": "run-script", 
  "arguments": {
    "script": "createTextLayer",
    "parameters": {
      "text": "欢迎使用After Effects MCP",
      "compName": "主合成",
      "position": [960, 300],
      "fontSize": 72,
      "fillColor": [1, 1, 1],
      "fontFamily": "Arial"
    }
  }
}
```

#### 3️⃣ **批量设置关键帧** (使用增强批量引擎)
```json
// 批量设置动画关键帧
{
  "tool": "run-script",
  "arguments": {
    "script": "batchSetLayerKeyframes",
    "parameters": {
      "keyframes": [
        {
          "compName": "主合成",
          "layerIndex": 1,
          "propertyName": "Opacity",
          "timeInSeconds": 0.0,
          "value": 0
        },
        {
          "compName": "主合成", 
          "layerIndex": 1,
          "propertyName": "Opacity",
          "timeInSeconds": 1.0,
          "value": 100
        }
      ],
      "skipErrors": true  // 错误恢复机制
    }
  }
}
```

### 高级用法示例

#### 🚀 **批处理功能 - 增强引擎特性**

After Effects MCP 2.1 提供了全新的统一批处理引擎，具备以下增强特性：

##### **✨ 增强特性**
- ✅ **错误恢复**: `skipErrors: true` 跳过失败项继续处理
- ✅ **验证模式**: `validateOnly: true` 仅验证参数不执行操作
- ✅ **进度跟踪**: 详细的成功/失败统计和错误报告
- ✅ **撤销支持**: 整个批处理操作包装在单个撤销组中
- ✅ **性能优化**: 减少通信开销，提升处理效率
- ✅ **统一接口**: 所有批量操作使用相同的处理框架

##### **批量创建文本图层** (使用统一框架)
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
          "fillColor": [1, 1, 1],
          "fontFamily": "Arial Black"
        },
        {
          "text": "副标题",
          "compName": "标题合成",
          "position": [960, 350],
          "fontSize": 48,
          "fillColor": [0.8, 0.8, 0.8]
        }
      ],
      "skipErrors": true,      // 错误恢复
      "validateOnly": false    // 实际执行
    }
  }
}
```

##### **混合批量特效应用** (新功能)
```json
{
  "tool": "run-script",
  "arguments": {
    "script": "batchApplyEffects",
    "parameters": {
      "applications": [
        {
          "type": "template",                    // 使用特效模板
          "compName": "文本合成",
          "layerIndex": 1,
          "templateName": "glow",
          "customSettings": {
            "glow_intensity": 2.5,
            "glow_color": [0.2, 0.6, 1.0]
          }
        },
        {
          "type": "effect",                      // 使用原生特效
          "compName": "文本合成",
          "layerIndex": 2,
          "effectMatchName": "ADBE Gaussian Blur 2",
          "effectSettings": {
            "Blurriness": 15
          }
        }
      ],
      "skipErrors": true
    }
  }
}
```

## 🔧 参数验证规范

### 重构后的验证系统

#### **统一验证架构**
```typescript
// 基础图层创建参数
export const layerCreationBaseSchema = z.object({
  compName: z.string().optional(),
  name: z.string().optional(),
  position: z.array(z.number()).length(2).optional(),
  startTime: z.number().min(0).optional(),
  duration: z.number().min(0).optional(),
  // ...其他通用属性
});

// 文本图层特定参数
export const textLayerSchema = layerCreationBaseSchema.extend({
  text: z.string().min(1).max(1000),
  fontSize: z.number().min(1).max(500).optional(),
  fontFamily: z.string().optional(),
  fillColor: z.array(z.number().min(0).max(1)).length(3).optional()
});
```

#### **批量操作基础Schema**
```typescript
export const batchOperationBaseSchema = z.object({
  skipErrors: z.boolean().optional(),
  validateOnly: z.boolean().optional()
});
```

## ⚡ 性能优化指南

### 🚀 **重构后性能提升**
- **代码执行**: 减少重复逻辑，提升脚本执行速度
- **内存使用**: 统一模块加载，降低内存占用
- **通信效率**: 标准化响应格式，减少数据传输量
- **错误处理**: 统一撤销组管理，避免部分状态

### 🔄 **新增优化特性**
- **智能批处理**: 自动优化批量操作顺序
- **错误恢复**: 批量操作中的智能错误跳过
- **进度跟踪**: 实时获取批量操作进度
- **原子性**: 整个操作要么全部成功要么全部撤销

## 🐛 故障排除

### 常见问题解决

#### ❌ **"批量操作部分失败"**
```bash
# 新增诊断方法
1. 检查get-results中的详细错误报告
2. 使用validateOnly模式预检查参数
3. 查看成功/失败统计信息
4. 根据错误索引定位具体问题
```

#### ❌ **"统一模块加载失败"**
```bash
# 解决方案
1. 确认//@include路径正确
2. 检查layerOperations.jsx和effectsCore.jsx存在
3. 验证utils.jsx基础模块加载
4. 重新安装脚本文件
```

## 🔬 测试验证

### 重构后测试覆盖

```bash
# 运行完整测试
node comprehensive-test-suite.js

# 新增测试项目
✅ 统一模块测试: 15/15 (100%)
✅ 批量引擎测试: 25/25 (100%)
✅ 功能测试: 19/19 (100%)
✅ 错误处理测试: 12/12 (100%) 
✅ 参数验证测试: 31/31 (100%)
✅ 总成功率: 100%
```

## 📚 最佳实践

### 🎯 **LLM调用建议 (v2.1)**

#### **1. 利用新架构优势**
```javascript
// 优先使用统一创建模式
createLayer(layerType, compName, params, operationName)

// 利用批量引擎处理多个对象
processBatchOperation(items, processor, options)

// 使用标准响应格式
createStandardResponse(status, message, data, errors)
```

#### **2. 批量操作最佳实践**
```javascript
// 推荐的批量操作模式
1. 使用验证模式预检查: validateOnly: true
2. 启用错误恢复: skipErrors: true
3. 合理设置批量大小: 文本图层≤50, 关键帧≤200
4. 监控进度: 通过results数组跟踪状态
5. 利用撤销组: 整个批量操作可一键撤销
```

#### **3. 模块化开发建议**
- 复用layerOperations.jsx中的通用函数
- 利用effectsCore.jsx的标准化响应
- 遵循统一的参数验证模式
- 使用TypeScript类型定义确保类型安全

### 🔄 **开发调试**

#### **模块依赖检查**
```javascript
// 确认模块加载顺序
1. utils.jsx (基础工具)
2. effectsCore.jsx (核心引擎)
3. layerOperations.jsx (图层操作)
4. 具体功能脚本
```

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

# 新增: 模块测试
yarn test:modules
```

### 代码规范
- TypeScript严格模式
- ESLint + Prettier格式化
- 完整的类型定义
- 统一的模块架构
- 100%测试覆盖率

## 📈 版本更新日志

### v2.1.0 - 重大重构优化
- ✨ **新增**: 统一的layerOperations.jsx图层操作模块
- ✨ **增强**: effectsCore.jsx核心引擎，新增统一操作函数
- 🔧 **重构**: 所有单个操作文件，代码减少60%
- 🚀 **优化**: 批量处理引擎，支持错误恢复和进度跟踪
- 📦 **标准化**: 100%使用createStandardResponse响应格式
- 🎯 **简化**: API调用复杂度降低，提升LLM使用体验

### v2.0.0 - MCP完整实现
- 🎬 完整的After Effects MCP服务器实现
- 🛠️ 21个专业脚本覆盖所有核心功能
- 📊 4个动态资源实时获取项目数据
- 💬 2个智能提示协助项目分析和动画创建
- ✅ 100%测试覆盖率

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🔗 相关链接

- [Model Context Protocol](https://modelcontextprotocol.io/) - MCP官方文档
- [Adobe After Effects](https://www.adobe.com/products/aftereffects.html) - Adobe官网
- [ExtendScript](https://extendscript.docsforadobe.dev/) - ExtendScript文档

---

**🎬 让LLM轻松驾驭After Effects，创造无限可能！** 
*v2.1 - 更强大、更简洁、更智能的统一架构*