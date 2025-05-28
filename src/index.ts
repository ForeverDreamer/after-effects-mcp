import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { z } from "zod";
import { fileURLToPath } from 'url';

// Create an MCP server
const server = new McpServer({
  name: "AfterEffectsServer",
  version: "1.0.0"
});

// ES Modules replacement for __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define paths
const SCRIPTS_DIR = path.join(__dirname, "scripts");
const TEMP_DIR = path.join(__dirname, "temp");

// Helper function to run After Effects scripts
function runExtendScript(scriptPath: string, args: Record<string, any> = {}): string {
  try {
    // Ensure temp directory exists
    if (!fs.existsSync(TEMP_DIR)) {
      fs.mkdirSync(TEMP_DIR, { recursive: true });
    }

    // Create a temporary file to hold the script arguments
    const argsPath = path.join(TEMP_DIR, "args.json");
    fs.writeFileSync(argsPath, JSON.stringify(args));

    // Find After Effects executable location - modify as needed for your installation
    // This is a common default location, adjust as necessary
    const aePath = "D:\\Program Files\\Adobe\\Adobe After Effects 2021\\Support Files\\AfterFX.exe";
    
    // Verify After Effects executable exists
    if (!fs.existsSync(aePath)) {
      return `Error: After Effects executable not found at "${aePath}". Please check your installation.`;
    }

    // Verify script file exists
    if (!fs.existsSync(scriptPath)) {
      return `Error: Script file not found at "${scriptPath}".`;
    }

    // Try using the -m flag instead of -r for running scripts (alternative method)
    // The -m flag tells After Effects to run a script without showing a dialog
    const command = `"${aePath}" -m "${scriptPath}" "${argsPath}"`;
    console.error(`Running command with -m flag: ${command}`);
    
    try {
      const output = execSync(command, { encoding: 'utf8', timeout: 30000 });
      return output;
    } catch (execError: any) {
      console.error("Command execution error:", execError);
      
      // If -m flag fails, try creating a JSX file that calls the script via BridgeTalk
      // This is a different approach that can work if direct execution fails
      console.error("Trying alternative approach using BridgeTalk...");
      
      const bridgeScriptPath = path.join(TEMP_DIR, "bridge_script.jsx");
      const bridgeScriptContent = `
#include "${scriptPath.replace(/\\/g, "/")}"
alert("Script execution completed");
      `;
      
      fs.writeFileSync(bridgeScriptPath, bridgeScriptContent);
      
      return `Error executing After Effects command: ${String(execError?.message || execError)}. 
      This might be because After Effects cannot be accessed in headless mode.
      Please try running the script "${path.basename(scriptPath)}" manually in After Effects.`;
    }
  } catch (error) {
    console.error("Error running ExtendScript:", error);
    return `Error: ${String(error)}`;
  }
}

// Helper function to read results from After Effects temp file
function readResultsFromTempFile(): string {
  try {
    const tempFilePath = path.join(process.env.TEMP || process.env.TMP || '', 'ae_mcp_result.json');
    
    // Add debugging info
    console.error(`Checking for results at: ${tempFilePath}`);
    
    if (fs.existsSync(tempFilePath)) {
      // Get file stats to check modification time
      const stats = fs.statSync(tempFilePath);
      console.error(`Result file exists, last modified: ${stats.mtime.toISOString()}`);
      
      const content = fs.readFileSync(tempFilePath, 'utf8');
      console.error(`Result file content length: ${content.length} bytes`);
      
      // If the result file is older than 30 seconds, warn the user
      const thirtySecondsAgo = new Date(Date.now() - 30 * 1000);
      if (stats.mtime < thirtySecondsAgo) {
        console.error(`WARNING: Result file is older than 30 seconds. After Effects may not be updating results.`);
        return JSON.stringify({ 
          warning: "Result file appears to be stale (not recently updated).",
          message: "This could indicate After Effects is not properly writing results or the MCP Bridge Auto panel isn't running.",
          lastModified: stats.mtime.toISOString(),
          originalContent: content
        });
      }
      
      return content;
    } else {
      console.error(`Result file not found at: ${tempFilePath}`);
      return JSON.stringify({ error: "No results file found. Please run a script in After Effects first." });
    }
  } catch (error) {
    console.error("Error reading results file:", error);
    return JSON.stringify({ error: `Failed to read results: ${String(error)}` });
  }
}

// Helper function to write command to file
function writeCommandFile(command: string, args: Record<string, any> = {}): void {
  try {
    const commandFile = path.join(process.env.TEMP || process.env.TMP || '', 'ae_command.json');
    const commandData = {
      command,
      args,
      timestamp: new Date().toISOString(),
      status: "pending"  // pending, running, completed, error
    };
    fs.writeFileSync(commandFile, JSON.stringify(commandData, null, 2));
    console.error(`Command "${command}" written to ${commandFile}`);
  } catch (error) {
    console.error("Error writing command file:", error);
  }
}

// Helper function to clear the results file to avoid stale cache
function clearResultsFile(): void {
  try {
    const resultFile = path.join(process.env.TEMP || process.env.TMP || '', 'ae_mcp_result.json');
    
    // Write a placeholder message to indicate the file is being reset
    const resetData = {
      status: "waiting",
      message: "Waiting for new result from After Effects...",
      timestamp: new Date().toISOString()
    };
    
    fs.writeFileSync(resultFile, JSON.stringify(resetData, null, 2));
    console.error(`Results file cleared at ${resultFile}`);
  } catch (error) {
    console.error("Error clearing results file:", error);
  }
}

