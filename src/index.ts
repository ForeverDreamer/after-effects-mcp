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

// Legacy helper function for backward compatibility (DEPRECATED)
// Note: This function is kept for backward compatibility but is no longer used
// in the current architecture. All operations now go through the MCP Bridge Auto panel.
function runExtendScript(scriptPath: string, args: Record<string, any> = {}): string {
  // This function is deprecated as we now use the MCP Bridge Auto panel
  // for all script execution via command files
  console.warn("runExtendScript is deprecated. Use the MCP Bridge Auto panel instead.");
  
  return `Deprecated: Direct script execution is no longer supported. 
Use the MCP Bridge Auto panel in After Effects with the run-script tool instead.
Ensure After Effects is running with the MCP Bridge Auto panel open.`;
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