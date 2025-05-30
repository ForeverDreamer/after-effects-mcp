// mcp-bridge-auto.jsx
// Auto-running MCP Bridge panel for After Effects

// JSON Polyfill for ExtendScript
if (typeof JSON === "undefined") {
    JSON = {
        stringify: function(obj, replacer, space) {
            function serialize(obj) {
                if (obj === null) return "null";
                if (typeof obj === "undefined") return "undefined";
                if (typeof obj === "string") return '"' + obj.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + '"';
                if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
                if (obj instanceof Array) {
                    var items = [];
                    for (var i = 0; i < obj.length; i++) {
                        items.push(serialize(obj[i]));
                    }
                    return "[" + items.join(",") + "]";
                }
                if (typeof obj === "object") {
                    var items = [];
                    for (var key in obj) {
                        if (obj.hasOwnProperty(key)) {
                            items.push(serialize(key) + ":" + serialize(obj[key]));
                        }
                    }
                    return "{" + items.join(",") + "}";
                }
                return "null";
            }
            
            var result = serialize(obj);
            
            // Simple formatting if space is provided
            if (space && typeof space === "number" && space > 0) {
                var indent = "";
                for (var i = 0; i < space; i++) indent += " ";
                
                // Basic pretty printing
                result = result.replace(/,/g, ",\n" + indent);
                result = result.replace(/\{/g, "{\n" + indent);
                result = result.replace(/\}/g, "\n}");
                result = result.replace(/\[/g, "[\n" + indent);
                result = result.replace(/\]/g, "\n]");
            }
            
            return result;
        },
        
        parse: function(text) {
            // Remove leading/trailing whitespace
            text = text.replace(/^\s+|\s+$/g, "");
            
            // Check for empty or clearly invalid input
            if (!text || text.length === 0) {
                throw new Error("Invalid JSON: Empty input");
            }
            
            // Basic validation before parsing
            if (text.charAt(0) !== '{' && text.charAt(0) !== '[') {
                throw new Error("Invalid JSON: Must start with { or [");
            }
            
            // Use eval for parsing (note: this is generally unsafe but acceptable in controlled ExtendScript environment)
            try {
                return eval("(" + text + ")");
            } catch (e) {
                throw new Error("Invalid JSON: " + e.toString());
            }
        }
    };
}

// Date.prototype.toISOString polyfill for ExtendScript
if (!Date.prototype.toISOString) {
    Date.prototype.toISOString = function() {
        function pad(number) {
            if (number < 10) {
                return '0' + number;
            }
            return number;
        }
        
        return this.getUTCFullYear() + '-' +
               pad(this.getUTCMonth() + 1) + '-' +
               pad(this.getUTCDate()) + 'T' +
               pad(this.getUTCHours()) + ':' +
               pad(this.getUTCMinutes()) + ':' +
               pad(this.getUTCSeconds()) + '.' +
               (this.getUTCMilliseconds() / 1000).toFixed(3).slice(2, 5) + 'Z';
    };
}

// Include modular function definitions
//@include "functions/createComposition.jsx"
//@include "functions/createTextLayer.jsx"
//@include "functions/createShapeLayer.jsx"
//@include "functions/createSolidLayer.jsx"
//@include "functions/setLayerProperties.jsx"
//@include "functions/setLayerKeyframe.jsx"
//@include "functions/setLayerExpression.jsx"
//@include "functions/applyEffect.jsx"
//@include "functions/batchApplyEffects.jsx"
//@include "functions/applyEffectTemplate.jsx"
//@include "functions/getProjectInfo.jsx"
//@include "functions/listCompositions.jsx"
//@include "functions/getLayerInfo.jsx"

// --- Additional Functions ---

// --- Application Functions ---

// Create panel interface
var panel = (this instanceof Panel) ? this : new Window("palette", "MCP Bridge Auto", undefined);
panel.orientation = "column";
panel.alignChildren = ["fill", "top"];
panel.spacing = 10;
panel.margins = 16;
panel.preferredSize.width = 520;