// Add comprehensive resources to expose After Effects project data
server.resource(
  "compositions",
  "aftereffects://compositions",
  async (uri: any) => {
    try {
      const scriptPath = path.join(SCRIPTS_DIR, "listCompositions.jsx");
      console.error(`Using script path: ${scriptPath}`);
      const result = runExtendScript(scriptPath);

      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: result
        }]
      };
    } catch (error: unknown) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ 
            error: "Failed to retrieve compositions", 
            message: String(error) 
          })
        }]
      };
    }
  }
);

// Add project information resource
server.resource(
  "project-info",
  "aftereffects://project/info",
  async (uri: any) => {
    try {
      clearResultsFile();
      writeCommandFile("getProjectInfo", {});
      
      // Wait for result
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = readResultsFromTempFile();
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: result
        }]
      };
    } catch (error: unknown) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ 
            error: "Failed to retrieve project info", 
            message: String(error) 
          })
        }]
      };
    }
  }
);

// Add layers resource for active composition
server.resource(
  "layers",
  "aftereffects://composition/active/layers",
  async (uri: any) => {
    try {
      clearResultsFile();
      writeCommandFile("getLayerInfo", {});
      
      // Wait for result
      await new Promise(resolve => setTimeout(resolve, 1000));
      const result = readResultsFromTempFile();
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json", 
          text: result
        }]
      };
    } catch (error: unknown) {
      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify({ 
            error: "Failed to retrieve layer info", 
            message: String(error) 
          })
        }]
      };
    }
  }
);

// Add effect templates resource
server.resource(
  "effect-templates",
  "aftereffects://effects/templates",
  async (uri: any) => {
    const templates = {
      "gaussian-blur": {
        description: "Simple Gaussian blur effect for softening elements",
        parameters: {
          "blurriness": { type: "number", default: 20, range: [0, 100] }
        },
        matchName: "ADBE Gaussian Blur 2"
      },
      "directional-blur": {
        description: "Motion blur in a specific direction",
        parameters: {
          "direction": { type: "number", default: 0, range: [0, 360] },
          "length": { type: "number", default: 10, range: [0, 100] }
        },
        matchName: "ADBE Motion Blur"
      },
      "color-balance": {
        description: "Adjust hue, lightness, and saturation",
        parameters: {
          "hue": { type: "number", default: 0, range: [-180, 180] },
          "lightness": { type: "number", default: 0, range: [-100, 100] },
          "saturation": { type: "number", default: 0, range: [-100, 100] }
        },
        matchName: "ADBE Color Balance (HLS)"
      },
      "brightness-contrast": {
        description: "Basic brightness and contrast adjustment",
        parameters: {
          "brightness": { type: "number", default: 0, range: [-100, 100] },
          "contrast": { type: "number", default: 0, range: [-100, 100] }
        },
        matchName: "ADBE Brightness & Contrast 2"
      },
      "glow": {
        description: "Add a glow effect to elements",
        parameters: {
          "threshold": { type: "number", default: 50, range: [0, 100] },
          "radius": { type: "number", default: 15, range: [0, 50] },
          "intensity": { type: "number", default: 1, range: [0, 5] }
        },
        matchName: "ADBE Glo2"
      },
      "drop-shadow": {
        description: "Add a customizable drop shadow",
        parameters: {
          "color": { type: "color", default: [0, 0, 0, 1] },
          "opacity": { type: "number", default: 50, range: [0, 100] },
          "direction": { type: "number", default: 135, range: [0, 360] },
          "distance": { type: "number", default: 10, range: [0, 100] },
          "softness": { type: "number", default: 10, range: [0, 50] }
        },
        matchName: "ADBE Drop Shadow"
      },
      "cinematic-look": {
        description: "Combination of effects for a cinematic appearance",
        parameters: {
          "vibrance": { type: "number", default: 15, range: [0, 100] },
          "saturation": { type: "number", default: -5, range: [-100, 100] },
          "vignette": { type: "number", default: 15, range: [0, 100] }
        },
        effects: ["ADBE Curves", "ADBE Vibrance", "ADBE Vignette"]
      },
      "text-pop": {
        description: "Effects to make text stand out (glow and shadow)",
        parameters: {
          "shadow_opacity": { type: "number", default: 75, range: [0, 100] },
          "glow_intensity": { type: "number", default: 1.5, range: [0, 5] }
        },
        effects: ["ADBE Drop Shadow", "ADBE Glo2"]
      }
    };

    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({ templates }, null, 2)
      }]
    };
  }
);

// Enhanced tools with comprehensive error handling and validation

