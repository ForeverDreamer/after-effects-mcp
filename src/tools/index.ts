import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  MCPToolResponse,
  helpToolSchema,
  runScriptSchema,
  getResultsSchema
} from "../types/index.js";
import {
  AECommandManager,
  ResponseFormatter,
  allowedScripts,
  delay
} from "../utils/index.js";

export function setupTools(server: McpServer) {
  // Optimized help tool
  server.tool(
    "get-help",
    "Get comprehensive help and usage guide for After Effects MCP integration",
    helpToolSchema.shape,
    async ({ topic = "all" }): Promise<MCPToolResponse> => {
      const helpSections = {
        setup: `# 🚀 Setup Guide

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

**Note:** The architecture now uses a single modular script file that includes all functions via #include directives.`,

        tools: `# 🛠️ Tools Usage Guide

## 🎯 Core Architecture
After Effects MCP uses a simplified three-tool architecture:

### 📋 Core Tools
- \`get-help\`: Get help and documentation
- \`run-script\`: Unified script execution entry point - **Main tool for all After Effects operations**
- \`get-results\`: Get last executed script results

## 🔄 Standard Workflow
1. Use \`run-script\` to execute desired script functionality
2. Use \`get-results\` to retrieve execution results and status

## 📝 Detailed Script Documentation

### 🗂️ Project Management Scripts

#### \`listCompositions\` - List All Compositions
**Parameters:**
- \`includeDetails\` (boolean, optional): Include detailed information (default: true)
- \`sortBy\` (string, optional): Sort method ["name", "duration", "created", "size"] (default: "name")

**Example:**
\`\`\`json
{
  "script": "listCompositions",
  "parameters": {
    "sortBy": "duration",
    "includeDetails": true
  }
}
\`\`\`

#### \`getProjectInfo\` - Get Project Details
**Optional Parameters:**
- \`includeItems\` (boolean): Include project items list (default: true)
- \`maxItems\` (integer): Maximum number of items to return (1-1000, default: 50)
- \`includeCompositions\` (boolean): Include detailed composition info (default: false)
- \`includeSystemInfo\` (boolean): Include system and application info (default: false)

**Example:**
\`\`\`json
{
  "script": "getProjectInfo",
  "parameters": {
    "includeItems": true,
    "includeCompositions": true,
    "maxItems": 100
  }
}
\`\`\`

#### \`getLayerInfo\` - Get Current Composition Layer Info
**Optional Parameters:**
- \`compName\` (string): Composition name, empty string uses active composition (default: "")
- \`includeDetails\` (boolean): Include detailed layer properties (default: true)
- \`includeTransform\` (boolean): Include transform property values (default: false)
- \`layerTypes\` (array): Filter specific layer types, empty array returns all types (default: [])

**Available Layer Types:**
- \`text\`: Text layers
- \`shape\`: Shape layers
- \`solid\`: Solid color layers
- \`footage\`: Footage/media layers
- \`adjustment\`: Adjustment layers
- \`camera\`: Camera layers
- \`light\`: Light layers

**Example:**
\`\`\`json
{
  "script": "getLayerInfo",
  "parameters": {
    "compName": "Main Comp",
    "includeDetails": true,
    "includeTransform": true,
    "layerTypes": ["text", "shape"]
  }
}
\`\`\`

### 🎨 Creation Scripts

#### \`createComposition\` - Create New Composition
**Required Parameters:**
- \`name\` (string): Composition name (1-255 characters)

**Optional Parameters:**
- \`width\` (integer): Width in pixels (1-8192, default: 1920)
- \`height\` (integer): Height in pixels (1-8192, default: 1080)
- \`pixelAspect\` (number): Pixel aspect ratio (0.1-10.0, default: 1.0)
- \`duration\` (number): Duration in seconds (0.1-3600, default: 10.0)
- \`frameRate\` (number): Frame rate (1-120, default: 30.0)
- \`backgroundColor\` (object): Background color {r: 0-255, g: 0-255, b: 0-255}

#### \`createTextLayer\` - Create Text Layer
**Required Parameters:**
- \`text\` (string): Text content (1-1000 characters)

**Optional Parameters:**
- \`compName\` (string): Composition name (default: active composition)
- \`position\` (array): Position [x, y] (default: [960, 540])
- \`fontSize\` (number): Font size (1-500, default: 72)
- \`color\` (array): Color [r, g, b] 0-1 range (default: [1, 1, 1])
- \`startTime\` (number): Start time in seconds (default: 0)
- \`duration\` (number): Duration in seconds (default: 5)
- \`fontFamily\` (string): Font name (default: "Arial")
- \`alignment\` (string): Alignment ["left", "center", "right"] (default: "center")

#### \`createShapeLayer\` - Create Shape Layer
**Optional Parameters:**
- \`compName\` (string): Composition name (default: active composition)
- \`shapeType\` (string): Shape type ["rectangle", "ellipse", "polygon", "star"] (default: "rectangle")
- \`position\` (array): Position [x, y] (default: [960, 540])
- \`size\` (array): Size [width, height] (default: [200, 200])
- \`fillColor\` (array): Fill color [r, g, b] 0-1 range (default: [1, 0, 0])
- \`strokeColor\` (array): Stroke color [r, g, b] 0-1 range (default: [0, 0, 0])
- \`strokeWidth\` (number): Stroke width (0-100, default: 0)
- \`startTime\` (number): Start time in seconds (default: 0)
- \`duration\` (number): Duration in seconds (default: 5)
- \`name\` (string): Layer name (default: "Shape Layer")
- \`points\` (integer): Number of points for polygon/star (3-20, default: 5)

#### \`createSolidLayer\` - Create Solid Layer
**Optional Parameters:**
- \`compName\` (string): Composition name (default: active composition)
- \`color\` (array): Color [r, g, b] 0-1 range (default: [1, 1, 1])
- \`name\` (string): Layer name (default: "Solid Layer")
- \`position\` (array): Position [x, y] (default: [960, 540])
- \`size\` (array): Size [width, height] (default: composition size)
- \`startTime\` (number): Start time in seconds (default: 0)
- \`duration\` (number): Duration in seconds (default: 5)
- \`isAdjustment\` (boolean): Whether to create as adjustment layer (default: false)

### ⚙️ Modification Scripts

#### \`setLayerProperties\` - Set Layer Properties
**Required Parameters:**
- \`compName\` (string): Composition name

**Layer Identification (choose one):**
- \`layerName\` (string): Layer name
- \`layerIndex\` (integer): Layer index (1-based)

**Optional Properties:**
- \`position\` (array): Position [x, y] or [x, y, z]
- \`scale\` (array): Scale [x, y] or [x, y, z] percentage
- \`rotation\` (number): Rotation angle
- \`opacity\` (number): Opacity (0-100)
- \`startTime\` (number): Start time
- \`duration\` (number): Duration

**Text Layer Specific:**
- \`text\` (string): Text content
- \`fontFamily\` (string): Font name
- \`fontSize\` (number): Font size (1-500)
- \`fillColor\` (array): Text color [r, g, b] 0-1 range

#### \`setLayerKeyframe\` - Set Keyframe
**Required Parameters:**
- \`compName\` (string): Composition name
- \`layerIndex\` (integer): Layer index (1-1000)
- \`propertyName\` (string): Property name ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"]
- \`timeInSeconds\` (number): Time in seconds (0-3600)
- \`value\` (number|array): Property value

#### \`setLayerExpression\` - Apply Expression
**Required Parameters:**
- \`compName\` (string): Composition name
- \`layerIndex\` (integer): Layer index (1-1000)
- \`propertyName\` (string): Property name ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"]
- \`expressionString\` (string): Expression code (empty string removes expression)

### 🎭 Effects Scripts

#### \`applyEffect\` - Apply Effect
**Required Parameters:**
- \`compName\` (string): Composition name
- \`layerIndex\` (integer): Layer index (1-1000)

**Effect Identification (choose one):**
- \`effectName\` (string): Effect display name
- \`effectMatchName\` (string): Effect internal name (more reliable)
- \`presetPath\` (string): Preset file path

#### \`batchApplyEffects\` - Batch Apply Effects
**Required Parameters:**
- \`compName\` (string): Composition name
- \`layerIndices\` (array): Array of layer indices

**Effect Identification (choose one):**
- \`effectTemplate\` (string): Template name ["Glow", "Drop Shadow", "Blur", "Sharpen", "Color Correction"]
- \`effectMatchName\` (string): Effect internal name

#### \`applyEffectTemplate\` - Apply Effect Template
**Required Parameters:**
- \`templateName\` (string): Template name

**Optional Parameters:**
- \`compName\` (string): Composition name (default: active composition)
- \`layerIndex\` (integer): Layer index (1-1000, default: 1)
- \`customSettings\` (object): Custom settings to override defaults

**Available Templates:**
- \`gaussian-blur\`: Gaussian Blur
- \`directional-blur\`: Directional Blur
- \`color-balance\`: Color Balance
- \`brightness-contrast\`: Brightness & Contrast
- \`glow\`: Glow Effect
- \`drop-shadow\`: Drop Shadow
- \`cinematic-look\`: Cinematic Look Effect Chain
- \`text-pop\`: Text Pop Effect Chain

### 🧪 Testing Scripts

#### \`test-animation\` - Test Animation Functionality
**Parameters:** No parameters required

#### \`bridgeTestEffects\` - Test MCP Bridge Communication
**Parameters:** No parameters required

## 💡 Usage Tips

### Parameter Validation
All scripts include comprehensive parameter validation:
- Required parameter existence
- Correct parameter types
- Valid value ranges
- Legal enumeration values

### Error Handling
- Parameter validation failures return detailed error info and schema
- Runtime errors provide specific error location and suggestions
- Batch operations support skipping errors to continue processing

### Best Practices
1. Prefer \`effectMatchName\` over \`effectName\`
2. Set \`skipErrors: true\` for batch operations
3. Confirm layer type before text layer operations
4. Use composition names instead of indices for stability`
      };

      const content = topic === "all" 
        ? Object.values(helpSections).join("\n\n")
        : helpSections[topic as keyof typeof helpSections] || "Help topic not found";

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
            "View below available script list:",
            availableScripts,
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
} 