// Status display
var statusText = panel.add("statictext", undefined, "Waiting for commands...");
statusText.alignment = ["fill", "top"];

// Add log area
var logPanel = panel.add("panel", undefined, "Command Log");
logPanel.orientation = "column";
logPanel.alignChildren = ["fill", "fill"];
logPanel.preferredSize.width = 500;
var logText = logPanel.add("edittext", undefined, "", {multiline: true, readonly: true});
logText.preferredSize.height = 200;
logText.preferredSize.width = 480;

// Auto-run checkbox
var autoRunCheckbox = panel.add("checkbox", undefined, "Auto-run commands");
autoRunCheckbox.value = true;

// Check interval (ms)
var checkInterval = 2000;
var isChecking = false;
var lastProcessedTimestamp = 0;

// Helper function to safely read and validate JSON file
function safeReadJSONFile(filePath, suppressNotFoundLog) {
    var file = new File(filePath);
    if (!file.exists) {
        return null;
    }
    
    var maxRetries = 5;
    var retryCount = 0;
    var content = "";
    var isValidJSON = false;
    
    while (retryCount < maxRetries && !isValidJSON) {
        try {
            file.open("r");
            content = file.read();
            file.close();
            
            if (content && content.length > 0) {
                content = content.replace(/^\s+|\s+$/g, "");
                
                if (content.charAt(0) === '{' && content.charAt(content.length - 1) === '}') {
                    var openBraces = 0;
                    var closeBraces = 0;
                    var inString = false;
                    var escapeNext = false;
                    
                    for (var i = 0; i < content.length; i++) {
                        var ch = content.charAt(i);
                        
                        if (escapeNext) {
                            escapeNext = false;
                        } else if (ch === '\\') {
                            escapeNext = true;
                        } else if (ch === '"') {
                            inString = !inString;
                        } else if (!inString) {
                            if (ch === '{') openBraces++;
                            if (ch === '}') closeBraces++;
                        }
                    }
                    
                    if (openBraces === closeBraces && openBraces > 0 && !inString && !escapeNext) {
                        try {
                            var parsed = JSON.parse(content);
                            return parsed;
                        } catch (parseTest) {
                            if (retryCount === 0) {
                                logToPanel("JSON parse attempt failed, retrying... (content preview: " + content.substring(0, 50) + "...)");
                            }
                        }
                    }
                }
            } else {
                if (retryCount === 0) {
                    logToPanel("Command file appears to be empty, waiting for content...");
                }
            }
        } catch (fileError) {
            if (retryCount === 0) {
                logToPanel("File read attempt failed: " + fileError.toString());
            }
        }
        
        retryCount++;
        if (retryCount < maxRetries) {
            for (var j = 0; j < 3000000; j++) { /* delay */ }
        }
    }
    
    if (retryCount >= maxRetries && content && content.length > 0) {
        logToPanel("Failed to parse JSON after " + maxRetries + " attempts from: " + filePath + " (content length: " + content.length + ")");
    }
    
    return null;
}

// Command file path
function getCommandFilePath() {
    var tempFolder = Folder.temp;
    return tempFolder.fsName + "/ae_command.json";
}

// Result file path
function getResultFilePath() {
    var tempFolder = Folder.temp;
    return tempFolder.fsName + "/ae_mcp_result.json";
}

