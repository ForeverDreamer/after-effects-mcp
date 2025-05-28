import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import * as fs from "fs";
import { 
  AECommandManager, 
  FileManager, 
  getCommandFilePath, 
  getResultFilePath,
  SCRIPTS_DIR,
  TEMP_DIR,
  delay 
} from "../utils/index.js";
import { MCPResourceResponse } from "../types/index.js";

export function setupResources(server: McpServer) {
  // Common resource processing function
  async function createResource(
    name: string, 
    uri: string, 
    command: string, 
    args: Record<string, any> = {}
  ): Promise<MCPResourceResponse> {
    try {
      AECommandManager.clearResults();
      AECommandManager.writeCommand(command, args);
      
      await delay(1000);
      const result = AECommandManager.readResults();
      
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: result.success ? JSON.stringify(result.data, null, 2) : JSON.stringify({ 
            error: "Failed to get data", 
            message: result.error,
            timestamp: new Date().toISOString()
          })
        }],
        _meta: {}
      };
    } catch (error: unknown) {
      return {
        contents: [{
          uri,
          mimeType: "application/json",
          text: JSON.stringify({ 
            error: `Failed to get ${name}`, 
            message: String(error),
            timestamp: new Date().toISOString()
          })
        }],
        _meta: {}
      };
    }
  }

  // Compositions list resource
  server.resource(
    "compositions",
    "aftereffects://compositions",
    async (uri: any) => createResource("Compositions List", uri.href, "listCompositions")
  );

  // Project info resource
  server.resource(
    "project-info",
    "aftereffects://project/info",
    async (uri: any) => createResource("Project Info", uri.href, "getProjectInfo")
  );

  // Current composition layer info resource
  server.resource(
    "layers",
    "aftereffects://composition/active/layers",
    async (uri: any) => createResource("Layer Info", uri.href, "getLayerInfo")
  );

  // Effect templates resource - Enhanced version
  server.resource(
    "effect-templates",
    "aftereffects://effects/templates",
    async (uri: any): Promise<MCPResourceResponse> => {
      const enhancedTemplates = {
        // Basic effect templates
        basic: {
          "gaussian-blur": {
            description: "Gaussian Blur - Used to create a soft blur effect",
            category: "blur",
            matchName: "ADBE Gaussian Blur 2",
            parameters: {
              "blurriness": { 
                type: "number", 
                default: 20, 
                range: [0, 1000], 
                description: "Blur amount",
                unit: "pixels"
              }
            },
            usage: "Applicable for background blurring, focus effects, etc.",
            performance: "Medium"
          },
          "drop-shadow": {
            description: "Drop Shadow - Adds shadow to a layer",
            category: "stylize",
            matchName: "ADBE Drop Shadow",
            parameters: {
              "color": { type: "color", default: [0, 0, 0, 1], description: "Shadow color" },
              "opacity": { type: "number", default: 50, range: [0, 100], unit: "%" },
              "direction": { type: "number", default: 135, range: [0, 360], unit: "degrees" },
              "distance": { type: "number", default: 10, range: [0, 500], unit: "pixels" },
              "softness": { type: "number", default: 10, range: [0, 100], unit: "pixels" }
            },
            usage: "Adds depth and texture to text, graphics, etc.",
            performance: "Low"
          }
        },
        
        // Composite effect templates
        composite: {
          "cinematic-look": {
            description: "Cinematic Look - Professional color grading effect combination",
            category: "color-grading",
            effects: [
              { matchName: "ADBE CurvesCustom", description: "Curves adjustment" },
              { matchName: "ADBE Vibrance", description: "Natural saturation" },
              { matchName: "ADBE Vignette", description: "Vignette effect" }
            ],
            parameters: {
              "vibrance": { type: "number", default: 15, range: [-100, 100] },
              "saturation": { type: "number", default: -5, range: [-100, 100] },
              "vignette_amount": { type: "number", default: 15, range: [0, 100] }
            },
            usage: "Used to create professional cinematic color effects",
            performance: "High"
          },
          "text-enhancement": {
            description: "Text Enhancement - Effect combination to make text more prominent",
            category: "text",
            effects: [
              { matchName: "ADBE Drop Shadow", description: "Drop Shadow" },
              { matchName: "ADBE Glow", description: "Glow" },
              { matchName: "ADBE Stroke", description: "Stroke" }
            ],
            parameters: {
              "shadow_opacity": { type: "number", default: 75, range: [0, 100] },
              "glow_intensity": { type: "number", default: 1.5, range: [0, 5] },
              "stroke_width": { type: "number", default: 2, range: [0, 20] }
            },
            usage: "Keeps text clear and readable in complex backgrounds",
            performance: "Medium"
          }
        },
        
        // Animation presets
        animation: {
          "smooth-scale": {
            description: "Smooth Scale Animation",
            type: "keyframe-preset",
            property: "Scale",
            keyframes: [
              { time: 0, value: [0, 0], easing: "easeOut" },
              { time: 1, value: [100, 100], easing: "easeOut" }
            ]
          },
          "fade-in-up": {
            description: "Fade-in Up Animation",
            type: "keyframe-preset",
            properties: {
              "Opacity": [
                { time: 0, value: 0 },
                { time: 1, value: 100 }
              ],
              "Position": [
                { time: 0, value: [0, 50], relative: true },
                { time: 1, value: [0, 0], relative: true }
              ]
            }
          }
        },
        
        metadata: {
          version: "2.0.0",
          lastUpdated: new Date().toISOString(),
          totalTemplates: 0,
          categories: ["blur", "stylize", "color-grading", "text", "animation"]
        }
      };

      // Calculate total templates
      enhancedTemplates.metadata.totalTemplates = 
        Object.keys(enhancedTemplates.basic).length + 
        Object.keys(enhancedTemplates.composite).length + 
        Object.keys(enhancedTemplates.animation).length;

      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(enhancedTemplates, null, 2)
        }],
        _meta: {}
      };
    }
  );

  // System status resource
  server.resource(
    "system-status",
    "aftereffects://system/status",
    async (uri: any): Promise<MCPResourceResponse> => {
      const status = {
        mcpServer: {
          version: "2.0.0",
          status: "running",
          startTime: new Date().toISOString()
        },
        afterEffects: {
          connectionStatus: "unknown",
          lastCommandTime: null as string | null,
          bridgePanelRequired: true
        },
        files: {
          scriptsDirectory: SCRIPTS_DIR,
          tempDirectory: TEMP_DIR,
          commandFile: getCommandFilePath(),
          resultFile: getResultFilePath()
        },
        capabilities: [
          "composition-management",
          "layer-creation",
          "effect-application",
          "keyframe-animation",
          "project-analysis"
        ]
      };

      // Check file status
      try {
        const commandFileExists = fs.existsSync(getCommandFilePath());
        const resultFileExists = fs.existsSync(getResultFilePath());
        
        if (resultFileExists) {
          const resultAge = FileManager.getFileAge(getResultFilePath());
          status.afterEffects.lastCommandTime = new Date(Date.now() - resultAge).toISOString();
          status.afterEffects.connectionStatus = resultAge < 60000 ? "recent" : "stale";
        }
      } catch (error) {
        status.afterEffects.connectionStatus = "error";
      }

      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(status, null, 2)
        }],
        _meta: {}
      };
    }
  );

  // Performance monitoring resource
  server.resource(
    "performance-metrics",
    "aftereffects://system/performance",
    async (uri: any): Promise<MCPResourceResponse> => {
      const metrics = {
        timestamp: new Date().toISOString(),
        memory: {
          used: process.memoryUsage().heapUsed,
          total: process.memoryUsage().heapTotal,
          external: process.memoryUsage().external
        },
        system: {
          platform: process.platform,
          nodeVersion: process.version,
          uptime: process.uptime()
        },
        operations: {
          totalCommands: 0, // This can be tracked by a counter
          successRate: "N/A",
          averageResponseTime: "N/A"
        },
        recommendations: [
          "Regularly restart After Effects to release memory",
          "Close unnecessary compositions to improve performance",
          "Use proxy files to reduce preview burden",
          "Enable disk cache for faster rendering"
        ]
      };

      return {
        contents: [{
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(metrics, null, 2)
        }],
        _meta: {}
      };
    }
  );
} 