// Add a tool to provide comprehensive help and instructions
server.tool(
  "get-help",
  "Get comprehensive help on using the After Effects MCP integration with detailed usage examples",
  {
    topic: z.enum(["setup", "tools", "effects", "troubleshooting", "all"]).optional().describe("Specific help topic (default: all)")
  },
  async ({ topic = "all" }) => {
    const helpSections = {
      setup: `# Setup Instructions

To use this integration with After Effects:

1. **Install the scripts in After Effects**
   - Run \`node install-script.js\` with administrator privileges
   - This copies the necessary scripts to your After Effects installation

2. **Open After Effects**
   - Launch Adobe After Effects 
   - Open a project that you want to work with

3. **Open the MCP Bridge Auto panel**
   - In After Effects, go to Window > mcp-bridge-auto.jsx
   - The panel will automatically check for commands every few seconds

4. **Start using MCP tools**
   - Use the various tools to interact with After Effects
   - Results are automatically retrieved or can be fetched with get-results`,

      tools: `# Available Tools

**Project Management:**
- \`run-script\`: Execute predefined scripts in After Effects
- \`get-results\`: Retrieve results from the last executed command
- \`create-composition\`: Create new compositions with custom settings

**Layer Management:**
- \`setLayerKeyframe\`: Set keyframes for layer properties
- \`setLayerExpression\`: Apply expressions to layer properties
- \`apply-effect\`: Apply effects to layers with custom parameters
- \`apply-effect-template\`: Use predefined effect combinations

**Testing:**
- \`test-animation\`: Test keyframe and expression functionality
- \`run-bridge-test\`: Verify MCP bridge communication`,

      effects: `# Effect System

**Available Effect Templates:**
- \`gaussian-blur\`: Simple blur effect
- \`directional-blur\`: Motion blur with direction control
- \`color-balance\`: Hue, lightness, saturation adjustment
- \`brightness-contrast\`: Basic exposure controls
- \`curves\`: Advanced color grading
- \`glow\`: Add glow effects to elements
- \`drop-shadow\`: Customizable shadow effects
- \`cinematic-look\`: Professional color grading presets
- \`text-pop\`: Text enhancement effects

**Custom Effects:**
Use the \`apply-effect\` tool with specific effect match names for precise control.`,

      troubleshooting: `# Troubleshooting

**Common Issues:**

1. **MCP Bridge not responding:**
   - Ensure the mcp-bridge-auto.jsx panel is open
   - Check the temp directory for command/result files
   - Restart After Effects if needed

2. **Effects not applying:**
   - Verify layer exists and is selected
   - Check effect match names are correct
   - Ensure layer type supports the effect

3. **Script execution errors:**
   - Check After Effects console for error messages
   - Verify script files are properly installed
   - Ensure proper file permissions

**Debug Tools:**
- Use \`get-results\` to check execution status
- Use \`test-animation\` for basic functionality testing`
    };

    const content = topic === "all" 
      ? Object.values(helpSections).join("\n\n")
      : helpSections[topic as keyof typeof helpSections] || "Help topic not found.";

    return {
      content: [{
        type: "text",
        text: content
      }]
    };
  }
);

// Enhanced run-script tool with better validation and error handling
server.tool(
  "run-script",
  "Execute a predefined script in After Effects with comprehensive parameter validation",
  {
    script: z.string().describe("Name of the predefined script to run"),
    parameters: z.record(z.any()).optional().describe("Optional parameters for the script"),
    waitForResult: z.boolean().optional().describe("Whether to wait for and return the result directly (default: false)")
  },
  async ({ script, parameters = {}, waitForResult = false }) => {
    // Enhanced script validation with descriptions
    const allowedScripts = {
      "listCompositions": "List all compositions in the project",
      "getProjectInfo": "Get detailed project information", 
      "getLayerInfo": "Get information about layers in active composition",
      "createComposition": "Create a new composition with specified settings",
      "createTextLayer": "Create a new text layer",
      "createShapeLayer": "Create a new shape layer",
      "createSolidLayer": "Create a new solid color layer",
      "setLayerProperties": "Modify properties of existing layers",
      "setLayerKeyframe": "Set keyframes for layer animations",
      "setLayerExpression": "Apply expressions to layer properties",
      "applyEffect": "Apply effects to layers",
      "applyEffectTemplate": "Apply predefined effect combinations",
      "test-animation": "Test animation functionality",
      "bridgeTestEffects": "Test MCP bridge communication"
    };
    
    if (!allowedScripts[script as keyof typeof allowedScripts]) {
      return {
        content: [{
          type: "text",
          text: `❌ Error: Script "${script}" is not allowed.\n\n**Available scripts:**\n${Object.entries(allowedScripts)
            .map(([name, desc]) => `• \`${name}\`: ${desc}`)
            .join('\n')}`
        }],
        isError: true
      };
    }

    try {
      // Clear any stale result data
      clearResultsFile();
      
      // Write command to file for After Effects to pick up
      writeCommandFile(script, parameters);
      
      if (waitForResult) {
        // Wait for After Effects to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Get the results
        const result = readResultsFromTempFile();
        
        return {
          content: [{
            type: "text",
            text: `✅ Script "${script}" executed successfully.\n\n**Result:**\n${result}`
          }]
        };
      } else {
        return {
          content: [{
            type: "text",
            text: `✅ Command to run "${script}" has been queued successfully.\n\n` +
                  `📋 **Next steps:**\n` +
                  `1. Ensure the "MCP Bridge Auto" panel is open in After Effects\n` +
                  `2. Wait a few seconds for execution\n` +
                  `3. Use the "get-results" tool to check for results\n\n` +
                  `📁 **Parameters:** ${Object.keys(parameters).length > 0 ? JSON.stringify(parameters, null, 2) : 'None'}`
          }]
        };
      }
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error queuing command: ${String(error)}\n\n` +
                `🔧 **Troubleshooting:**\n` +
                `• Check that After Effects is running\n` +
                `• Ensure MCP Bridge Auto panel is open\n` +
                `• Verify script parameters are valid`
        }],
        isError: true
      };
    }
  }
);

