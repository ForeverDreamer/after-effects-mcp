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
  // Enhanced help tool
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

**Note:** Version 2.1 features a completely refactored modular architecture with unified layer operations and enhanced batch processing.`,

        tools: `# 🛠️ Tools Usage Guide (v2.1 Refactored)

## 🎯 Core Architecture
After Effects MCP v2.1 uses a revolutionary three-tool architecture with 60% code reduction:

### 📋 Core Tools
- \`get-help\`: Get help and documentation
- \`run-script\`: Unified script execution entry point - **Main tool for all After Effects operations**
- \`get-results\`: Get last executed script results

## 🔄 Standard Workflow
1. Use \`run-script\` to execute desired script functionality
2. Use \`get-results\` to retrieve execution results and status

## ✨ v2.1 New Features
- **Unified Layer Module**: All layer creation uses layerOperations.jsx
- **Enhanced Batch Engine**: processBatchOperation with error recovery
- **Standard Response Format**: 100% createStandardResponse usage
- **Atomic Operations**: executeWithUndoGroup for all operations
- **75% Code Reduction**: Individual scripts dramatically simplified

## 📝 Refactored Script Categories

### 🗂️ Information Retrieval (Optimized)

#### \`listCompositions\` - List All Compositions ✨*Unified Response*
**New Features:** Standardized output format, structured data
**Parameters:**
- \`includeDetails\` (boolean, optional): Include detailed information (default: true)
- \`sortBy\` (string, optional): Sort method ["name", "duration", "created", "size"] (default: "name")

#### \`getProjectInfo\` - Get Project Details ✨*Enhanced Structure*
**New Features:** Unified response format, structured data organization
**Optional Parameters:**
- \`includeItems\` (boolean): Include project items list (default: true)
- \`maxItems\` (integer): Maximum number of items to return (1-1000, default: 50)
- \`includeCompositions\` (boolean): Include detailed composition info (default: false)
- \`includeSystemInfo\` (boolean): Include system and application info (default: false)

#### \`getLayerInfo\` - Get Current Composition Layer Info ✨*Structured Data*
**New Features:** Enhanced layer data structure, unified formatting
**Optional Parameters:**
- \`compName\` (string): Composition name, empty string uses active composition (default: "")
- \`includeDetails\` (boolean): Include detailed layer properties (default: true)
- \`includeTransform\` (boolean): Include transform property values (default: false)
- \`layerTypes\` (array): Filter specific layer types, empty array returns all types (default: [])

### 🎨 Creation Scripts (75% Code Reduction)

#### \`createComposition\` - Create New Composition ✨*Unified Creation*
**New Features:** Unified creation pattern, standardized parameter validation
**Required Parameters:**
- \`name\` (string): Composition name (1-255 characters)

#### \`createTextLayer\` - Create Text Layer ✨*396→119 Lines*
**New Features:** Unified layer module, simplified API, 75% code reduction
**Required Parameters:**
- \`text\` (string): Text content (1-1000 characters)
**Enhanced with layerOperations.jsx for consistent behavior**

#### \`createShapeLayer\` - Create Shape Layer ✨*Modular Refactor*
**New Features:** Unified layer module, standardized creation, shape content optimization
**Required Parameters:**
- \`shapeType\` (string): Shape type ["rectangle", "ellipse", "polygon", "star"]
**Now uses createLayer() for consistent shape generation**

#### \`createSolidLayer\` - Create Solid Layer ✨*Modular Refactor*
**New Features:** Unified layer module, property standardization
**Uses unified createLayer() function for consistent behavior**

### 🚀 Batch Creation (Unified Framework)

#### \`batchCreateTextLayers\` - Batch Text Layers ✨*Unified Batch Engine*
**New Features:** 
- Unified batch engine with processBatchOperation
- Error recovery mechanism (skipErrors: true)
- Progress tracking with detailed results
- Undo support (entire batch in single undo group)
**Required Parameters:**
- \`textLayers\` (array): Array of text layer configurations (1-50 items)

#### \`batchCreateShapeLayers\` - Batch Shape Layers ✨*Error Recovery*
**New Features:**
- Unified batch framework
- Validation mode (validateOnly: true)
- Performance optimization
**Required Parameters:**
- \`shapeLayers\` (array): Array of shape layer configurations (1-50 items)

#### \`batchCreateSolidLayers\` - Batch Solid Layers ✨*Progress Tracking*
**New Features:**
- Batch processing engine
- Error skipping capabilities
- Atomic operations
**Required Parameters:**
- \`solidLayers\` (array): Array of solid layer configurations (1-50 items)

### ⚙️ Modification Scripts (Unified Interface)

#### \`setLayerProperties\` - Set Layer Properties ✨*Unified Operations*
**New Features:** Unified layer operations, standardized property setting, enhanced validation
**Uses performLayerOperation() for consistent behavior**

#### \`setLayerKeyframe\` - Set Keyframe ✨*Standardized Keyframes*
**New Features:** Unified keyframe API, interpolation type support, time validation
**Enhanced with setLayerKeyframe() function from layerOperations.jsx**

#### \`setLayerExpression\` - Set Expression ✨*Expression Management*
**New Features:** Expression validation, unified setting interface, error handling
**Uses setLayerExpression() for consistent expression handling**

### 🔄 Batch Modification (Enhanced Engine)

#### \`batchSetLayerProperties\` - Batch Properties ✨*Up to 100 Layers*
**New Features:**
- Enhanced batch engine
- High-capacity processing (up to 100 layers)
- Mixed property support (position, text, effects simultaneously)

#### \`batchSetLayerKeyframes\` - Batch Keyframes ✨*Up to 200 Keyframes*
**New Features:**
- Large-scale keyframe support
- Batch animation capabilities
- Performance optimization for complex animations

#### \`batchSetLayerExpressions\` - Batch Expressions ✨*Expression Management*
**New Features:**
- Expression batch processing
- Validation mode
- Error recovery

### 🎭 Effects Scripts (Core Optimization)

#### \`applyEffect\` - Apply Effect ✨*Removed Duplicate Code*
**New Features:** Core effects engine, unified settings application, enhanced error handling
**Uses applySingleEffect() from effectsCore.jsx**

#### \`applyEffectTemplate\` - Apply Template ✨*Template System*
**New Features:** Preset template library, custom settings, template validation

#### \`batchApplyEffects\` - Batch Effects ✨*Unified Effects Engine*
**New Features:** Batch effects processing, efficiency optimization, error skipping

#### \`batchApplyEffectTemplates\` - Batch Templates ✨*Mixed Processing*
**New Features:**
- Mixed batch processing (templates + effects)
- Template & effect combination
- Intelligent application

### 🧪 Testing Scripts

#### \`bridgeTestEffects\` - Test Communication ✨*Architecture Test*
**New Features:** New architecture communication test, module loading verification

## 💡 v2.1 Architecture Benefits

### 🏗️ Module Structure
- **layerOperations.jsx**: Unified layer creation and manipulation
- **effectsCore.jsx**: Enhanced core with batch processing
- **utils.jsx**: Foundational utilities and validation

### ⚡ Performance Improvements
- **60% Code Reduction**: Overall codebase optimization
- **75% File Size Reduction**: Individual scripts simplified
- **Unified Batch Engine**: Single framework for all batch operations
- **Atomic Operations**: All changes wrapped in undo groups

### 🛡️ Enhanced Reliability
- **Standard Response Format**: 100% consistent responses
- **Error Recovery**: Batch operations skip failures and continue
- **Progress Tracking**: Detailed success/failure reporting
- **Validation Mode**: Test parameters before execution

### 🔧 Best Practices for v2.1
1. **Use Batch Operations**: Much more efficient than individual calls
2. **Enable Error Recovery**: Set \`skipErrors: true\` for batch operations
3. **Validate First**: Use \`validateOnly: true\` for complex batches
4. **Monitor Progress**: Check results array for detailed status
5. **Leverage Templates**: Use effect templates for consistent styling`,

        effects: `# ✨ Effects System (v2.1 Core Optimization)

## 🔧 Refactored Effects Architecture

### Core Improvements
- **Removed Duplicate Code**: applySingleEffect() centralized
- **Unified Settings**: applyEffectSettings() standardized
- **Enhanced Error Handling**: Comprehensive validation
- **Template System**: Preset library with custom settings

### Effect Application Methods

#### 1. Individual Effects ✨*Optimized Core*
\`\`\`json
{
  "script": "applyEffect",
  "parameters": {
    "compName": "Main Comp",
    "layerIndex": 1,
    "effectMatchName": "ADBE Gaussian Blur 2",
    "effectSettings": {
      "Blurriness": 10
    }
  }
}
\`\`\`

#### 2. Effect Templates ✨*Template System*
\`\`\`json
{
  "script": "applyEffectTemplate", 
  "parameters": {
    "templateName": "cinematic-look",
    "compName": "Color Comp",
    "layerIndex": 1,
    "customSettings": {
      "vibrance": 20,
      "vignette_amount": 25
    }
  }
}
\`\`\`

#### 3. Batch Effects ✨*Mixed Processing*
\`\`\`json
{
  "script": "batchApplyEffectTemplates",
  "parameters": {
    "effectApplications": [
      {
        "templateName": "glow",
        "compName": "Text Comp",
        "layerIndex": 1,
        "customSettings": {
          "glow_intensity": 2.5
        }
      },
      {
        "templateName": "drop-shadow",
        "compName": "Text Comp", 
        "layerIndex": 2
      }
    ],
    "skipErrors": true
  }
}
\`\`\`

## Available Templates
- \`gaussian-blur\`: Standard blur effect
- \`drop-shadow\`: Layer shadow
- \`glow\`: Outer glow effect
- \`cinematic-look\`: Professional color grading
- \`text-enhancement\`: Text visibility improvement`,

        animation: `# 🎬 Animation System (v2.1 Enhanced)

## 🔄 Unified Animation Framework

### Keyframe System ✨*Standardized*
- **Unified API**: All keyframes use same interface
- **Interpolation Support**: Linear, Bezier, Hold
- **Time Validation**: Comprehensive time range checking
- **Batch Processing**: Up to 200 keyframes in single operation

### Expression System ✨*Enhanced Management*
- **Validation**: Expression syntax checking
- **Unified Interface**: Consistent setting/removal
- **Error Handling**: Clear error reporting
- **Batch Support**: Multiple expressions simultaneously

### Animation Workflows

#### 1. Individual Keyframes
\`\`\`json
{
  "script": "setLayerKeyframe",
  "parameters": {
    "compName": "Animation Comp",
    "layerIndex": 1,
    "propertyName": "Opacity",
    "timeInSeconds": 0,
    "value": 0
  }
}
\`\`\`

#### 2. Batch Animation ✨*Up to 200 Keyframes*
\`\`\`json
{
  "script": "batchSetLayerKeyframes",
  "parameters": {
    "keyframes": [
      {
        "compName": "Animation Comp",
        "layerIndex": 1,
        "propertyName": "Position",
        "timeInSeconds": 0,
        "value": [100, 100]
      },
      {
        "compName": "Animation Comp",
        "layerIndex": 1,
        "propertyName": "Position", 
        "timeInSeconds": 2,
        "value": [500, 300]
      }
    ],
    "skipErrors": true
  }
}
\`\`\`

#### 3. Expression Animation
\`\`\`json
{
  "script": "setLayerExpression",
  "parameters": {
    "compName": "Animation Comp",
    "layerIndex": 1,
    "propertyName": "Position",
    "expressionString": "wiggle(2, 50)"
  }
}
\`\`\``
      };

      const content = topic === "all" 
        ? Object.values(helpSections).join("\n\n")
        : helpSections[topic as keyof typeof helpSections] || "Help topic not found";

      return ResponseFormatter.info("After Effects MCP Help (v2.1 Refactored)", content);
    }
  );

  // Enhanced script execution tool
  server.tool(
    "run-script", 
    "Execute predefined After Effects script with unified architecture and enhanced batch processing",
    runScriptSchema.shape,
    async ({ script, parameters = {}, waitForResult = false, timeout = 5000 }): Promise<MCPToolResponse> => {
      const scriptInfo = allowedScripts[script as keyof typeof allowedScripts];
      
      if (!scriptInfo) {
        const availableScripts = Object.entries(allowedScripts)
          .map(([name, info]) => {
            const newFeatures = info.newFeatures ? ` ✨${info.newFeatures.join(', ')}` : '';
            return `• \`${name}\`: ${info.description} (${info.category})${newFeatures}`;
          })
          .join('\n');
        
        return ResponseFormatter.error(
          `Script "${script}" not found or not allowed`,
          [
            "Check script name spelling",
            "View available scripts with new v2.1 features:",
            availableScripts,
            "All scripts now use unified architecture for better performance"
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
              "v2.1 features enhanced parameter validation",
              "Use validateOnly: true for batch operations to test parameters",
              "All scripts now provide detailed schema validation"
            ]
          );
        }
      }

      try {
        if (waitForResult) {
          const result = await AECommandManager.executeCommand(script, parameters, timeout);
          return ResponseFormatter.success(
            `Script "${script}" execution completed (v2.1 optimized)`,
            result
          );
        } else {
          AECommandManager.clearResults();
          AECommandManager.writeCommand(script, parameters);
          
          const newFeatures = scriptInfo.newFeatures ? `\n\n✨ **v2.1 Features:** ${scriptInfo.newFeatures.join(', ')}` : '';
          
          return ResponseFormatter.queuedCommand(script, {
            ...parameters,
            category: scriptInfo.category,
            estimatedTime: scriptInfo.estimatedTime,
            _meta: {
              version: "2.1",
              architecture: "unified",
              features: scriptInfo.newFeatures || []
            }
          });
        }
      } catch (error) {
        return ResponseFormatter.error(
          `Script execution failed: ${error instanceof Error ? error.message : String(error)}`,
          [
            "Ensure After Effects is running",
            "Check MCP Bridge Auto panel status",
            "Verify script parameters are correct",
            "v2.1 provides enhanced error reporting in get-results",
            "Use unified batch operations for better error recovery"
          ]
        );
      }
    }
  );

  // Enhanced results retrieval tool
  server.tool(
    "get-results",
    "Get and format last executed script results with enhanced v2.1 formatting",
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
              "v2.1 features unified response formats for better reliability",
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
              const batchInfo = data.totalItems ? `\n• Batch Operation: ${data.successful}/${data.totalItems} successful` : '';
              formattedResult = `📊 **Results Summary (v2.1):**\n${keys.map(key => `• ${key}: ${typeof data[key]}`).join('\n')}${batchInfo}`;
            } else {
              formattedResult = `Results type: ${typeof data}`;
            }
            break;
            
          case "debug":
            const debugInfo = {
              version: "2.1",
              architecture: "unified",
              timestamp: new Date().toISOString(),
              result: result
            };
            formattedResult = `🔧 **Debug Information (v2.1):**\n\`\`\`json\n${JSON.stringify(debugInfo, null, 2)}\n\`\`\``;
            break;
            
          case "formatted":
          default:
            if (typeof result.data === 'object') {
              const batchSummary = result.data.totalItems ? 
                `\n\n📈 **Batch Summary:** ${result.data.successful}/${result.data.totalItems} items processed successfully` : '';
              formattedResult = `📋 **Execution Results (v2.1 Enhanced):**\n\`\`\`json\n${JSON.stringify(result.data, null, 2)}\n\`\`\`${batchSummary}`;
            } else {
              formattedResult = `📋 **Execution Results (v2.1):**\n${result.data}`;
            }
            break;
        }

        const metadata = includeMetadata ? {
          version: "2.1",
          architecture: "unified",
          timestamp: new Date().toISOString(),
          format: format,
          dataType: typeof result.data,
          warning: result.warning || "None",
          batchOperation: result.data?.totalItems ? "Yes" : "No"
        } : undefined;

        return ResponseFormatter.info("Script Execution Results (v2.1)", formattedResult, metadata);
        
      } catch (error) {
        return ResponseFormatter.error(
          `Error occurred when getting results: ${String(error)}`,
          [
            "Check temporary file permissions",
            "Ensure After Effects has write permissions",
            "v2.1 features improved error handling",
            "Restart After Effects and MCP server if issues persist"
          ]
        );
      }
    }
  );
} 