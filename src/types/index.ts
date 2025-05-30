import { z } from "zod";

// ========== 基础类型定义 ==========

export interface MCPToolResponse {
  [x: string]: unknown;
  content: Array<{
    [x: string]: unknown;
    type: "text";
    text: string;
  }>;
  isError?: boolean;
  _meta?: { [x: string]: unknown };
}

export interface MCPResourceResponse {
  [x: string]: unknown;
  contents: Array<{
    [x: string]: unknown;
    text: string;
    uri: string;
    mimeType?: string;
  } | {
    [x: string]: unknown;
    uri: string;
    blob: string;
    mimeType?: string;
  }>;
  _meta?: { [x: string]: unknown } | undefined;
}

export interface MCPPromptMessage {
  [x: string]: unknown;
  role: "user";
  content: {
    [x: string]: unknown;
    type: "text";
    text: string;
  };
}

export interface MCPPromptResponse {
  [x: string]: unknown;
  messages: MCPPromptMessage[];
}

// ========== 错误类型 ==========

export class MCPError extends Error {
  constructor(message: string, public code?: string, public details?: any) {
    super(message);
    this.name = 'MCPError';
  }
}

// ========== 重构后的统一响应类型 ==========

export interface StandardResponse {
  status: "success" | "error" | "partial";
  message: string;
  [key: string]: any;
  errors?: string[];
}

export interface BatchOperationResult {
  status: "success" | "error" | "partial";
  message: string;
  totalItems: number;
  successful: number;
  failed: number;
  results: Array<{
    index: number;
    config: any;
    status: "success" | "error" | "valid" | "pending";
    result?: any;
    error?: string;
  }>;
  errors: Array<{
    index: number;
    config: any;
    error: string;
  }>;
}

export interface LayerInfo {
  name: string;
  index: number;
  type: "shape" | "text" | "solid" | "footage" | "adjustment" | "camera" | "light";
  enabled?: boolean;
  startTime?: number;
  outPoint?: number;
  position?: number[];
  scale?: number[];
  rotation?: number;
  opacity?: number;
}

// ========== 核心工具验证Schemas ==========

export const helpToolSchema = z.object({
  topic: z.enum(["setup", "tools", "effects", "animation", "troubleshooting", "performance", "all"])
    .optional()
    .describe("Specific help topic (default: all)")
});

export const runScriptSchema = z.object({
  script: z.string().describe("Script name to execute"),
  parameters: z.record(z.any()).optional().describe("Script parameters (optional)"),
  waitForResult: z.boolean().optional().describe("Whether to wait and return result directly (default: false)"),
  timeout: z.number().min(1000).max(30000).optional().describe("Timeout time (milliseconds, default: 5000)")
});

export const getResultsSchema = z.object({
  format: z.enum(["raw", "formatted", "summary", "debug"]).optional().describe("Result display format (default: formatted)"),
  includeMetadata: z.boolean().optional().describe("Whether to include metadata information (default: true)")
});

// ========== 统一图层操作参数类型 ==========

export const layerCreationBaseSchema = z.object({
  compName: z.string().optional().describe("合成名称（空字符串使用活动合成）"),
  name: z.string().optional().describe("图层名称"),
  position: z.array(z.number()).length(2).optional().describe("位置坐标 [x, y]"),
  startTime: z.number().min(0).optional().describe("开始时间（秒）"),
  duration: z.number().min(0).optional().describe("持续时间（秒）"),
  scale: z.array(z.number()).length(2).optional().describe("缩放 [x, y]"),
  rotation: z.number().optional().describe("旋转角度"),
  opacity: z.number().min(0).max(100).optional().describe("透明度"),
  anchorPoint: z.array(z.number()).length(2).optional().describe("锚点 [x, y]")
});

export const textLayerSchema = layerCreationBaseSchema.extend({
  text: z.string().min(1).max(1000).describe("文本内容"),
  fontSize: z.number().min(1).max(500).optional().describe("字体大小"),
  fontFamily: z.string().optional().describe("字体家族"),
  fillColor: z.array(z.number().min(0).max(1)).length(3).optional().describe("文字颜色 [r, g, b]")
});

export const shapeLayerSchema = layerCreationBaseSchema.extend({
  shapeType: z.enum(["rectangle", "ellipse", "polygon", "star"]).describe("形状类型"),
  size: z.array(z.number()).length(2).optional().describe("尺寸 [width, height]"),
  fillColor: z.array(z.number().min(0).max(1)).length(3).optional().describe("填充颜色 [r, g, b]"),
  strokeColor: z.array(z.number().min(0).max(1)).length(3).optional().describe("描边颜色 [r, g, b]"),
  strokeWidth: z.number().min(0).max(100).optional().describe("描边宽度"),
  points: z.number().min(3).max(20).optional().describe("点数（多边形/星形）")
});

export const solidLayerSchema = layerCreationBaseSchema.extend({
  color: z.array(z.number().min(0).max(1)).length(3).describe("纯色颜色 [r, g, b]"),
  width: z.number().min(0).max(8192).optional().describe("宽度"),
  height: z.number().min(0).max(8192).optional().describe("高度"),
  pixelAspect: z.number().min(0.1).max(10.0).optional().describe("像素长宽比")
});