// Enhanced get-results tool with better formatting
server.tool(
  "get-results",
  "Retrieve and format results from the last script executed in After Effects",
  {
    format: z.enum(["raw", "formatted", "summary"]).optional().describe("Result display format (default: formatted)")
  },
  async ({ format = "formatted" }) => {
    try {
      const result = readResultsFromTempFile();
      
      if (format === "raw") {
        return {
          content: [{
            type: "text",
            text: result
          }]
        };
      }
      
      let parsedResult;
      try {
        parsedResult = JSON.parse(result);
      } catch {
        parsedResult = { message: result };
      }
      
      if (format === "summary" && typeof parsedResult === 'object') {
        const summary = Object.keys(parsedResult).length > 0 
          ? `📊 **Result Summary:**\n${Object.keys(parsedResult).map(key => `• ${key}`).join('\n')}`
          : "📭 No structured data available";
          
        return {
          content: [{
            type: "text",
            text: summary
          }]
        };
      }
      
      // Formatted display
      const formattedResult = typeof parsedResult === 'object' 
        ? `📋 **Execution Results:**\n\`\`\`json\n${JSON.stringify(parsedResult, null, 2)}\n\`\`\``
        : `📋 **Execution Results:**\n${result}`;
        
      return {
        content: [{
          type: "text",
          text: formattedResult
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error retrieving results: ${String(error)}\n\n` +
                `🔧 **Possible causes:**\n` +
                `• No script has been executed yet\n` +
                `• After Effects hasn't finished processing\n` +
                `• MCP Bridge Auto panel is not running`
        }],
        isError: true
      };
    }
  }
);

