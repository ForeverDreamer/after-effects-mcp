import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  MCPToolResponse,
  helpToolSchema,
  runScriptSchema,
  getResultsSchema,
  createCompositionSchema,
  setLayerKeyframeSchema,
  setLayerExpressionSchema,
  batchApplyEffectsSchema,
  applyEffectSchema,
  applyEffectTemplateSchema
} from "../types/index.js";
import {
  AECommandManager,
  ResponseFormatter,
  ParameterValidator,
  allowedScripts,
  delay
} from "../utils/index.js";

export function setupTools(server: McpServer) {
  // Optimized help tool
  server.tool(
    "get-help",
    "Get comprehensive help and usage guide for After Effects MCP integration",
    helpToolSchema.shape,
    async ({ topic = "all", language = "zh" }): Promise<MCPToolResponse> => {
      const helpSections = {
        setup: {
          zh: `# 🚀 Installation Setup Guide

## 1. Environment Preparation
- Ensure Adobe After Effects 2021 or later is installed
- Install Node.js (recommended v18 or later)
- Administrator privileges for script installation

## 2. Script Installation
\`\`\`bash
npm run build
npm run install-bridge
\`\`\`

## 3. Launch After Effects
- Open Adobe After Effects
- Go to Window > mcp-bridge-auto.jsx
- Keep the panel open (this is the main bridge script)

## 4. Verify Connection
- Panel auto-checks for commands every 2 seconds
- Use \`system-status\` resource to check connection
- All functions are modularized and included in the main script

**Note:** The architecture now uses a single modular script file that includes all functions via #include directives.`,

          en: `# 🚀 Setup Guide

## 1. Prerequisites
- Adobe After Effects 2021 or later
- Node.js v18 or later
- Administrator privileges for script installation

## 2. Install Scripts
\`\`\`bash
yarn build
yarn install-bridge
\`\`\`

## 3. Launch After Effects
- Open Adobe After Effects
- Go to Window > mcp-bridge-auto.jsx
- Keep the panel open (this is the main bridge script)

## 4. Verify Connection
- Panel auto-checks for commands every 2 seconds
- Use \`system-status\` resource to check connection
- All functions are modularized and included in the main script

**Note:** The architecture now uses a single modular script file that includes all functions via #include directives.`
        },

        tools: {
          zh: `# 🛠️ Available Tools

## 📋 Project Management
- \`run-script\`: Execute predefined scripts
- \`get-results\`: Get last execution results
- \`create-composition\`: Create new compositions

## 🎨 Layer Management
- \`create-text-layer\`: Create text layers
- \`create-shape-layer\`: Create shape layers
- \`create-solid-layer\`: Create solid layers
- \`set-layer-properties\`: Modify layer properties

## 🎬 Animation Tools
- \`set-layer-keyframe\`: Set keyframes
- \`set-layer-expression\`: Apply expressions
- \`animate-property\`: Auto-animate properties

## ✨ Effects System
- \`apply-effect\`: Apply single effects
- \`apply-effect-template\`: Apply effect templates
- \`batch-apply-effects\`: Batch apply effects`,

          en: `# 🛠️ Available Tools

## 📋 Project Management
- \`run-script\`: Execute predefined scripts
- \`get-results\`: Get last execution results
- \`create-composition\`: Create new compositions

## 🎨 Layer Management
- \`create-text-layer\`: Create text layers
- \`create-shape-layer\`: Create shape layers
- \`create-solid-layer\`: Create solid layers
- \`set-layer-properties\`: Modify layer properties

## 🎬 Animation Tools
- \`set-layer-keyframe\`: Set keyframes
- \`set-layer-expression\`: Apply expressions
- \`animate-property\`: Auto-animate properties

## ✨ Effects System
- \`apply-effect\`: Apply single effects
- \`apply-effect-template\`: Apply effect templates
- \`batch-apply-effects\`: Batch apply effects`
        }
      };

      const content = topic === "all" 
        ? Object.values(helpSections).map(section => section[language as 'zh' | 'en']).join("\n\n")
        : helpSections[topic as keyof typeof helpSections]?.[language as 'zh' | 'en'] || "Help topic not found";

      return ResponseFormatter.info("After Effects MCP Help", content);
    }
  );

  // Optimized script execution tool
  server.tool(
    "run-script", 
    "Execute predefined After Effects script, support parameter validation and error handling",
    runScriptSchema.shape,
    async ({ script, parameters = {}, waitForResult = false, timeout = 5000 }): Promise<MCPToolResponse> => {
      const scriptInfo = allowedScripts[script as keyof typeof allowedScripts];
      
      if (!scriptInfo) {
        const availableScripts = Object.entries(allowedScripts)
          .map(([name, info]) => `• \`${name}\`: ${info.description} (${info.category})`)
          .join('\n');
        
        return ResponseFormatter.error(
          `Script "${script}" not found or not allowed`,
          [
            "Check script name spelling",
            "View below available script list",
            "Ensure script is correctly installed"
          ]
        );
      }

      // Verify required parameters
      if (scriptInfo.requiredParams) {
        const missingParams = scriptInfo.requiredParams.filter((param: string) => !(param in parameters));
        if (missingParams.length > 0) {
          return ResponseFormatter.error(
            `Missing required parameter: ${missingParams.join(', ')}`,
            [
              "Check script documentation for required parameters",
              "Ensure parameter names are correct",
              "Provide all required parameter values"
            ]
          );
        }
      }

      try {
        if (waitForResult) {
          const result = await AECommandManager.executeCommand(script, parameters, timeout);
          return ResponseFormatter.success(
            `Script "${script}" execution completed`,
            result
          );
        } else {
          AECommandManager.clearResults();
          AECommandManager.writeCommand(script, parameters);
          
          return ResponseFormatter.queuedCommand(script, {
            ...parameters,
            category: scriptInfo.category,
            estimatedTime: scriptInfo.estimatedTime
          });
        }
      } catch (error) {
        return ResponseFormatter.error(
          `Script execution failed: ${error instanceof Error ? error.message : String(error)}`,
          [
            "Ensure After Effects is running",
            "Check MCP Bridge Auto panel status",
            "Verify script parameters are correct",
            "Check error messages in After Effects console"
          ]
        );
      }
    }
  );

  // Optimized results retrieval tool
  server.tool(
    "get-results",
    "Get and format last executed script results",
    getResultsSchema.shape,
    async ({ format = "formatted", includeMetadata = true }): Promise<MCPToolResponse> => {
      try {
        const result = AECommandManager.readResults();
        
        if (!result.success) {
          return ResponseFormatter.error(
            result.error || "Failed to get results",
            [
              "Ensure script command has been executed",
              "Check After Effects status",
              "Verify MCP Bridge Auto panel status",
              "Wait for script execution to complete before getting results"
            ]
          );
        }

        let formattedResult: string;
        
        switch (format) {
          case "raw":
            formattedResult = JSON.stringify(result.data, null, 2);
            break;
            
          case "summary":
            const data = result.data;
            if (typeof data === 'object' && data !== null) {
              const keys = Object.keys(data);
              formattedResult = `📊 **Results Summary:**\n${keys.map(key => `• ${key}: ${typeof data[key]}`).join('\n')}`;
            } else {
              formattedResult = `Results type: ${typeof data}`;
            }
            break;
            
          case "debug":
            formattedResult = `📊 **Debug Information:**\n\`\`\`json\n${JSON.stringify(result, null, 2)}\n\`\`\``;
            break;
            
          case "formatted":
          default:
            if (typeof result.data === 'object') {
              formattedResult = `📋 **Execution Results:**\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\``;
            } else {
              formattedResult = `📋 **Execution Results:**\n${result.data}`;
            }
            break;
        }

        const metadata = includeMetadata ? {
          时间戳: new Date().toISOString(),
          格式: format,
          数据类型: typeof result.data,
          警告: result.warning || "无"
        } : undefined;

        return ResponseFormatter.info("Script Execution Results", formattedResult, metadata);
        
      } catch (error) {
        return ResponseFormatter.error(
          `Error occurred when getting results: ${String(error)}`,
          [
            "Check temporary file permissions",
            "Ensure After Effects has write permissions",
            "Restart After Effects and MCP server"
          ]
        );
      }
    }
  );

  // Enhanced composition creation tool
  server.tool(
    "create-composition",
    "Create new composition in After Effects, support preset and custom settings",
    createCompositionSchema.shape,
    async (params): Promise<MCPToolResponse> => {
      try {
        // Preset configuration
        const presets = {
          "HD_1080": { width: 1920, height: 1080, frameRate: 29.97, description: "Standard HD" },
          "4K_UHD": { width: 3840, height: 2160, frameRate: 29.97, description: "4K Ultra HD" },
          "HD_720": { width: 1280, height: 720, frameRate: 29.97, description: "HD 720p" },
          "NTSC": { width: 720, height: 486, frameRate: 29.97, description: "NTSC Standard" },
          "PAL": { width: 720, height: 576, frameRate: 25, description: "PAL Standard" },
          "Instagram_Square": { width: 1080, height: 1080, frameRate: 30, description: "Instagram Square" },
          "YouTube_16x9": { width: 1920, height: 1080, frameRate: 30, description: "YouTube 16:9" }
        };

        let finalParams = { ...params };
        
        // Apply preset
        if (params.preset && params.preset !== "custom" && presets[params.preset]) {
          const preset = presets[params.preset];
          finalParams = { ...finalParams, ...preset };
        }

        // Set default values
        finalParams.width = finalParams.width || 1920;
        finalParams.height = finalParams.height || 1080;
        finalParams.duration = finalParams.duration || 10.0;
        finalParams.frameRate = finalParams.frameRate || 30.0;
        finalParams.pixelAspect = finalParams.pixelAspect || 1.0;

        // Verify dimensions
        const validation = ParameterValidator.validateDimensions(finalParams.width, finalParams.height);
        if (!validation.valid) {
          return ResponseFormatter.error(validation.error || "Dimension validation failed");
        }

        // Execute creation command
        AECommandManager.clearResults();
        AECommandManager.writeCommand("createComposition", finalParams);

        const settingsSummary = {
          合成名称: finalParams.name,
          尺寸: `${finalParams.width} × ${finalParams.height}px`,
          持续时间: `${finalParams.duration}秒`,
          帧率: `${finalParams.frameRate} fps`,
          像素宽高比: finalParams.pixelAspect,
          背景色: finalParams.backgroundColor 
            ? `RGB(${finalParams.backgroundColor.r}, ${finalParams.backgroundColor.g}, ${finalParams.backgroundColor.b})`
            : "默认（黑色）",
          使用预设: finalParams.preset !== "custom" ? presets[finalParams.preset as keyof typeof presets]?.description : "自定义"
        };

        return ResponseFormatter.queuedCommand("createComposition", settingsSummary);
        
      } catch (error) {
        return ResponseFormatter.error(
          `Failed to create composition: ${String(error)}`,
          [
            "Check composition name validity",
            "Ensure dimension parameters are within reasonable range",
            "Verify After Effects response",
            "Check available memory and disk space"
          ]
        );
      }
    }
  );

  // Enhanced keyframe setting tool
  server.tool(
    "set-layer-keyframe",
    "Set keyframe for layer property, support various easing types and advanced options",
    setLayerKeyframeSchema.shape,
    async (parameters): Promise<MCPToolResponse> => {
      try {
        // Verify value format
        const valueValidation = {
          "Position": (val: any) => ParameterValidator.validatePosition(val),
          "Scale": (val: any) => ParameterValidator.validateScale(val),
          "Anchor Point": (val: any) => ParameterValidator.validatePosition(val),
          "Rotation": (val: any) => ParameterValidator.validateRotation(val),
          "Opacity": (val: any) => ParameterValidator.validateOpacity(val)
        };

        const validator = valueValidation[parameters.propertyName as keyof typeof valueValidation];
        if (validator && !validator(parameters.value)) {
          const expectedFormat = parameters.propertyName.includes("Position") || 
                               parameters.propertyName.includes("Scale") || 
                               parameters.propertyName.includes("Anchor") 
            ? "Array [x, y] or [x, y, z]"
            : parameters.propertyName === "Opacity" ? "Number 0-100" : "Number";

          return ResponseFormatter.error(
            `Invalid value format for property ${parameters.propertyName}`,
            [
              `Expected format: ${expectedFormat}`,
              `Received: ${JSON.stringify(parameters.value)}`,
              "Check value type and range"
            ]
          );
        }

        const enhancedParams = {
          ...parameters,
          easing: parameters.easing || "linear"
        };

        AECommandManager.writeCommand("setLayerKeyframe", enhancedParams);

        const valueDisplay = Array.isArray(parameters.value) 
          ? `[${parameters.value.join(', ')}]`
          : parameters.value;

        return ResponseFormatter.queuedCommand("setLayerKeyframe", {
          属性: parameters.propertyName,
          图层: `Layer ${parameters.layerIndex} (Composition ${parameters.compIndex})`,
          时间: `${parameters.timeInSeconds}秒`,
          数值: valueDisplay,
          缓动: enhancedParams.easing
        });

      } catch (error) {
        return ResponseFormatter.error(
          `Failed to set keyframe: ${String(error)}`,
          [
            "Verify layer and composition index",
            "Check property name spelling",
            "Ensure value format matches property type"
          ]
        );
      }
    }
  );

  // Enhanced expression tool
  server.tool(
    "set-layer-expression",
    "Set or remove expression for layer property, include syntax validation and common expression templates",
    setLayerExpressionSchema.shape,
    async (parameters): Promise<MCPToolResponse> => {
      try {
        // Basic expression validation
        if (parameters.validate !== false && parameters.expressionString.trim()) {
          const commonPatterns = [
            "wiggle", "time", "value", "random", "Math.", "linear", "ease", 
            "bounceIn", "bounceOut", "loopOut", "loopIn"
          ];

          const hasValidPattern = commonPatterns.some(pattern => 
            parameters.expressionString.includes(pattern)
          );

          if (!hasValidPattern && parameters.expressionString.length > 10) {
            return ResponseFormatter.info(
              "Expression Syntax Reminder",
              `Expression may contain syntax issues. Common patterns include: ${commonPatterns.slice(0, 5).join(', ')}\n\n` +
              `**Expression Content:** \`${parameters.expressionString}\`\n\n` +
              `Set \`validate: false\` to skip this check.`
            );
          }
        }

        AECommandManager.writeCommand("setLayerExpression", parameters);

        const action = parameters.expressionString.trim() ? "Applied" : "Removed";
        const expressionDisplay = parameters.expressionString.trim() 
          ? `\`\`\`javascript\n${parameters.expressionString}\n\`\`\``
          : "*(Removed)*";

        return ResponseFormatter.queuedCommand("setLayerExpression", {
          操作: action,
          属性: parameters.propertyName,
          图层: `Layer ${parameters.layerIndex} (Composition ${parameters.compIndex})`,
          表达式: expressionDisplay
        });

      } catch (error) {
        return ResponseFormatter.error(
          `Failed to set expression: ${String(error)}`,
          [
            "Check expression syntax",
            "Verify property name",
            "Ensure layer and composition index valid"
          ]
        );
      }
    }
  );

  // Batch apply effects tool
  server.tool(
    "batch-apply-effects",
    "Batch apply effects or effect templates to multiple layers",
    batchApplyEffectsSchema.shape,
    async ({ compIndex, layerIndices, effectTemplate, effectMatchName, effectSettings = {}, skipErrors = true }): Promise<MCPToolResponse> => {
      try {
        if (!effectTemplate && !effectMatchName) {
          return ResponseFormatter.error(
            "Must specify either effectTemplate or effectMatchName",
            [
              "Use effectTemplate to apply preset template",
              "Use effectMatchName to apply specific effect",
              "View effect-templates resource for available templates"
            ]
          );
        }

        const batchParams = {
          compIndex,
          layerIndices,
          effectTemplate,
          effectMatchName,
          effectSettings,
          skipErrors,
          metadata: {
            totalLayers: layerIndices.length,
            timestamp: new Date().toISOString(),
            batchId: `batch_${Date.now()}`
          }
        };

        AECommandManager.clearResults();
        AECommandManager.writeCommand("batchApplyEffects", batchParams);

        const batchInfo = {
          目标图层数量: layerIndices.length,
          图层索引: layerIndices.join(', '),
          特效类型: effectTemplate || effectMatchName,
          跳过错误: skipErrors ? "是" : "否",
          预计用时: layerIndices.length > 10 ? "较长" : "中等"
        };

        return ResponseFormatter.queuedCommand("batchApplyEffects", batchInfo);

      } catch (error) {
        return ResponseFormatter.error(
          `Failed to batch apply effects: ${String(error)}`,
          [
            "Check layer indices",
            "Ensure composition contains specified layers",
            "Verify effect name or template name",
            "Consider batch processing large layers"
          ]
        );
      }
    }
  );

  // Keep existing apply-effect and apply-effect-template tools, but use new response format
  server.tool(
    "apply-effect",
    "Apply an effect to a layer in After Effects",
    applyEffectSchema.shape,
    async (parameters): Promise<MCPToolResponse> => {
      try {
        if (parameters.waitForResult) {
          AECommandManager.clearResults();
        }
        
        AECommandManager.writeCommand("applyEffect", parameters);
        
        if (parameters.waitForResult) {
          await delay(1000);
          const result = AECommandManager.readResults();
          return ResponseFormatter.success("Effect application completed", result.data);
        } else {
          return ResponseFormatter.queuedCommand("applyEffect", {
            特效名称: parameters.effectName || parameters.effectMatchName,
            目标图层: `Layer ${parameters.layerIndex} (Composition ${parameters.compIndex})`
          });
        }
      } catch (error) {
        return ResponseFormatter.error(
          `Failed to apply effect: ${String(error)}`,
          [
            "Check effect name",
            "Ensure layer supports effect",
            "Verify effect parameter format"
          ]
        );
      }
    }
  );

  server.tool(
    "apply-effect-template",
    "Apply a predefined effect template to a layer in After Effects",
    applyEffectTemplateSchema.shape,
    async (parameters): Promise<MCPToolResponse> => {
      try {
        if (parameters.waitForResult) {
          AECommandManager.clearResults();
        }
        
        AECommandManager.writeCommand("applyEffectTemplate", parameters);
        
        if (parameters.waitForResult) {
          await delay(1000);
          const result = AECommandManager.readResults();
          return ResponseFormatter.success("Effect template application completed", result.data);
        } else {
          return ResponseFormatter.queuedCommand("applyEffectTemplate", {
            模板名称: parameters.templateName,
            目标图层: `Layer ${parameters.layerIndex} (Composition ${parameters.compIndex})`,
            自定义设置: Object.keys(parameters.customSettings || {}).length > 0 ? "是" : "否"
          });
        }
      } catch (error) {
        return ResponseFormatter.error(
          `Failed to apply effect template: ${String(error)}`,
          [
            "Check template name",
            "Ensure layer type supports template",
            "Verify custom parameter format"
          ]
        );
      }
    }
  );

  server.tool(
    "run-bridge-test",
    "Run the bridge test effects script to verify communication and apply test effects",
    {},
    async (): Promise<MCPToolResponse> => {
      try {
        AECommandManager.clearResults();
        AECommandManager.writeCommand("bridgeTestEffects", {});
        
        return ResponseFormatter.queuedCommand("bridgeTestEffects", {
          测试类型: "MCP Bridge Communication Test",
          预期结果: "Apply test effects and return status information"
        });
      } catch (error) {
        return ResponseFormatter.error(
          `Bridge test failed: ${String(error)}`,
          [
            "Ensure After Effects is running",
            "Check MCP Bridge Auto panel status",
            "Verify script file integrity"
          ]
        );
      }
    }
  );
} 