// Execute command
function executeCommand(command, args) {
    var result = "";
    
    logToPanel("Executing command: " + command);
    statusText.text = "Running: " + command;
    panel.update();
    
    try {
        logToPanel("Attempting to execute: " + command);
        switch (command) {
            case "getProjectInfo":
                result = getProjectInfo();
                break;
            case "listCompositions":
                result = listCompositions();
                break;
            case "getLayerInfo":
                result = getLayerInfo();
                break;
            case "createComposition":
                logToPanel("Calling createComposition function...");
                result = createComposition(args);
                logToPanel("Returned from createComposition.");
                break;
            case "createTextLayer":
                logToPanel("Calling createTextLayer function...");
                result = createTextLayer(args);
                logToPanel("Returned from createTextLayer.");
                break;
            case "createShapeLayer":
                logToPanel("Calling createShapeLayer function...");
                result = createShapeLayer(args);
                logToPanel("Returned from createShapeLayer. Result type: " + typeof result);
                break;
            case "createSolidLayer":
                logToPanel("Calling createSolidLayer function...");
                result = createSolidLayer(args);
                logToPanel("Returned from createSolidLayer.");
                break;
            case "setLayerProperties":
                logToPanel("Calling setLayerProperties function...");
                result = setLayerProperties(args);
                logToPanel("Returned from setLayerProperties.");
                break;
            case "setLayerKeyframe":
                logToPanel("Calling setLayerKeyframe function...");
                result = setLayerKeyframe(args.compName, args.layerIndex, args.propertyName, args.timeInSeconds, args.value);
                logToPanel("Returned from setLayerKeyframe.");
                break;
            case "setLayerExpression":
                logToPanel("Calling setLayerExpression function...");
                result = setLayerExpression(args.compName, args.layerIndex, args.propertyName, args.expressionString);
                logToPanel("Returned from setLayerExpression.");
                break;
            case "applyEffect":
                logToPanel("Calling applyEffect function...");
                result = applyEffect(args);
                logToPanel("Returned from applyEffect.");
                break;
            case "batchApplyEffects":
                logToPanel("Calling batchApplyEffects function...");
                result = batchApplyEffects(args);
                logToPanel("Returned from batchApplyEffects.");
                break;
            case "applyEffectTemplate":
                logToPanel("Calling applyEffectTemplate function...");
                result = applyEffectTemplate(args);
                logToPanel("Returned from applyEffectTemplate.");
                break;
            case "bridgeTestEffects":
                logToPanel("Executing bridgeTestEffects command...");
                result = JSON.stringify({
                    status: "success",
                    message: "Bridge test effects command executed successfully",
                    timestamp: new Date().toISOString()
                });
                logToPanel("BridgeTestEffects completed.");
                break;
            default:
                logToPanel("Unknown command received: " + command);
                result = JSON.stringify({ 
                    status: "error", 
                    error: "Unknown command: " + command,
                    availableCommands: [
                        "getProjectInfo", "listCompositions", "getLayerInfo",
                        "createComposition", "createTextLayer", "createShapeLayer", "createSolidLayer",
                        "setLayerProperties", "setLayerKeyframe", "setLayerExpression",
                        "applyEffect", "batchApplyEffects", "applyEffectTemplate", "bridgeTestEffects"
                    ]
                });
                break;
        }
        logToPanel("Execution finished for: " + command);
        
        logToPanel("Preparing to write result file...");
        var resultString = (typeof result === 'string') ? result : JSON.stringify(result);
        
        try {
            var resultObj = JSON.parse(resultString);
            resultObj._responseTimestamp = new Date().toISOString();
            resultObj._commandExecuted = command;
            resultString = JSON.stringify(resultObj, null, 2);
            logToPanel("Added timestamp to result JSON for tracking freshness.");
        } catch (parseError) {
            logToPanel("Could not parse result as JSON to add timestamp: " + parseError.toString());
        }
        
        var resultFile = new File(getResultFilePath());
        resultFile.encoding = "UTF-8";
        logToPanel("Opening result file for writing...");
        var opened = resultFile.open("w");
        if (!opened) {
            logToPanel("ERROR: Failed to open result file for writing: " + resultFile.fsName);
            throw new Error("Failed to open result file for writing.");
        }
        logToPanel("Writing to result file...");
        var written = resultFile.write(resultString);
        if (!written) {
             logToPanel("ERROR: Failed to write to result file (write returned false): " + resultFile.fsName);
        }
        logToPanel("Closing result file...");
        var closed = resultFile.close();
         if (!closed) {
             logToPanel("ERROR: Failed to close result file: " + resultFile.fsName);
        }
        logToPanel("Result file write process complete.");
        
        logToPanel("Command completed successfully: " + command);
        statusText.text = "Command completed: " + command;
        
        logToPanel("Updating command status to completed...");
        updateCommandStatus("completed");
        logToPanel("Command status updated.");
        
    } catch (error) {
        var errorMsg = "ERROR in executeCommand for '" + command + "': " + error.toString() + (error.line ? " (line: " + error.line + ")" : "");
        logToPanel(errorMsg);
        statusText.text = "Error: " + error.toString();
        
        try {
            logToPanel("Attempting to write ERROR to result file...");
            var errorResult = JSON.stringify({ 
                status: "error", 
                command: command,
                message: error.toString(),
                line: error.line,
                fileName: error.fileName
            });
            var errorFile = new File(getResultFilePath());
            errorFile.encoding = "UTF-8";
            if (errorFile.open("w")) {
                errorFile.write(errorResult);
                errorFile.close();
                logToPanel("Successfully wrote ERROR to result file.");
            } else {
                 logToPanel("CRITICAL ERROR: Failed to open result file to write error!");
            }
        } catch (writeError) {
             logToPanel("CRITICAL ERROR: Failed to write error to result file: " + writeError.toString());
        }
        
        logToPanel("Updating command status to error...");
        updateCommandStatus("error");
        logToPanel("Command status updated to error.");
    }
}