// Enhanced composition creation tool
server.tool(
  "create-composition",
  "Create a new composition in After Effects with comprehensive settings and validation",
  {
    name: z.string().describe("Name of the composition"),
    width: z.number().int().positive().describe("Width of the composition in pixels"),
    height: z.number().int().positive().describe("Height of the composition in pixels"),
    pixelAspect: z.number().positive().optional().describe("Pixel aspect ratio (default: 1.0)"),
    duration: z.number().positive().optional().describe("Duration in seconds (default: 10.0)"),
    frameRate: z.number().positive().optional().describe("Frame rate in frames per second (default: 30.0)"),
    backgroundColor: z.object({
      r: z.number().int().min(0).max(255),
      g: z.number().int().min(0).max(255),
      b: z.number().int().min(0).max(255)
    }).optional().describe("Background color of the composition (RGB values 0-255)"),
    preset: z.enum(["custom", "HD_1080", "4K_UHD", "HD_720", "NTSC", "PAL"]).optional().describe("Use preset dimensions (overrides width/height if not 'custom')")
  },
  async (params) => {
    try {
      // Apply preset settings if specified
      const presets = {
        "HD_1080": { width: 1920, height: 1080, frameRate: 29.97 },
        "4K_UHD": { width: 3840, height: 2160, frameRate: 29.97 },
        "HD_720": { width: 1280, height: 720, frameRate: 29.97 },
        "NTSC": { width: 720, height: 486, frameRate: 29.97 },
        "PAL": { width: 720, height: 576, frameRate: 25 }
      };
      
      let finalParams = { ...params };
      if (params.preset && params.preset !== "custom" && presets[params.preset]) {
        const preset = presets[params.preset];
        finalParams = { ...finalParams, ...preset };
      }
      
      // Validation
      if (finalParams.width > 8192 || finalParams.height > 8192) {
        return {
          content: [{
            type: "text",
            text: `⚠️ Warning: Dimensions ${finalParams.width}x${finalParams.height} are very large and may cause performance issues.\n\nRecommended maximum: 8192x8192 pixels`
          }],
          isError: true
        };
      }
      
      // Write command to file for After Effects to pick up
      writeCommandFile("createComposition", finalParams);
      
      const settingsSummary = `🎬 **Composition Settings:**
• **Name:** ${finalParams.name}
• **Dimensions:** ${finalParams.width} × ${finalParams.height}px
• **Duration:** ${finalParams.duration || 10.0}s
• **Frame Rate:** ${finalParams.frameRate || 30.0} fps
• **Pixel Aspect:** ${finalParams.pixelAspect || 1.0}
${finalParams.backgroundColor ? `• **Background:** RGB(${finalParams.backgroundColor.r}, ${finalParams.backgroundColor.g}, ${finalParams.backgroundColor.b})` : ''}
${finalParams.preset && finalParams.preset !== "custom" ? `• **Preset:** ${finalParams.preset}` : ''}`;
      
      return {
        content: [{
          type: "text",
          text: `✅ Composition creation command queued successfully.\n\n${settingsSummary}\n\n` +
                `📋 **Next steps:**\n` +
                `1. Ensure the "MCP Bridge Auto" panel is open in After Effects\n` +
                `2. Wait a few seconds for creation\n` +
                `3. Use "get-results" to confirm creation and get composition details`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error queuing composition creation: ${String(error)}\n\n` +
                `🔧 **Check:**\n` +
                `• All required parameters are provided\n` +
                `• Numeric values are within valid ranges\n` +
                `• After Effects is running and accessible`
        }],
        isError: true
      };
    }
  }
);

// Enhanced keyframe tool with comprehensive validation
server.tool(
  "setLayerKeyframe",
  "Set a keyframe for a specific layer property with advanced options and validation",
  {
    compIndex: z.number().int().positive().describe("1-based index of the target composition in the project panel"),
    layerIndex: z.number().int().positive().describe("1-based index of the target layer within the composition"),
    propertyName: z.enum(["Position", "Scale", "Rotation", "Opacity", "Anchor Point"]).describe("Name of the property to keyframe"),
    timeInSeconds: z.number().min(0).describe("The time (in seconds) for the keyframe"),
    value: z.any().describe("The value for the keyframe (array for Position/Scale/AnchorPoint, number for Rotation/Opacity)"),
    easing: z.enum(["linear", "ease-in", "ease-out", "ease-in-out"]).optional().describe("Keyframe easing type (default: linear)")
  },
  async (parameters) => {
    try {
      // Validate value format based on property type
      const valueValidation = {
        "Position": (val: any) => Array.isArray(val) && val.length >= 2,
        "Scale": (val: any) => Array.isArray(val) && val.length >= 2,
        "Anchor Point": (val: any) => Array.isArray(val) && val.length >= 2,
        "Rotation": (val: any) => typeof val === 'number',
        "Opacity": (val: any) => typeof val === 'number' && val >= 0 && val <= 100
      };
      
      const validator = valueValidation[parameters.propertyName as keyof typeof valueValidation];
      if (validator && !validator(parameters.value)) {
        const expectedFormat = parameters.propertyName.includes("Position") || parameters.propertyName.includes("Scale") || parameters.propertyName.includes("Anchor") 
          ? "array [x, y] or [x, y, z]"
          : parameters.propertyName === "Opacity" ? "number between 0-100" : "number";
          
        return {
          content: [{
            type: "text",
            text: `❌ Invalid value format for ${parameters.propertyName}.\n\n` +
                  `Expected: ${expectedFormat}\n` +
                  `Received: ${JSON.stringify(parameters.value)}`
          }],
          isError: true
        };
      }
      
      // Add easing information to parameters
      const enhancedParams = {
        ...parameters,
        easing: parameters.easing || "linear"
      };
      
      // Queue the command for After Effects
      writeCommandFile("setLayerKeyframe", enhancedParams);
      
      const valueDisplay = Array.isArray(parameters.value) 
        ? `[${parameters.value.join(', ')}]`
        : parameters.value;
      
      return {
        content: [{
          type: "text",
          text: `✅ Keyframe command queued successfully.\n\n` +
                `🎯 **Keyframe Details:**\n` +
                `• **Property:** ${parameters.propertyName}\n` +
                `• **Layer:** ${parameters.layerIndex} in Composition ${parameters.compIndex}\n` +
                `• **Time:** ${parameters.timeInSeconds}s\n` +
                `• **Value:** ${valueDisplay}\n` +
                `• **Easing:** ${parameters.easing || "linear"}\n\n` +
                `Use "get-results" to confirm keyframe creation.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error setting keyframe: ${String(error)}\n\n` +
                `🔧 **Troubleshooting:**\n` +
                `• Verify layer and composition indices are correct\n` +
                `• Check that property name is exactly as specified\n` +
                `• Ensure value format matches property type`
        }],
        isError: true
      };
    }
  }
);

// Enhanced expression tool
server.tool(
  "setLayerExpression",
  "Set or remove an expression for a specific layer property with validation and examples",
  {
    compIndex: z.number().int().positive().describe("1-based index of the target composition in the project panel"),
    layerIndex: z.number().int().positive().describe("1-based index of the target layer within the composition"),
    propertyName: z.enum(["Position", "Scale", "Rotation", "Opacity", "Anchor Point"]).describe("Name of the property to apply the expression to"),
    expressionString: z.string().describe("The JavaScript expression string. Use empty string to remove expression"),
    validate: z.boolean().optional().describe("Whether to validate expression syntax (default: true)")
  },
  async (parameters) => {
    try {
      // Basic expression validation
      if (parameters.validate !== false && parameters.expressionString.trim()) {
        // Check for common expression patterns
        const commonExpressions = [
          "wiggle", "time", "value", "random", "Math.", "linear", "ease", "bounceIn", "bounceOut"
        ];
        
        const hasValidPattern = commonExpressions.some(pattern => 
          parameters.expressionString.includes(pattern)
        );
        
        if (!hasValidPattern && parameters.expressionString.length > 10) {
          return {
            content: [{
              type: "text",
              text: `⚠️ Expression may contain syntax issues.\n\n` +
                    `**Expression:** \`${parameters.expressionString}\`\n\n` +
                    `**Common patterns:** wiggle(), time, value, Math functions\n` +
                    `Set \`validate: false\` to skip this check.`
            }],
            isError: true
          };
        }
      }
      
      // Queue the command for After Effects
      writeCommandFile("setLayerExpression", parameters);
      
      const action = parameters.expressionString.trim() ? "Applied" : "Removed";
      const expressionDisplay = parameters.expressionString.trim() 
        ? `\`\`\`javascript\n${parameters.expressionString}\n\`\`\``
        : "*(removed)*";
      
      return {
        content: [{
          type: "text",
          text: `✅ Expression command queued successfully.\n\n` +
                `🎭 **Expression Details:**\n` +
                `• **Action:** ${action}\n` +
                `• **Property:** ${parameters.propertyName}\n` +
                `• **Layer:** ${parameters.layerIndex} in Composition ${parameters.compIndex}\n` +
                `• **Expression:** ${expressionDisplay}\n\n` +
                `Use "get-results" to confirm expression application.`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `❌ Error setting expression: ${String(error)}\n\n` +
                `🔧 **Troubleshooting:**\n` +
                `• Check expression syntax\n` +
                `• Verify layer and composition indices\n` +
                `• Ensure property name is correct`
        }],
        isError: true
      };
    }
  }
);

// Enhanced prompts for common After Effects tasks
server.prompt(
  "list-compositions",
  "List compositions in the current After Effects project",
  () => {
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: "Please list all compositions in the current After Effects project with their details including duration, frame rate, resolution, and number of layers."
        }
      }]
    };
  }
);

