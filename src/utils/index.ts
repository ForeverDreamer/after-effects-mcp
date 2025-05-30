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

// ========== 脚本配置 ==========

export const allowedScripts: AllowedScripts = {
  // Basic operations
  "listCompositions": { 
    description: "List all compositions in the project", 
    category: "project",
    estimatedTime: "Quick"
  },
  "getProjectInfo": { 
    description: "Get project detailed information", 
    category: "project",
    estimatedTime: "Quick"
  },
  "getLayerInfo": { 
    description: "Get current composition layer information", 
    category: "layers",
    estimatedTime: "Medium"
  },
  
  // Creation operations
  "createComposition": { 
    description: "Create new composition", 
    category: "creation",
    requiredParams: ["name"],
    estimatedTime: "Quick"
  },
  "createTextLayer": { 
    description: "Create text layer", 
    category: "creation",
    requiredParams: ["text"],
    estimatedTime: "Quick"
  },
  "createShapeLayer": { 
    description: "Create shape layer", 
    category: "creation",
    estimatedTime: "Quick"
  },
  "createSolidLayer": { 
    description: "Create solid layer", 
    category: "creation",
    estimatedTime: "Quick"
  },
  
  // Batch creation operations
  "batchCreateTextLayers": {
    description: "Batch create multiple text layers",
    category: "batch-creation",
    requiredParams: ["textLayers"],
    estimatedTime: "Medium"
  },
  "batchCreateShapeLayers": {
    description: "Batch create multiple shape layers",
    category: "batch-creation", 
    requiredParams: ["shapeLayers"],
    estimatedTime: "Medium"
  },
  "batchCreateSolidLayers": {
    description: "Batch create multiple solid layers",
    category: "batch-creation",
    requiredParams: ["solidLayers"],
    estimatedTime: "Medium"
  },
  
  // Modification operations
  "setLayerProperties": { 
    description: "Modify layer properties", 
    category: "modification",
    estimatedTime: "Quick"
  },
  "setLayerKeyframe": { 
    description: "Set keyframe", 
    category: "animation",
    estimatedTime: "Quick"
  },
  "setLayerExpression": { 
    description: "Apply expression", 
    category: "animation",
    estimatedTime: "Quick"
  },
  
  // Batch modification operations
  "batchSetLayerProperties": {
    description: "Batch set properties for multiple layers",
    category: "batch-modification",
    requiredParams: ["layerProperties"],
    estimatedTime: "Medium"
  },
  "batchSetLayerKeyframes": {
    description: "Batch set keyframes for multiple layers",
    category: "batch-animation",
    requiredParams: ["keyframes"],
    estimatedTime: "Long"
  },
  "batchSetLayerExpressions": {
    description: "Batch set expressions for multiple layers",
    category: "batch-animation",
    requiredParams: ["expressions"],
    estimatedTime: "Medium"
  },
  
  // Effects operations
  "applyEffect": { 
    description: "Apply effect", 
    category: "effects",
    estimatedTime: "Medium"
  },
  "applyEffectTemplate": { 
    description: "Apply effect template", 
    category: "effects",
    estimatedTime: "Medium"
  },
  "batchApplyEffects": { 
    description: "Batch apply effects to multiple layers", 
    category: "effects",
    requiredParams: ["compName", "layerIndices"],
    estimatedTime: "Long"
  },
  "batchApplyEffectTemplates": {
    description: "Batch apply effect templates to multiple layers",
    category: "batch-effects",
    requiredParams: ["effectApplications"],
    estimatedTime: "Long"
  },
  
  // Testing and debugging
  "test-animation": { 
    description: "Test animation functionality", 
    category: "testing",
    estimatedTime: "Quick"
  },
  "bridgeTestEffects": { 
    description: "Test MCP bridge communication", 
    category: "testing",
    estimatedTime: "Quick"
  }
}; 