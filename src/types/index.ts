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
}

export interface AllowedScripts {
  [key: string]: ScriptInfo;
} 