server.prompt(
  "analyze-composition",
  "Analyze a specific composition in detail",
  {
    compositionName: z.string().describe("Name of the composition to analyze")
  },
  (args) => {
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please analyze the composition named "${args.compositionName}" in the current After Effects project. Provide comprehensive details about:
          
- Basic properties (duration, frame rate, resolution, pixel aspect ratio)
- All layers in the composition with their types and properties
- Effects applied to layers
- Keyframes and animations present
- Layer hierarchy and parenting relationships
- Performance considerations and optimization suggestions

Format the analysis in a clear, structured way that would be helpful for understanding the composition's structure and content.`
        }
      }]
    };
  }
);

// Create composition prompt with comprehensive parameters
server.prompt(
  "create-composition",
  "Create a new composition with custom settings",
  {
    name: z.string().describe("Name for the new composition"),
    width: z.string().optional().describe("Width in pixels (default: 1920)"),
    height: z.string().optional().describe("Height in pixels (default: 1080)"),
    frameRate: z.string().optional().describe("Frame rate in fps (default: 30.0)"),
    duration: z.string().optional().describe("Duration in seconds (default: 10.0)"),
    preset: z.enum(["HD_1080", "4K_UHD", "HD_720", "NTSC", "PAL", "custom"]).optional().describe("Common preset or custom")
  },
  (args) => {
    const presetSpecs: Record<string, string> = {
      "HD_1080": "1920x1080, 29.97fps",
      "4K_UHD": "3840x2160, 29.97fps", 
      "HD_720": "1280x720, 29.97fps",
      "NTSC": "720x486, 29.97fps",
      "PAL": "720x576, 25fps",
      "custom": "user-defined settings"
    };
    
    const preset = args.preset || "custom";
    const presetInfo = presetSpecs[preset] || "custom settings";
    
    if (args.width && (typeof args.width !== 'number' || args.width <= 0)) {
      return { valid: false, error: "Width must be positive number" };
    }
    if (args.height && (typeof args.height !== 'number' || args.height <= 0)) {
      return { valid: false, error: "Height must be positive number" };
    }
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please create a new composition with the following specifications:

**Composition Name:** ${args.name}
**Preset:** ${preset} (${presetInfo})
**Custom Settings:**
- Width: ${args.width || 1920} pixels
- Height: ${args.height || 1080} pixels  
- Frame Rate: ${args.frameRate || 30.0} fps
- Duration: ${args.duration || 10.0} seconds

Use the create-composition tool with these parameters. After creation, provide a summary of the new composition's properties.`
        }
      }]
    };
  }
);

// Layer creation and manipulation prompts
server.prompt(
  "create-text-animation",
  "Create an animated text layer with effects",
  {
    text: z.string().describe("Text content to display"),
    animation: z.enum(["fade-in", "slide-up", "type-on", "scale-in", "bounce"]).describe("Animation style"),
    duration: z.string().optional().describe("Animation duration in seconds (default: 2.0)"),
    font: z.string().optional().describe("Font family (default: Arial)"),
    size: z.string().optional().describe("Font size (default: 72)")
  },
  (args) => {
    const animationDescriptions: Record<string, string> = {
      "fade-in": "gradually increase opacity from 0% to 100%",
      "slide-up": "move from bottom of screen upward while fading in",
      "type-on": "reveal characters one by one like typing",
      "scale-in": "grow from small size to full size",
      "bounce": "animate in with a bouncing motion using scale and position"
    };
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please create an animated text layer with the following specifications:

**Text:** "${args.text}"
**Animation Style:** ${args.animation} - ${animationDescriptions[args.animation] || args.animation}
**Duration:** ${args.duration || 2.0} seconds
**Font:** ${args.font || "Arial"}
**Size:** ${args.size || 72} pixels

Steps to implement:
1. Create a text layer with the specified text and styling
2. Set up keyframes to create the ${args.animation} animation
3. Apply appropriate easing curves for smooth motion
4. Add any complementary effects if needed (glow, drop shadow, etc.)

Provide details about the keyframes and timing used for the animation.`
        }
      }]
    };
  }
);

server.prompt(
  "apply-cinematic-effects",
  "Apply cinematic color grading and effects to enhance footage",
  {
    style: z.enum(["warm-sunset", "cool-blue", "vintage", "high-contrast", "desaturated", "teal-orange"]).describe("Cinematic style to apply"),
    intensity: z.enum(["subtle", "moderate", "strong"]).optional().describe("Effect intensity (default: moderate)"),
    targetLayers: z.string().optional().describe("Comma-separated layer indices to apply effects to (e.g., '1,2,3')")
  },
  (args) => {
    const styleDescriptions: Record<string, string> = {
      "warm-sunset": "warm orange and yellow tones with soft highlights",
      "cool-blue": "cool blue tones with enhanced shadows",
      "vintage": "aged film look with reduced saturation and grain",
      "high-contrast": "dramatic blacks and whites with enhanced contrast",
      "desaturated": "muted colors with slight sepia tinting",
      "teal-orange": "popular cinematic look with teal shadows and orange highlights"
    };
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please apply cinematic color grading with the following parameters:

**Style:** ${args.style} - ${styleDescriptions[args.style] || args.style}
**Intensity:** ${args.intensity || "moderate"}
**Target Layers:** ${args.targetLayers ? `Layers ${args.targetLayers}` : "All appropriate layers"}

Implementation approach:
1. Apply color correction effects (Curves, Color Balance, Exposure)
2. Add stylistic effects for the ${args.style} look
3. Fine-tune parameters for ${args.intensity || "moderate"} intensity
4. Consider adding complementary effects like vignetting or film grain if appropriate
5. Ensure effects work well together and maintain natural skin tones where applicable

Provide details about which effects were applied and their settings.`
        }
      }]
    };
  }
);

