import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { MCPError, MCPToolResponse, AllowedScripts } from "../types/index.js";

// ========== 常量定义 ==========

// 使用更兼容的方式获取目录路径
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const SCRIPTS_DIR = path.join(__dirname, "../scripts");
export const TEMP_DIR = path.join(__dirname, "../temp");

// ========== 辅助函数 ==========

export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const getCommandFilePath = () => path.join(process.env.TEMP || process.env.TMP || '', 'ae_command.json');
export const getResultFilePath = () => path.join(process.env.TEMP || process.env.TMP || '', 'ae_mcp_result.json');

/**
 * Safe JSON parsing
 */
export function safeParseJSON(content: string): { success: boolean; data?: any; error?: string } {
  try {
    return { success: true, data: JSON.parse(content) };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

// ========== 文件管理器 ==========

export class FileManager {
  static writeJSON(filePath: string, data: any): void {
    try {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      throw new MCPError(`Failed to write file: ${filePath}`, 'FILE_WRITE_ERROR', error);
    }
  }

  static readJSON(filePath: string): any {
    try {
      if (!fs.existsSync(filePath)) {
        throw new MCPError(`File does not exist: ${filePath}`, 'FILE_NOT_FOUND');
      }
      const content = fs.readFileSync(filePath, 'utf8');
      const result = safeParseJSON(content);
      if (!result.success) {
        throw new MCPError(`JSON parsing failed: ${result.error}`, 'JSON_PARSE_ERROR');
      }
      return result.data;
    } catch (error) {
      if (error instanceof MCPError) throw error;
      throw new MCPError(`Failed to read file: ${filePath}`, 'FILE_READ_ERROR', error);
    }
  }

  static getFileAge(filePath: string): number {
    try {
      const stats = fs.statSync(filePath);
      return Date.now() - stats.mtime.getTime();
    } catch {
      return Infinity;
    }
  }
}

// ========== After Effects 命令管理器 ==========

export class AECommandManager {
  private static readonly RESULT_TIMEOUT = 30000; // 30 second timeout
  private static readonly STALE_THRESHOLD = 30000; // 30 seconds considered stale

  /**
   * Write command to temporary file
   */
  static writeCommand(command: string, args: Record<string, any> = {}): void {
    const commandData = {
      command,
      args,
      timestamp: new Date().toISOString(),
      status: "pending"
    };
    
    FileManager.writeJSON(getCommandFilePath(), commandData);
    console.error(`✅ Command "${command}" written to temporary file`);
  }

  /**
   * Clear results file
   */
  static clearResults(): void {
    const resetData = {
      status: "waiting",
      message: "Waiting for After Effects to execute new command...",
      timestamp: new Date().toISOString()
    };
    
    FileManager.writeJSON(getResultFilePath(), resetData);
    console.error(`🧹 Results file cleared`);
  }

  /**
   * Read execution results
   */
  static readResults(): { success: boolean; data?: any; warning?: string; error?: string } {
    try {
      const resultPath = getResultFilePath();
      
      if (!fs.existsSync(resultPath)) {
        return {
          success: false,
          error: "Results file does not exist. Please ensure After Effects is running and MCP Bridge Auto panel is open."
        };
      }

      const fileAge = FileManager.getFileAge(resultPath);
      const result = FileManager.readJSON(resultPath);

      // Check if file is stale
      if (fileAge > this.STALE_THRESHOLD) {
        return {
          success: false,
          warning: "Results file may be stale, After Effects may not have updated results correctly.",
          data: result
        };
      }

      return { success: true, data: result };
    } catch (error) {
      return {
        success: false,
        error: error instanceof MCPError ? error.message : String(error)
      };
    }
  }

  /**
   * Execute command and wait for results
   */
  static async executeCommand(command: string, args: Record<string, any> = {}, waitTime = 2000): Promise<any> {
    this.clearResults();
    this.writeCommand(command, args);
    
    await delay(waitTime);
    
    const result = this.readResults();
    if (!result.success) {
      throw new MCPError(result.error || "Command execution failed", 'COMMAND_EXECUTION_ERROR');
    }
    
    return result.data;
  }
}

// ========== 响应格式化器 ==========

export class ResponseFormatter {
  static success(message: string, data?: any): MCPToolResponse {
    const response = `✅ ${message}`;
    const formattedData = data ? `\n\n📊 **Details:**\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\`` : '';
    
    return {
      content: [{
        type: "text",
        text: response + formattedData
      }],
      _meta: {}
    };
  }

  static error(message: string, troubleshooting?: string[]): MCPToolResponse {
    let response = `❌ **Error:** ${message}`;
    
    if (troubleshooting) {
      response += `\n\n🔧 **Troubleshooting suggestions:**\n${troubleshooting.map(tip => `• ${tip}`).join('\n')}`;
    }
    
    return {
      content: [{
        type: "text",
        text: response
      }],
      isError: true,
      _meta: {}
    };
  }

  static info(title: string, content: string, extraInfo?: Record<string, any>): MCPToolResponse {
    let response = `ℹ️ **${title}**\n\n${content}`;
    
    if (extraInfo) {
      response += `\n\n📋 **Additional info:**\n${Object.entries(extraInfo).map(([key, value]) => `• **${key}:** ${value}`).join('\n')}`;
    }
    
    return {
      content: [{
        type: "text",
        text: response
      }],
      _meta: {}
    };
  }

  static queuedCommand(command: string, params?: Record<string, any>): MCPToolResponse {
    const paramText = params && Object.keys(params).length > 0 
      ? `\n\n📁 **Parameters:** \`\`\`json\n${JSON.stringify(params, null, 2)}\n\`\`\``
      : '';
    
    return {
      content: [{
        type: "text",
        text: `✅ Command "${command}" has been queued for execution${paramText}\n\n` +
              `📋 **Next steps:**\n` +
              `1. Ensure After Effects is running\n` +
              `2. Ensure "MCP Bridge Auto" panel is open\n` +
              `3. Wait a few seconds for execution to complete\n` +
              `4. Use the "get-results" tool to view execution results`
      }],
      _meta: {}
    };
  }
}

// ========== 参数验证器 ==========

export class ParameterValidator {
  static validatePosition(position: number[]): boolean {
    return Array.isArray(position) && position.length >= 2 && position.length <= 3 && 
           position.every(coord => typeof coord === 'number' && !isNaN(coord));
  }

  static validateScale(scale: number[]): boolean {
    return Array.isArray(scale) && scale.length >= 2 && scale.length <= 3 && 
           scale.every(s => typeof s === 'number' && s > 0);
  }

  static validateOpacity(opacity: number): boolean {
    return typeof opacity === 'number' && opacity >= 0 && opacity <= 100;
  }

  static validateRotation(rotation: number): boolean {
    return typeof rotation === 'number' && !isNaN(rotation);
  }

  static validateColor(color: number[]): boolean {
    return Array.isArray(color) && color.length === 3 && 
           color.every(c => typeof c === 'number' && c >= 0 && c <= 1);
  }

  static validateDimensions(width: number, height: number): { valid: boolean; error?: string } {
    if (width <= 0 || height <= 0) {
      return { valid: false, error: "Width and height must be greater than 0" };
    }
    if (width > 8192 || height > 8192) {
      return { valid: false, error: "Recommended not to exceed 8192x8192 pixels to avoid performance issues" };
    }
    return { valid: true };
  }
}

// ========== Refactored Script Configuration (v2.1) ==========

export const allowedScripts: AllowedScripts = {
  // ========== Information Retrieval (Refactored & Optimized) ==========
  "listCompositions": { 
    description: "List all compositions in the project", 
    category: "project",
    estimatedTime: "Quick",
    newFeatures: ["Unified response format", "Standardized output"]
  },
  "getProjectInfo": { 
    description: "Get project detailed information", 
    category: "project",
    estimatedTime: "Quick",
    newFeatures: ["Structured data", "Unified response format"]
  },
  "getLayerInfo": { 
    description: "Get current composition layer information", 
    category: "layers",
    estimatedTime: "Medium",
    newFeatures: ["Structured data", "Unified formatting"]
  },
  
  // ========== Creation Operations (Dramatically Simplified) ==========
  "createComposition": { 
    description: "Create new composition", 
    category: "creation",
    requiredParams: ["name"],
    estimatedTime: "Quick",
    newFeatures: ["Unified creation pattern", "Standardized parameter validation"]
  },
  "createTextLayer": { 
    description: "Create text layer (396→119 lines, -75%)", 
    category: "creation",
    requiredParams: ["text"],
    estimatedTime: "Quick",
    newFeatures: ["Unified layer module", "Simplified API", "75% code reduction"]
  },
  "createShapeLayer": { 
    description: "Create shape layer (modular refactor)", 
    category: "creation",
    estimatedTime: "Quick",
    newFeatures: ["Unified layer module", "Standardized creation", "Shape content optimization"]
  },
  "createSolidLayer": { 
    description: "Create solid layer (modular refactor)", 
    category: "creation",
    estimatedTime: "Quick",
    newFeatures: ["Unified layer module", "Property standardization"]
  },
  
  // ========== Batch Creation (Unified Framework) ==========
  "batchCreateTextLayers": {
    description: "Batch create multiple text layers (unified batch engine)",
    category: "batch-creation",
    requiredParams: ["textLayers"],
    estimatedTime: "Medium",
    newFeatures: ["Unified batch engine", "Error recovery", "Progress tracking", "Undo support"]
  },
  "batchCreateShapeLayers": {
    description: "Batch create multiple shape layers (error recovery)",
    category: "batch-creation", 
    requiredParams: ["shapeLayers"],
    estimatedTime: "Medium",
    newFeatures: ["Unified batch framework", "Validation mode", "Performance optimization"]
  },
  "batchCreateSolidLayers": {
    description: "Batch create multiple solid layers (progress tracking)",
    category: "batch-creation",
    requiredParams: ["solidLayers"],
    estimatedTime: "Medium",
    newFeatures: ["Batch processing engine", "Error skipping", "Atomic operations"]
  },
  
  // ========== Modification Operations (Unified Interface) ==========
  "setLayerProperties": { 
    description: "Set layer properties (unified property setting)", 
    category: "modification",
    estimatedTime: "Quick",
    newFeatures: ["Unified layer operations", "Standardized property setting", "Enhanced validation"]
  },
  "setLayerKeyframe": { 
    description: "Set keyframe (standardized keyframes)", 
    category: "animation",
    estimatedTime: "Quick",
    newFeatures: ["Unified keyframe API", "Interpolation type support", "Time validation"]
  },
  "setLayerExpression": { 
    description: "Set expression (expression management)", 
    category: "animation",
    estimatedTime: "Quick",
    newFeatures: ["Expression validation", "Unified setting interface", "Error handling"]
  },
  
  // ========== Batch Modification (Enhanced Engine) ==========
  "batchSetLayerProperties": {
    description: "Batch set layer properties (up to 100 layers)",
    category: "batch-modification",
    requiredParams: ["layerProperties"],
    estimatedTime: "Medium",
    newFeatures: ["Enhanced batch engine", "High-capacity processing", "Mixed property support"]
  },
  "batchSetLayerKeyframes": {
    description: "Batch set keyframes (up to 200 keyframes)",
    category: "batch-animation",
    requiredParams: ["keyframes"],
    estimatedTime: "Long",
    newFeatures: ["Large-scale keyframes", "Batch animation", "Performance optimization"]
  },
  "batchSetLayerExpressions": {
    description: "Batch set expressions (batch expression management)",
    category: "batch-animation",
    requiredParams: ["expressions"],
    estimatedTime: "Medium",
    newFeatures: ["Expression batch processing", "Validation mode", "Error recovery"]
  },
  
  // ========== Effects Operations (Core Optimization) ==========
  "applyEffect": { 
    description: "Apply single effect (removed duplicate code)", 
    category: "effects",
    estimatedTime: "Medium",
    newFeatures: ["Core effects engine", "Unified settings application", "Enhanced error handling"]
  },
  "applyEffectTemplate": { 
    description: "Apply effect template (template system)", 
    category: "effects",
    estimatedTime: "Medium",
    newFeatures: ["Preset template library", "Custom settings", "Template validation"]
  },
  "batchApplyEffects": { 
    description: "Batch apply effects (unified effects engine)", 
    category: "effects",
    requiredParams: ["compName", "layerIndices"],
    estimatedTime: "Long",
    newFeatures: ["Batch effects processing", "Efficiency optimization", "Error skipping"]
  },
  "batchApplyEffectTemplates": {
    description: "Batch apply effect templates (mixed batch processing)",
    category: "batch-effects",
    requiredParams: ["effectApplications"],
    estimatedTime: "Long",
    newFeatures: ["Mixed batch processing", "Template & effect combination", "Intelligent application"]
  },
  
  // ========== Testing & Debugging ==========
  "test-animation": { 
    description: "Test animation functionality", 
    category: "testing",
    estimatedTime: "Quick",
    newFeatures: ["Architecture compatibility testing"]
  },
  "bridgeTestEffects": { 
    description: "Test MCP bridge communication", 
    category: "testing",
    estimatedTime: "Quick",
    newFeatures: ["New architecture communication test", "Module loading verification"]
  }
}; 