import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { 
  MCPPromptResponse,
  analyzeProjectPromptSchema,
  createAnimationPromptSchema
} from "../types/index.js";

export function setupPrompts(server: McpServer) {
  // Enhanced project analysis prompt
  server.prompt(
    "analyze-project",
    "Deep analysis of After Effects project structure, performance, and optimization suggestions",
    analyzeProjectPromptSchema.shape,
    (args): MCPPromptResponse => {
      const analysisPrompts: Record<string, string> = {
        structure: "Please analyze the current After Effects project structure, including composition hierarchy, layer organization, resource usage, and project complexity.",
        performance: "Please evaluate project performance, including rendering efficiency, memory usage, cache status, and potential performance bottlenecks.",
        optimization: "Please provide project optimization suggestions, including pre-composition suggestions, proxy usage, effect optimization, and workflow improvement.",
        comprehensive: "Please perform a comprehensive project analysis, covering structure, performance, optimization suggestions, and best practices."
      };

      const includeRecommendations = args.includeRecommendations === "yes" || args.includeRecommendations === "true";

      return {
        messages: [{
          role: "user",
          content: {
            type: "text",
            text: `${analysisPrompts[args.analysisType] || analysisPrompts.comprehensive}

Please provide analysis in the following structure:

## 📊 Project Overview
- Total compositions and types
- Total layers and average complexity  
- Used effects and plugins
- Project file size and resource count

## 🔍 Detailed Analysis  
- Project structure hierarchy
- Resource utilization
- Performance key points
- Potential issues identification

${includeRecommendations ? `
## 💡 Optimization Suggestions
- Structure optimization plan
- Performance improvement strategy
- Workflow improvement suggestions
- Best practice suggestions
` : ""}

Please use related MCP tools to get project data for analysis.`
          }
        }]
      };
    }
  );

  // Animation creation assistant prompt
  server.prompt(
    "create-animation", 
    "Help create various types of animation effects",
    createAnimationPromptSchema.shape,
    (args): MCPPromptResponse => {
      const animationGuides: Record<string, string> = {
        text: "Text Animation - Includes appearance, disappearance, and dynamic effects",
        logo: "Logo Animation - Brand showcase and identifier effect", 
        transition: "Transition Animation - Scene switching and transition effect",
        ui: "UI Animation - User interface element effect",
        "motion-graphics": "Motion Graphics - Compound graphic animation"
      };

      return {
        messages: [{
          role: "user", 
          content: {
            type: "text",
            text: `Please help create ${animationGuides[args.animationType] || animationGuides.text}:

## 🎬 Animation Requirements
- **Type**: ${args.animationType}
- **Style**: ${args.style}
- **Duration**: ${args.duration || 'TBD'} seconds
- **Complexity**: ${args.complexity || 'Medium'}

## 🛠️ Production Plan
Please provide the following:

1. **Animation Decomposition**: Decompose animation into key steps
2. **Layer Planning**: Type and structure of layers needed
3. **Keyframe Setting**: Time points and values of main keyframes
4. **Effect Application**: Recommended effect and parameter settings
5. **Optimization Suggestions**: Performance optimization and best practices

Please use MCP tools to gradually implement animation effects.`
          }
        }]
      };
    }
  );
} 