server.prompt(
  "optimize-composition",
  "Analyze and optimize composition performance",
  {
    targetComposition: z.string().optional().describe("Name of composition to optimize (default: active composition)"),
    focus: z.enum(["render-speed", "memory-usage", "file-size", "quality", "all"]).optional().describe("Optimization focus area")
  },
  (args) => {
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please analyze and optimize the composition for better performance:

**Target:** ${args.targetComposition || "Active composition"}
**Focus Area:** ${args.focus || "all"}

Analysis should cover:
1. **Layer Organization:** Check layer naming, grouping, and hierarchy
2. **Effects Usage:** Identify resource-intensive effects and suggest alternatives
3. **Resolution & Settings:** Verify appropriate composition settings
4. **Pre-composition Opportunities:** Suggest where pre-comps could improve performance
5. **Render Optimization:** Recommend render settings and caching strategies
6. **Memory Management:** Identify layers that could be optimized or disabled when not needed

Provide specific recommendations with before/after comparisons where possible.`
        }
      }]
    };
  }
);

server.prompt(
  "troubleshoot-project",
  "Diagnose and troubleshoot common After Effects issues",
  {
    issue: z.enum(["slow-performance", "missing-footage", "render-errors", "memory-problems", "effect-issues", "audio-sync"]).describe("Type of issue to troubleshoot"),
    details: z.string().optional().describe("Additional details about the problem")
  },
  (args) => {
    const troubleshootingGuides = {
      "slow-performance": "performance optimization including preview settings, cache management, and resource usage",
      "missing-footage": "locating missing media files and relinking assets",
      "render-errors": "identifying and resolving common render failures and codec issues",
      "memory-problems": "managing RAM usage and optimizing memory allocation",
      "effect-issues": "debugging effect problems and plugin conflicts",
      "audio-sync": "fixing audio synchronization and timing problems"
    };
    
    return {
      messages: [{
        role: "user",
        content: {
          type: "text",
          text: `Please help troubleshoot this After Effects issue:

**Issue Type:** ${args.issue}
**Description:** ${troubleshootingGuides[args.issue]}
${args.details ? `**Additional Details:** ${args.details}` : ""}

Please provide:
1. **Diagnostic Steps:** How to identify the root cause
2. **Common Causes:** What typically leads to this issue
3. **Solutions:** Step-by-step fixes ordered by likelihood of success
4. **Prevention:** How to avoid this issue in the future
5. **Alternative Approaches:** Different methods if primary solutions don't work

Include specific After Effects menu locations and settings where relevant.`
        }
      }]
    };
  }
);

// Add a tool for applying effects to layers
server.tool(
  "apply-effect",
  "Apply an effect to a layer in After Effects",
  {
    compIndex: z.number().int().positive().describe("1-based index of the target composition in the project panel."),
    layerIndex: z.number().int().positive().describe("1-based index of the target layer within the composition."),
    effectName: z.string().optional().describe("Display name of the effect to apply (e.g., 'Gaussian Blur')."),
    effectMatchName: z.string().optional().describe("After Effects internal name for the effect (more reliable, e.g., 'ADBE Gaussian Blur 2')."),
    effectCategory: z.string().optional().describe("Optional category for filtering effects."),
    presetPath: z.string().optional().describe("Optional path to an effect preset file (.ffx)."),
    effectSettings: z.record(z.any()).optional().describe("Optional parameters for the effect (e.g., { 'Blurriness': 25 })."),
    waitForResult: z.boolean().optional().describe("Whether to wait for the result and return it directly (default: false).")
  },
  async (parameters) => {
    try {
      // Clear any stale result data if waiting for result
      if (parameters.waitForResult) {
        clearResultsFile();
      }
      
      // Queue the command for After Effects
      writeCommandFile("applyEffect", parameters);
      
      if (parameters.waitForResult) {
        // Wait a bit for After Effects to process the command
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the results
        const result = readResultsFromTempFile();
        
        return {
          content: [
            {
              type: "text",
              text: result
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Command to apply effect to layer ${parameters.layerIndex} in composition ${parameters.compIndex} has been queued.\n` +
                    `Use the "get-results" tool after a few seconds to check for confirmation.`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error applying effect: ${String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Add a tool for applying effect templates
server.tool(
  "apply-effect-template",
  "Apply a predefined effect template to a layer in After Effects",
  {
    compIndex: z.number().int().positive().describe("1-based index of the target composition in the project panel."),
    layerIndex: z.number().int().positive().describe("1-based index of the target layer within the composition."),
    templateName: z.enum([
      "gaussian-blur", 
      "directional-blur", 
      "color-balance", 
      "brightness-contrast",
      "curves",
      "glow",
      "drop-shadow",
      "cinematic-look",
      "text-pop"
    ]).describe("Name of the effect template to apply."),
    customSettings: z.record(z.any()).optional().describe("Optional custom settings to override defaults."),
    waitForResult: z.boolean().optional().describe("Whether to wait for the result and return it directly (default: false).")
  },
  async (parameters) => {
    try {
      // Clear any stale result data if waiting for result
      if (parameters.waitForResult) {
        clearResultsFile();
      }
      
      // Queue the command for After Effects
      writeCommandFile("applyEffectTemplate", parameters);
      
      if (parameters.waitForResult) {
        // Wait a bit for After Effects to process the command
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Get the results
        const result = readResultsFromTempFile();
        
        return {
          content: [
            {
              type: "text",
              text: result
            }
          ]
        };
      } else {
        return {
          content: [
            {
              type: "text",
              text: `Command to apply effect template '${parameters.templateName}' to layer ${parameters.layerIndex} in composition ${parameters.compIndex} has been queued.\n` +
                    `Use the "get-results" tool after a few seconds to check for confirmation.`
            }
          ]
        };
      }
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error applying effect template: ${String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Update help information to include the new effects tools
server.tool(
  "mcp_aftereffects_get_effects_help",
  "Get help on using After Effects effects",
  {},
  async () => {
    return {
      content: [
        {
          type: "text",
          text: `# After Effects Effects Help

## Available Tools

### apply-effect
Apply an effect to a layer in After Effects.

**Parameters:**
- \`compIndex\`: 1-based index of the target composition
- \`layerIndex\`: 1-based index of the target layer
- \`effectName\`: Display name of the effect (optional)
- \`effectMatchName\`: After Effects internal name (recommended, optional)
- \`effectCategory\`: Category for filtering effects (optional)
- \`presetPath\`: Path to effect preset file (.ffx) (optional)
- \`effectSettings\`: Parameters for the effect (optional)
- \`waitForResult\`: Whether to wait for result and return it directly (optional, default: false)

### apply-effect-template
Apply a predefined effect template to a layer.

**Parameters:**
- \`compIndex\`: 1-based index of the target composition
- \`layerIndex\`: 1-based index of the target layer
- \`templateName\`: Name of the effect template to apply
- \`customSettings\`: Custom settings to override defaults (optional)
- \`waitForResult\`: Whether to wait for result and return it directly (optional, default: false)

## Common Effect Match Names
These are internal names used by After Effects that can be used with the \`effectMatchName\` parameter:

### Blur & Sharpen
- Gaussian Blur: "ADBE Gaussian Blur 2"
- Camera Lens Blur: "ADBE Camera Lens Blur"
- Directional Blur: "ADBE Motion Blur"
- Radial Blur: "ADBE Radial Blur"
- Smart Blur: "ADBE Smart Blur"
- Unsharp Mask: "ADBE Unsharp Mask"

### Color Correction
- Brightness & Contrast: "ADBE Brightness & Contrast 2"
- Color Balance: "ADBE Color Balance (HLS)"
- Color Balance (RGB): "ADBE Pro Levels2"
- Curves: "ADBE CurvesCustom"
- Exposure: "ADBE Exposure2"
- Hue/Saturation: "ADBE HUE SATURATION"
- Levels: "ADBE Pro Levels2"
- Vibrance: "ADBE Vibrance"

### Stylistic
- Glow: "ADBE Glo2"
- Drop Shadow: "ADBE Drop Shadow"
- Bevel Alpha: "ADBE Bevel Alpha"
- Noise: "ADBE Noise"
- Fractal Noise: "ADBE Fractal Noise"
- CC Particle World: "CC Particle World"
- CC Light Sweep: "CC Light Sweep"

## Effect Templates
The following predefined effect templates are available:

- \`gaussian-blur\`: Simple Gaussian blur effect
- \`directional-blur\`: Motion blur in a specific direction
- \`color-balance\`: Adjust hue, lightness, and saturation
- \`brightness-contrast\`: Basic brightness and contrast adjustment
- \`curves\`: Advanced color adjustment using curves
- \`glow\`: Add a glow effect to elements
- \`drop-shadow\`: Add a customizable drop shadow
- \`cinematic-look\`: Combination of effects for a cinematic appearance
- \`text-pop\`: Effects to make text stand out (glow and shadow)

## Usage Examples

### Apply Gaussian Blur with immediate result:
\`\`\`json
{
  "compIndex": 1,
  "layerIndex": 1,
  "effectMatchName": "ADBE Gaussian Blur 2",
  "effectSettings": {
    "Blurriness": 25
  },
  "waitForResult": true
}
\`\`\`

### Apply effect template without waiting:
\`\`\`json
{
  "compIndex": 1,
  "layerIndex": 1,
  "templateName": "cinematic-look",
  "waitForResult": false
}
\`\`\`

### Apply effect and queue for later result check:
\`\`\`json
{
  "compIndex": 1,
  "layerIndex": 1,
  "effectName": "Drop Shadow",
  "effectSettings": {
    "Distance": 10,
    "Softness": 5
  }
}
\`\`\`

**Note:** When \`waitForResult\` is false or omitted, use the \`get-results\` tool to check for execution results.`
        }
      ]
    };
  }
);

// Add a direct tool for our bridge test effects
server.tool(
  "run-bridge-test",
  "Run the bridge test effects script to verify communication and apply test effects",
  {},
  async () => {
    try {
      // Clear any stale result data
      clearResultsFile();
      
      // Write command to file for After Effects to pick up
      writeCommandFile("bridgeTestEffects", {});
      
      return {
        content: [
          {
            type: "text",
            text: `Bridge test effects command has been queued.\n` +
                  `Please ensure the "MCP Bridge Auto" panel is open in After Effects.\n` +
                  `Use the "get-results" tool after a few seconds to check for the test results.`
          }
        ]
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error queuing bridge test command: ${String(error)}`
          }
        ],
        isError: true
      };
    }
  }
);

// Start the MCP server
async function main() {
  console.error("After Effects MCP Server starting...");
  console.error(`Scripts directory: ${SCRIPTS_DIR}`);
  console.error(`Temp directory: ${TEMP_DIR}`);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("After Effects MCP Server running...");
}

main().catch(error => {
  console.error("Fatal error:", error);
  process.exit(1);
});