// Update command file status
function updateCommandStatus(status) {
    try {
        var commandData = safeReadJSONFile(getCommandFilePath());
        
        if (commandData) {
            commandData.status = status;
            
            var commandFile = new File(getCommandFilePath());
            commandFile.open("w");
            commandFile.write(JSON.stringify(commandData, null, 2));
            commandFile.close();
        } else {
            logToPanel("Could not read command file to update status to: " + status);
        }
    } catch (e) {
        logToPanel("Error updating command status: " + e.toString());
    }
}

// Log message to panel
function logToPanel(message) {
    var timestamp = new Date().toLocaleTimeString();
    logText.text = timestamp + ": " + message + "\n" + logText.text;
}

// Check for new commands
function checkForCommands() {
    if (!autoRunCheckbox.value || isChecking) return;
    
    isChecking = true;
    
    try {
        var commandFile = new File(getCommandFilePath());
        if (!commandFile.exists) {
            isChecking = false;
            return;
        }
        
        var fileModified = commandFile.modified;
        if (fileModified && fileModified.getTime() <= lastProcessedTimestamp) {
            isChecking = false;
            return;
        }
        
        var commandData = safeReadJSONFile(getCommandFilePath());
        
        if (commandData && commandData.status === "pending") {
            lastProcessedTimestamp = new Date().getTime();
            
            updateCommandStatus("running");
            
            executeCommand(commandData.command, commandData.args || {});
        }
    } catch (e) {
        logToPanel("Error checking for commands: " + e.toString());
    }
    
    isChecking = false;
}

// Set up timer to check for commands
function startCommandChecker() {
    app.scheduleTask("checkForCommands()", checkInterval, true);
}

// Add manual check button
var checkButton = panel.add("button", undefined, "Check for Commands Now");
checkButton.onClick = function() {
    logToPanel("Manually checking for commands");
    checkForCommands();
};

// Log startup
logToPanel("MCP Bridge Auto started (modular version)");
statusText.text = "Ready - Auto-run is " + (autoRunCheckbox.value ? "ON" : "OFF");

// Start the command checker
startCommandChecker();

// Show the panel
if (panel instanceof Window) {
    panel.center();
    panel.show();
}