// ========== 批量操作参数类型 ==========

export const batchOperationBaseSchema = z.object({
  skipErrors: z.boolean().optional().describe("是否跳过错误继续处理"),
  validateOnly: z.boolean().optional().describe("仅验证参数而不执行操作")
});

export const batchTextLayersSchema = batchOperationBaseSchema.extend({
  textLayers: z.array(textLayerSchema).min(1).max(50).describe("文本图层配置数组")
});

export const batchShapeLayersSchema = batchOperationBaseSchema.extend({
  shapeLayers: z.array(shapeLayerSchema).min(1).max(50).describe("形状图层配置数组")
});

export const batchSolidLayersSchema = batchOperationBaseSchema.extend({
  solidLayers: z.array(solidLayerSchema).min(1).max(50).describe("纯色图层配置数组")
});

// ========== 图层属性操作类型 ==========

export const layerPropertySchema = z.object({
  compName: z.string().describe("合成名称"),
  layerIndex: z.number().min(1).optional().describe("图层索引"),
  layerName: z.string().optional().describe("图层名称"),
  position: z.array(z.number()).length(2).optional(),
  scale: z.array(z.number()).length(2).optional(),
  rotation: z.number().optional(),
  opacity: z.number().min(0).max(100).optional(),
  text: z.string().optional().describe("文本内容（文本图层）"),
  fontSize: z.number().optional().describe("字体大小（文本图层）"),
  fillColor: z.array(z.number().min(0).max(1)).length(3).optional().describe("文字颜色（文本图层）")
});

export const batchLayerPropertiesSchema = batchOperationBaseSchema.extend({
  layerProperties: z.array(layerPropertySchema).min(1).max(100).describe("图层属性配置数组")
});

// ========== 关键帧操作类型 ==========

export const keyframeSchema = z.object({
  compName: z.string().describe("合成名称"),
  layerIndex: z.number().min(1).max(1000).describe("图层索引"),
  propertyName: z.enum(["Position", "Scale", "Rotation", "Opacity", "Anchor Point"]).describe("属性名称"),
  timeInSeconds: z.number().min(0).max(3600).describe("时间点（秒）"),
  value: z.union([z.number(), z.array(z.number())]).describe("属性值"),
  interpolationType: z.enum(["linear", "bezier", "hold"]).optional().describe("插值类型")
});

export const batchKeyframesSchema = batchOperationBaseSchema.extend({
  keyframes: z.array(keyframeSchema).min(1).max(200).describe("关键帧配置数组")
});

// ========== 表达式操作类型 ==========

export const expressionSchema = z.object({
  compName: z.string().describe("合成名称"),
  layerIndex: z.number().min(1).max(1000).describe("图层索引"),
  propertyName: z.string().describe("属性名称"),
  expressionString: z.string().describe("表达式代码（空字符串移除表达式）")
});

export const batchExpressionsSchema = batchOperationBaseSchema.extend({
  expressions: z.array(expressionSchema).min(1).max(100).describe("表达式配置数组")
});

// ========== 特效操作类型 ==========

export const effectApplicationSchema = z.object({
  compName: z.string().describe("合成名称"),
  layerIndex: z.number().min(1).max(1000).describe("图层索引"),
  effectName: z.string().optional().describe("特效显示名称"),
  effectMatchName: z.string().optional().describe("特效内部名称"),
  presetPath: z.string().optional().describe("预设文件路径"),
  effectSettings: z.record(z.any()).optional().describe("特效参数设置")
});

export const effectTemplateApplicationSchema = z.object({
  templateName: z.string().describe("特效模板名称"),
  compName: z.string().describe("合成名称"),
  layerIndex: z.number().min(1).max(1000).describe("图层索引"),
  customSettings: z.record(z.any()).optional().describe("自定义设置覆盖")
});

export const batchEffectsSchema = batchOperationBaseSchema.extend({
  applications: z.array(z.union([
    effectApplicationSchema.extend({ type: z.literal("effect") }),
    effectTemplateApplicationSchema.extend({ type: z.literal("template") })
  ])).min(1).max(100).describe("特效应用配置数组")
});

// ========== 提示模板参数类型 ==========

export const analyzeProjectPromptSchema = z.object({
  analysisType: z.enum(["structure", "performance", "optimization", "comprehensive"])
    .describe("Analysis type"),
  includeRecommendations: z.string().optional().describe("Whether to include improvement suggestions (yes/no)")
});

export const createAnimationPromptSchema = z.object({
  animationType: z.enum(["text", "logo", "transition", "ui", "motion-graphics"])
    .describe("Animation type"),
  style: z.string().describe("Animation style description"),
  duration: z.string().optional().describe("Animation duration in seconds"),
  complexity: z.enum(["simple", "moderate", "complex"]).optional().describe("Complexity")
});

// ========== 脚本信息类型 ==========

export interface ScriptInfo {
  description: string;
  category: string;
  estimatedTime: string;
  requiredParams?: string[];
  newFeatures?: string[];
}

export interface AllowedScripts {
  [key: string]: ScriptInfo;
}

// ========== 模块架构类型 ==========

export interface ModuleInfo {
  name: string;
  description: string;
  dependencies: string[];
  functions: string[];
  optimizations?: string[];
} 