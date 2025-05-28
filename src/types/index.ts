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

// ========== 验证Schemas ==========

export const baseLayerSchema = z.object({
  compIndex: z.number().int().positive().describe("Composition index in project (starting from 1)"),
  layerIndex: z.number().int().positive().describe("Layer index in composition (starting from 1)")
});

export const positionSchema = z.array(z.number()).min(2).max(3).describe("Position coordinates [x, y] or [x, y, z]");
export const colorSchema = z.array(z.number().min(0).max(1)).length(3).describe("RGB color values [r, g, b], range 0-1");

// ========== 工具参数类型 ==========

export const helpToolSchema = z.object({
  topic: z.enum(["setup", "tools", "effects", "animation", "troubleshooting", "performance", "all"])
    .optional()
    .describe("Specific help topic (default: all)"),
  language: z.enum(["zh", "en"]).optional().describe("Help language (default: zh)")
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

export const createCompositionSchema = z.object({
  name: z.string().min(1).describe("Composition name"),
  width: z.number().int().positive().max(8192).optional().describe("Width (pixels, default: 1920)"),
  height: z.number().int().positive().max(8192).optional().describe("Height (pixels, default: 1080)"),
  pixelAspect: z.number().positive().optional().describe("Pixel aspect ratio (default: 1.0)"),
  duration: z.number().positive().max(3600).optional().describe("Duration (seconds, default: 10.0)"),
  frameRate: z.number().positive().max(120).optional().describe("Frame rate (fps, default: 30.0)"),
  backgroundColor: z.object({
    r: z.number().int().min(0).max(255),
    g: z.number().int().min(0).max(255), 
    b: z.number().int().min(0).max(255)
  }).optional().describe("Background color (RGB value 0-255)"),
  preset: z.enum(["custom", "HD_1080", "4K_UHD", "HD_720", "NTSC", "PAL", "Instagram_Square", "YouTube_16x9"])
    .optional()
    .describe("Use preset size (override width/height settings)")
});

export const setLayerKeyframeSchema = z.object({
  ...baseLayerSchema.shape,
  propertyName: z.enum(["Position", "Scale", "Rotation", "Opacity", "Anchor Point"])
    .describe("Property name to set keyframe for"),
  timeInSeconds: z.number().min(0).describe("Keyframe time (seconds)"),
  value: z.any().describe("Keyframe value"),
  easing: z.enum(["linear", "ease-in", "ease-out", "ease-in-out"])
    .optional().describe("Easing type (default: linear)")
});

export const setLayerExpressionSchema = z.object({
  ...baseLayerSchema.shape,
  propertyName: z.enum(["Position", "Scale", "Rotation", "Opacity", "Anchor Point"])
    .describe("Property name to apply expression for"),
  expressionString: z.string().describe("JavaScript expression string, empty string to remove expression"),
  validate: z.boolean().optional().describe("Whether to validate expression syntax (default: true)")
});

export const batchApplyEffectsSchema = z.object({
  compIndex: z.number().int().positive().describe("Composition index"),
  layerIndices: z.array(z.number().int().positive()).describe("Target layer index array"),
  effectTemplate: z.string().optional().describe("Effect template name"),
  effectMatchName: z.string().optional().describe("After Effects internal name for the effect"),
  effectSettings: z.record(z.any()).optional().describe("Effect parameter settings"),
  skipErrors: z.boolean().optional().describe("Skip errors and continue processing other layers (default: true)")
});

export const applyEffectSchema = z.object({
  ...baseLayerSchema.shape,
  effectName: z.string().optional().describe("Display name of the effect to apply"),
  effectMatchName: z.string().optional().describe("After Effects internal name for the effect"),
  effectSettings: z.record(z.any()).optional().describe("Optional parameters for the effect"),
  waitForResult: z.boolean().optional().describe("Whether to wait for the result and return it directly (default: false)")
});

export const applyEffectTemplateSchema = z.object({
  ...baseLayerSchema.shape,
  templateName: z.enum([
    "gaussian-blur", "directional-blur", "color-balance", "brightness-contrast",
    "glow", "drop-shadow", "cinematic-look", "text-enhancement"
  ]).describe("Name of the effect template to apply"),
  customSettings: z.record(z.any()).optional().describe("Optional custom settings to override defaults"),
  waitForResult: z.boolean().optional().describe("Whether to wait for the result and return it directly (default: false)")
});

// ========== 提示模板参数类型（修复为仅支持字符串类型） ==========

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
}

export interface AllowedScripts {
  [key: string]: ScriptInfo;
} 