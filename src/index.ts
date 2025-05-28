import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import * as fs from "fs";
import { SCRIPTS_DIR, TEMP_DIR } from "./utils/index.js";
import { setupResources } from "./resources/index.js";
import { setupTools } from "./tools/index.js";
import { setupPrompts } from "./prompts/index.js";

// Create an MCP server
const server = new McpServer({
  name: "AfterEffectsServer",
  version: "2.0.0"
});

// Setup all modules
setupResources(server);
setupTools(server);
setupPrompts(server);

// Legacy helper function for backward compatibility
import { execSync } from "child_process";
import * as path from "path";

// Helper function to run After Effects scripts (kept for compatibility)
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

// Start the MCP server
async function main() {
  console.error("🚀 After Effects MCP Server v2.0 Starting...");
  console.error(`📂 Script Directory: ${SCRIPTS_DIR}`);
  console.error(`📁 Temporary Directory: ${TEMP_DIR}`);
  
  // Ensure directory exists
  [SCRIPTS_DIR, TEMP_DIR].forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.error(`✅ Created directory: ${dir}`);
    }
  });
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("🎉 After Effects MCP Server Running, Waiting for Connection...");
  console.error("💡 Please ensure After Effects is started and MCP Bridge Auto panel is open");
}

main().catch(error => {
  console.error("❌ Server Start Failed:", error);
  process.exit(1);
}); 