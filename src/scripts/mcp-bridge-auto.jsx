// mcp-bridge-auto.jsx
// Auto-running MCP Bridge panel for After Effects (Enhanced Version)

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
        
        parse: function(textInput) {
            // Remove leading/trailing whitespace
            textInput = textInput.replace(/^\s+|\s+$/g, "");
            
            // Check for empty or clearly invalid input
            if (!textInput || textInput.length === 0) {
                throw new Error("Invalid JSON: Empty input");
            }
            
            // Basic validation before parsing
            if (textInput.charAt(0) !== '{' && textInput.charAt(0) !== '[') {
                throw new Error("Invalid JSON: Must start with { or [");
            }
            
            // Use eval for parsing (note: this is generally unsafe but acceptable in controlled ExtendScript environment)
            try {
                return eval("(" + textInput + ")");
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

// Include core utilities and dependencies first
//@include "functions/utils.jsx"
//@include "functions/effectsCore.jsx"
//@include "functions/effectTemplates.jsx"
//@include "functions/layerOperations.jsx"

// Include modular function definitions
//@include "functions/createComposition.jsx"
//@include "functions/createTextLayer.jsx"
//@include "functions/createShapeLayer.jsx"
//@include "functions/createSolidLayer.jsx"
//@include "functions/setLayerProperties.jsx"
//@include "functions/setLayerKeyframe.jsx"
//@include "functions/setLayerExpression.jsx"
//@include "functions/applyEffect.jsx"
//@include "functions/applyEffectTemplate.jsx"
//@include "functions/batchApplyEffects.jsx"
//@include "functions/batchCreateShapeLayers.jsx"
//@include "functions/batchCreateTextLayers.jsx"
//@include "functions/batchCreateSolidLayers.jsx"
//@include "functions/batchSetLayerProperties.jsx"
//@include "functions/batchSetLayerKeyframes.jsx"
//@include "functions/batchSetLayerExpressions.jsx"
//@include "functions/getProjectInfo.jsx"
//@include "functions/listCompositions.jsx"
//@include "functions/getLayerInfo.jsx"

// ========== 测试函数配置 ==========
var TestFunctionConfig = {
    enabled: true, // 默认启用测试函数系统
    categories: {
        creation: {
            enabled: true,
            functions: {
                testCreateComposition: { enabled: true, description: "合成创建测试" },
                testCreateTextLayer: { enabled: true, description: "文本图层创建测试" },
                testCreateShapeLayer: { enabled: true, description: "形状图层创建测试" },
                testCreateSolidLayer: { enabled: true, description: "纯色图层创建测试" }
            }
        },
        modification: {
            enabled: true,
            functions: {
                testSetLayerProperties: { enabled: true, description: "图层属性设置测试" },
                testSetLayerKeyframe: { enabled: true, description: "关键帧设置测试" },
                testSetLayerExpression: { enabled: true, description: "表达式设置测试" }
            }
        },
        effects: {
            enabled: true,
            functions: {
                testApplyEffect: { enabled: true, description: "特效应用测试" },
                testApplyEffectTemplate: { enabled: true, description: "特效模板测试" }
            }
        },
        information: {
            enabled: true,
            functions: {
                testGetProjectInfo: { enabled: true, description: "项目信息获取测试" },
                testGetLayerInfo: { enabled: true, description: "图层信息获取测试" },
                testListCompositions: { enabled: true, description: "合成列表测试" }
            }
        },
        batch: {
            enabled: true,
            functions: {
                testBatchCreateShapeLayers: { enabled: true, description: "批量形状图层创建测试" },
                testBatchCreateTextLayers: { enabled: true, description: "批量文本图层创建测试" },
                testBatchCreateSolidLayers: { enabled: true, description: "批量纯色图层创建测试" },
                testBatchApplyEffects: { enabled: true, description: "批量特效应用测试" },
                testBatchSetLayerProperties: { enabled: true, description: "批量图层属性设置测试" },
                testBatchSetLayerKeyframes: { enabled: true, description: "批量关键帧设置测试" },
                testBatchSetLayerExpressions: { enabled: true, description: "批量表达式设置测试" }
            }
        }
    }
};

// ========== 日志管理系统 ==========
var LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    TEST: 4
};

var LogConfig = {
    enabled: true,
    fileEnabled: true,
    level: LogLevel.DEBUG,
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 10,
    currentLogFile: null,
    firstWriteLogged: false,
    openFailureLogged: false,
    writeErrorLogged: false
};

// 日志显示缓冲区
var logBuffer = [];
var maxLogLines = 500;

// 格式化时间戳
function formatTimestamp() {
    var now = new Date();
    var timeStr = String(now.getHours()).padStart(2, '0') + ':' +
                  String(now.getMinutes()).padStart(2, '0') + ':' +
                  String(now.getSeconds()).padStart(2, '0');
    return timeStr;
}

// 主日志函数
function logToPanel(message, level, category) {
    if (!LogConfig.enabled) return;
    
    level = level || LogLevel.INFO;
    category = category || "";
    
    // 如果日志级别低于配置级别，则不显示
    if (level < LogConfig.level) return;
    
    var levelNames = ["DEBUG", "INFO", "WARN", "ERROR", "TEST"];
    var levelName = levelNames[level] || "INFO";
    
    var timestamp = formatTimestamp();
    var categoryStr = category ? "[" + category + "]" : "";
    var formattedMessage = "[" + timestamp + "] [" + levelName + "]" + categoryStr + " " + message;
    
    // 添加到缓冲区
    logBuffer.push(formattedMessage);
    
    // 限制缓冲区大小
    if (logBuffer.length > maxLogLines) {
        logBuffer = logBuffer.slice(-maxLogLines);
    }
    
    // 更新界面显示
    if (typeof logText !== "undefined" && logText) {
        logText.text = logBuffer.join("\n");
        
        // 自动滚动到底部（模拟效果，通过设置selection）
        try {
            logText.active = true;
            logText.selection = [logText.text.length, logText.text.length];
        } catch (e) {
            // 忽略选择错误
        }
    }
    
    // 写入文件日志
    writeToLogFile(level, message, category);
}

// 便捷日志函数
function logDebug(message, category) {
    logToPanel(message, LogLevel.DEBUG, category);
}

function logInfo(message, category) {
    logToPanel(message, LogLevel.INFO, category);
}

function logWarn(message, category) {
    logToPanel(message, LogLevel.WARN, category);
}

function logError(message, category) {
    logToPanel(message, LogLevel.ERROR, category);
}

function logTest(message, category) {
    logToPanel(message, LogLevel.TEST, category);
}

// 获取日志文件路径
function getLogFilePath() {
    var tempDir = getTempDirectory();
    var timestamp = new Date();
    var dateStr = timestamp.getFullYear() + 
                  String(timestamp.getMonth() + 1).padStart(2, '0') + 
                  String(timestamp.getDate()).padStart(2, '0');
    var timeStr = String(timestamp.getHours()).padStart(2, '0') + 
                  String(timestamp.getMinutes()).padStart(2, '0');
    
    return tempDir.fsName + "/ae_mcp_log_" + dateStr + "_" + timeStr + ".txt";
}

// 字符串填充函数（为了兼容性）
if (!String.prototype.padStart) {
    String.prototype.padStart = function(targetLength, padString) {
        targetLength = targetLength >> 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        } else {
            targetLength = targetLength - this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength / padString.length);
            }
            return padString.slice(0, targetLength) + String(this);
        }
    };
}

// 写入日志文件
function writeToLogFile(level, message, category) {
    if (!LogConfig.fileEnabled) return;
    
    try {
        // 初始化日志文件
        if (!LogConfig.currentLogFile) {
            LogConfig.currentLogFile = getLogFilePath();
        }
        
        var logFile = new File(LogConfig.currentLogFile);
        
        // 检查文件大小，如果太大则创建新文件
        if (logFile.exists && logFile.length > LogConfig.maxFileSize) {
            LogConfig.currentLogFile = getLogFilePath();
            logFile = new File(LogConfig.currentLogFile);
        }
        
        // 格式化日志条目
        var timestamp = new Date().toISOString();
        var levelName = Object.keys(LogLevel)[level] || "UNKNOWN";
        var categoryStr = category ? "[" + category + "]" : "";
        var logEntry = timestamp + " [" + levelName + "]" + categoryStr + " " + message + "\n";
        
        // 写入文件
        logFile.encoding = "UTF-8";
        var opened = logFile.open("a"); // append mode
        if (opened) {
            var written = logFile.write(logEntry);
            logFile.close();
            
            // 首次写入时记录成功信息（避免无限递归）
            if (!LogConfig.firstWriteLogged) {
                LogConfig.firstWriteLogged = true;
                // 只在控制台显示，不再调用文件写入
                if (typeof logText !== "undefined" && logText) {
                    var successMsg = "[" + formatTimestamp() + "] [DEBUG][FILE_LOG] 文件日志系统已激活: " + LogConfig.currentLogFile;
                    logBuffer.push(successMsg);
                    logText.text = logBuffer.join("\n");
                }
            }
        } else {
            // 记录打开文件失败，但避免无限递归
            if (!LogConfig.openFailureLogged) {
                LogConfig.openFailureLogged = true;
                if (typeof logText !== "undefined" && logText) {
                    var errorMsg = "[" + formatTimestamp() + "] [ERROR][FILE_LOG] 无法打开日志文件: " + LogConfig.currentLogFile;
                    logBuffer.push(errorMsg);
                    logText.text = logBuffer.join("\n");
                }
            }
        }
        
    } catch (error) {
        // 日志写入失败不应该影响主程序，只在控制台记录一次
        if (!LogConfig.writeErrorLogged) {
            LogConfig.writeErrorLogged = true;
            if (typeof logText !== "undefined" && logText) {
                var errorMsg = "[" + formatTimestamp() + "] [ERROR][FILE_LOG] 写入日志文件失败: " + error.toString();
                logBuffer.push(errorMsg);
                logText.text = logBuffer.join("\n");
            }
        }
    }
}

// 清理旧日志文件
function cleanupOldLogFiles() {
    try {
        var tempDir = getTempDirectory();
        var files = tempDir.getFiles("ae_mcp_log_*.txt");
        
        if (files.length > LogConfig.maxFiles) {
            // 按修改时间排序
            files.sort(function(a, b) {
                return a.modified.getTime() - b.modified.getTime();
            });
            
            // 删除最老的文件
            var filesToDelete = files.length - LogConfig.maxFiles;
            for (var i = 0; i < filesToDelete; i++) {
                try {
                    files[i].remove();
                } catch (e) {
                    // 忽略删除失败
                }
            }
        }
    } catch (error) {
        // 清理失败不影响主程序
    }
}

// ========== 文件路径函数 ==========
function getCurrentDirectory() {
    // 获取当前脚本所在目录
    var scriptFile = new File($.fileName);
    return scriptFile.parent;
}

function getTempDirectory() {
    var currentDir = getCurrentDirectory();
    var tempDir = new Folder(currentDir.fsName + "/temp");
    
    // 确保临时目录存在
    if (!tempDir.exists) {
        tempDir.create();
    }
    
    return tempDir;
}

// Command file path
function getCommandFilePath() {
    var tempDir = getTempDirectory();
    return tempDir.fsName + "/ae_command.json";
}

// Result file path
function getResultFilePath() {
    var tempDir = getTempDirectory();
    return tempDir.fsName + "/ae_mcp_result.json";
}

// Config file path
function getConfigFilePath() {
    var tempDir = getTempDirectory();
    return tempDir.fsName + "/test_config.json";
}

// ========== 配置管理函数 ==========
function saveTestConfig() {
    try {
        var configFile = new File(getConfigFilePath());
        configFile.encoding = "UTF-8"; // 设置UTF-8编码
        configFile.open("w");
        configFile.write(JSON.stringify(TestFunctionConfig, null, 2));
        configFile.close();
        logToPanel("测试配置已保存");
    } catch (e) {
        logToPanel("保存测试配置失败: " + e.toString());
    }
}

function loadTestConfig() {
    try {
        var configFile = new File(getConfigFilePath());
        if (configFile.exists) {
            configFile.encoding = "UTF-8"; // 设置UTF-8编码
            configFile.open("r");
            var content = configFile.read();
            configFile.close();
            
            if (content) {
                var config = JSON.parse(content);
                TestFunctionConfig = config;
                updateTestConfigUI();
                logToPanel("测试配置已加载");
            }
        }
    } catch (e) {
        logToPanel("加载测试配置失败: " + e.toString());
    }
}

// ========== 界面创建 ==========
// Create panel interface
var panel = (this instanceof Panel) ? this : new Window("palette", "MCP Bridge Auto (Enhanced)", undefined);
panel.orientation = "column";
panel.alignChildren = ["fill", "top"];
panel.spacing = 10;
panel.margins = 16;
panel.preferredSize.width = 700; // 减小宽度
panel.preferredSize.height = 600; // 增加高度以适应更大的日志区域

// Status display
var statusText = panel.add("statictext", undefined, "Waiting for commands...");
statusText.alignment = ["fill", "top"];

// Main tabs
var tabPanel = panel.add("tabbedpanel");
tabPanel.alignChildren = "fill";
tabPanel.preferredSize.height = 400;

// ========== 主控制选项卡 ==========
var mainTab = tabPanel.add("tab", undefined, "主控制");
mainTab.orientation = "column";
mainTab.alignChildren = ["fill", "top"];

// Add log area
var logPanel = mainTab.add("panel", undefined, "Command Log");
logPanel.orientation = "column";
logPanel.alignChildren = ["fill", "fill"];
logPanel.alignment = ["fill", "fill"]; // 让日志面板填充剩余空间
var logText = logPanel.add("edittext", undefined, "", {multiline: true, readonly: true});
logText.alignment = ["fill", "fill"]; // 让文本框填充整个面板

// Auto-run checkbox
var autoRunCheckbox = mainTab.add("checkbox", undefined, "Auto-run commands");
autoRunCheckbox.value = true;

// Add manual check button
var checkButton = mainTab.add("button", undefined, "Check for Commands Now");

// ========== 测试函数控制选项卡 ==========
var testTab = tabPanel.add("tab", undefined, "测试函数控制");
testTab.orientation = "column";
testTab.alignChildren = ["fill", "top"];
testTab.preferredSize.width = 650; // 减少宽度
testTab.preferredSize.height = 400;

// 测试函数主控制区域
var testMainControlGroup = testTab.add("panel", undefined, "主控制");
testMainControlGroup.orientation = "row";
testMainControlGroup.alignChildren = ["left", "center"];
testMainControlGroup.preferredSize.height = 60; // 减少高度

// 左侧：批量控制
var leftControlGroup = testMainControlGroup.add("group");
leftControlGroup.orientation = "column";
leftControlGroup.alignChildren = ["left", "top"];

var batchLabel = leftControlGroup.add("statictext", undefined, "批量操作:");
var batchButtonsGroup = leftControlGroup.add("group");
batchButtonsGroup.orientation = "row";
var toggleAllButton = batchButtonsGroup.add("button", undefined, "全部开关");
var loadConfigButton = batchButtonsGroup.add("button", undefined, "加载配置");
var saveConfigButton = batchButtonsGroup.add("button", undefined, "保存配置");

// 右侧：一键测试区域
var rightControlGroup = testMainControlGroup.add("group");
rightControlGroup.orientation = "column";
rightControlGroup.alignChildren = ["right", "top"];

var runAllTestsButton = rightControlGroup.add("button", undefined, "🚀 执行所有启用的测试");
runAllTestsButton.preferredSize.width = 180; // 减少宽度
runAllTestsButton.preferredSize.height = 35;

// 测试状态显示
var testStatusGroup = testTab.add("group");
testStatusGroup.orientation = "row";
testStatusGroup.alignChildren = ["fill", "center"];
var testProgressText = testStatusGroup.add("statictext", undefined, "准备就绪");
testProgressText.preferredSize.width = 400;

// 测试函数分类选择面板 - 紧凑的网格布局
var categoryPanel = testTab.add("panel", undefined, "测试函数分类选择");
categoryPanel.orientation = "column";
categoryPanel.alignChildren = ["fill", "top"];
categoryPanel.preferredSize.height = 220; // 进一步减少高度

var categoryControls = {};

function createCompactCategoryControls() {
    // 创建紧凑的2列网格布局
    var row1 = categoryPanel.add("group");
    row1.orientation = "row";
    row1.alignChildren = ["fill", "top"];
    
    var row2 = categoryPanel.add("group");
    row2.orientation = "row";
    row2.alignChildren = ["fill", "top"];
    
    var containers = [row1, row2];
    var categoryIndex = 0;
    
    for (var categoryKey in TestFunctionConfig.categories) {
        var category = TestFunctionConfig.categories[categoryKey];
        var container = containers[categoryIndex % 2];
        
        var catGroup = container.add("group");
        catGroup.orientation = "column";
        catGroup.alignChildren = ["fill", "top"];
        catGroup.preferredSize.width = 320; // 减少每列宽度
        
        var catHeader = catGroup.add("group");
        catHeader.orientation = "row";
        
        var catCheckbox = catHeader.add("checkbox", undefined, getCategoryDisplayName(categoryKey));
        catCheckbox.value = category.enabled;
        
        categoryControls[categoryKey] = {
            checkbox: catCheckbox,
            functions: {}
        };
        
        // 函数控制 - 更紧凑的布局
        for (var funcKey in category.functions) {
            var func = category.functions[funcKey];
            var funcGroup = catGroup.add("group");
            funcGroup.orientation = "row";
            funcGroup.alignment = ["fill", "top"];
            funcGroup.margins = [10, 0, 0, 0]; // 进一步减少缩进
            
            var funcCheckbox = funcGroup.add("checkbox", undefined, func.description);
            funcCheckbox.value = func.enabled;
            
            categoryControls[categoryKey].functions[funcKey] = funcCheckbox;
        }
        
        categoryIndex++;
    }
}

createCompactCategoryControls();

// ========== 按钮事件处理 ==========
// 主控制按钮事件
checkButton.onClick = function() {
    logInfo("手动检查命令...", "USER_ACTION");
    checkForCommands();
};

// 一键测试按钮事件
runAllTestsButton.onClick = function() {
    logInfo("开始执行所有启用的测试函数...", "USER_ACTION");
    executeAllEnabledTests();
};

// ========== 事件处理 ==========
// 简化的批量操作
var allEnabled = true;
toggleAllButton.onClick = function() {
    allEnabled = !allEnabled;
    
    for (var categoryKey in TestFunctionConfig.categories) {
        TestFunctionConfig.categories[categoryKey].enabled = allEnabled;
        for (var funcKey in TestFunctionConfig.categories[categoryKey].functions) {
            TestFunctionConfig.categories[categoryKey].functions[funcKey].enabled = allEnabled;
        }
    }
    updateTestConfigUI();
    
    this.text = allEnabled ? "全部禁用" : "全部启用";
    logInfo("批量" + (allEnabled ? "启用" : "禁用") + "所有测试函数", "CONFIG");
};

loadConfigButton.onClick = function() {
    loadTestConfig();
};

saveConfigButton.onClick = function() {
    saveTestConfig();
};

// 类别复选框事件
for (var categoryKey in categoryControls) {
    (function(catKey) {
        categoryControls[catKey].checkbox.onClick = function() {
            TestFunctionConfig.categories[catKey].enabled = this.value;
            
            // 同步更新该类别下的所有函数
            for (var funcKey in categoryControls[catKey].functions) {
                categoryControls[catKey].functions[funcKey].value = this.value;
                TestFunctionConfig.categories[catKey].functions[funcKey].enabled = this.value;
            }
            
            logInfo("类别 '" + getCategoryDisplayName(catKey) + "' " + (this.value ? "已启用" : "已禁用"), "CONFIG");
        };
        
        // 函数复选框事件
        for (var funcKey in categoryControls[catKey].functions) {
            (function(fKey) {
                categoryControls[catKey].functions[fKey].onClick = function() {
                    TestFunctionConfig.categories[catKey].functions[fKey].enabled = this.value;
                    
                    // 如果启用了单个函数，自动启用对应的类别
                    if (this.value && !TestFunctionConfig.categories[catKey].enabled) {
                        TestFunctionConfig.categories[catKey].enabled = true;
                        categoryControls[catKey].checkbox.value = true;
                        logInfo("自动启用类别 '" + getCategoryDisplayName(catKey) + "' (因为启用了函数 '" + fKey + "')", "CONFIG");
                    }
                    
                    // 检查是否需要禁用类别（当该类别下所有函数都被禁用时）
                    if (!this.value) {
                        var hasEnabledFunction = false;
                        for (var checkFuncKey in TestFunctionConfig.categories[catKey].functions) {
                            if (TestFunctionConfig.categories[catKey].functions[checkFuncKey].enabled) {
                                hasEnabledFunction = true;
                                break;
                            }
                        }
                        if (!hasEnabledFunction && TestFunctionConfig.categories[catKey].enabled) {
                            TestFunctionConfig.categories[catKey].enabled = false;
                            categoryControls[catKey].checkbox.value = false;
                            logInfo("自动禁用类别 '" + getCategoryDisplayName(catKey) + "' (因为所有函数都已禁用)", "CONFIG");
                        }
                    }
                    
                    logDebug("测试函数 '" + fKey + "' " + (this.value ? "已启用" : "已禁用"), "CONFIG");
                };
            })(funcKey);
        }
    })(categoryKey);
}

function getCategoryDisplayName(categoryKey) {
    var names = {
        creation: "创建类函数",
        modification: "修改类函数", 
        effects: "特效类函数",
        information: "信息获取类函数",
        batch: "批量处理类函数"
    };
    return names[categoryKey] || categoryKey;
}

function updateTestConfigUI() {
    for (var categoryKey in categoryControls) {
        if (TestFunctionConfig.categories[categoryKey]) {
            categoryControls[categoryKey].checkbox.value = TestFunctionConfig.categories[categoryKey].enabled;
            
            for (var funcKey in categoryControls[categoryKey].functions) {
                if (TestFunctionConfig.categories[categoryKey].functions[funcKey]) {
                    categoryControls[categoryKey].functions[funcKey].value = 
                        TestFunctionConfig.categories[categoryKey].functions[funcKey].enabled;
                }
            }
        }
    }
}

// ========== 测试环境管理函数 ==========
function createTestEnvironment() {
    try {
        app.beginUndoGroup("Create Test Environment");
        
        // 检查是否已存在测试合成
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === "Test_Composition") {
                logInfo("测试合成已存在，跳过创建", "TEST_ENV");
                return true;
            }
        }
        
        // 创建测试合成
        var testComp = app.project.items.addComp("Test_Composition", 1920, 1080, 1, 10, 30);
        if (!testComp) {
            throw new Error("无法创建测试合成");
        }
        
        // 创建基础图层
        var solidLayer = testComp.layers.addSolid([0.5, 0.5, 0.5], "Test_Solid", 1920, 1080, 1);
        var textLayer = testComp.layers.addText("Test Environment Ready");
        
        logInfo("测试环境创建成功: " + testComp.name, "TEST_ENV");
        return true;
        
    } catch (error) {
        logError("创建测试环境失败: " + error.toString(), "TEST_ENV");
        return false;
    } finally {
        app.endUndoGroup();
    }
}

function clearTestEnvironment() {
    try {
        app.beginUndoGroup("Clear Test Environment");
        
        var itemsToRemove = [];
        
        // 查找所有测试相关的项目项
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item.name.indexOf("Test_") === 0 || 
                item.name.indexOf("test_") === 0 ||
                item.name === "Test_Composition") {
                itemsToRemove.push(item);
            }
        }
        
        // 删除找到的项目项
        var removedCount = 0;
        for (var j = 0; j < itemsToRemove.length; j++) {
            try {
                itemsToRemove[j].remove();
                removedCount++;
            } catch (e) {
                logWarn("无法删除项目项: " + itemsToRemove[j].name + " - " + e.toString(), "TEST_ENV");
            }
        }
        
        logInfo("测试环境清理完成，删除了 " + removedCount + " 个项目项", "TEST_ENV");
        return true;
        
    } catch (error) {
        logError("清理测试环境失败: " + error.toString(), "TEST_ENV");
        return false;
    } finally {
        app.endUndoGroup();
    }
}

// 阶段1：环境准备
function prepareTestEnvironment(requiresEnvironment, createEnvironment) {
    if (requiresEnvironment && createEnvironment) {
        // 检查是否已有测试环境
        var hasTestEnv = false;
        try {
            for (var i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);
                if (item.name === "Test_Composition") {
                    hasTestEnv = true;
                    logDebug("找到现有测试合成: " + item.name, "TEST_ENV");
                    break;
                }
            }
        } catch (e) {
            logError("检查项目时出错: " + e.toString(), "TEST_ENV");
        }
        
        if (!hasTestEnv) {
            logInfo("创建测试环境...", "TEST_ENV");
            try {
                createTestEnvironment();
                logInfo("测试环境创建成功", "TEST_ENV");
                
                // 再次验证环境是否创建成功
                var envCreated = false;
                for (var k = 1; k <= app.project.numItems; k++) {
                    var item = app.project.item(k);
                    if (item.name === "Test_Composition") {
                        envCreated = true;
                        break;
                    }
                }
                
                if (!envCreated) {
                    return {
                        success: false,
                        error: "测试环境创建失败：未找到创建的测试合成"
                    };
                }
            } catch (envError) {
                logError("创建测试环境时出错: " + envError.toString(), "TEST_ENV");
                return {
                    success: false,
                    error: "无法创建测试环境: " + envError.toString()
                };
            }
        } else {
            logDebug("检测到现有测试环境，继续使用", "TEST_ENV");
        }
    }
}

// ========== MCP核心处理函数 ==========
function checkForCommands() {
    try {
        var commandFile = new File(getCommandFilePath());
        
        if (!commandFile.exists) {
            return false;
        }
        
        // 读取命令文件
        commandFile.open("r");
        var content = commandFile.read();
        commandFile.close();
        
        if (!content || content.trim() === "") {
            return false;
        }
        
        // 解析命令
        var command;
        try {
            command = JSON.parse(content);
        } catch (parseError) {
            logError("命令JSON解析失败: " + parseError.toString(), "MCP");
            return false;
        }
        
        // 删除命令文件（避免重复执行）
        commandFile.remove();
        
        // 执行命令
        executeCommand(command);
        
        return true;
        
    } catch (error) {
        logError("检查命令时出错: " + error.toString(), "MCP");
        return false;
    }
}

function executeCommand(command) {
    logInfo("执行命令: " + command.function, "MCP");
    
    var result = {
        success: false,
        data: null,
        error: null,
        timestamp: new Date().toISOString()
    };
    
    try {
        // 执行命令函数
        var functionName = command.function;
        var args = command.args || {};
        
        // 在ExtendScript中直接使用eval调用函数
        try {
            var functionExists = eval("typeof " + functionName + " === 'function'");
            if (functionExists) {
                result.data = eval(functionName + "(args)");
                result.success = true;
                logInfo("命令执行成功: " + functionName, "MCP");
            } else {
                result.error = "Function not found: " + functionName;
                logError("函数未找到: " + functionName, "MCP");
            }
        } catch (checkError) {
            result.error = "Function check failed: " + checkError.toString();
            logError("函数检查失败: " + functionName + " - " + checkError.toString(), "MCP");
        }
        
    } catch (error) {
        result.error = error.toString();
        logError("命令执行失败: " + error.toString(), "MCP");
    }
    
    // 写入结果文件
    writeResult(result);
}

function writeResult(result) {
    try {
        var resultFile = new File(getResultFilePath());
        resultFile.open("w");
        resultFile.write(JSON.stringify(result, null, 2));
        resultFile.close();
        
        logDebug("结果已写入文件", "MCP");
        
    } catch (error) {
        logError("写入结果文件失败: " + error.toString(), "MCP");
    }
}

function executeAllEnabledTests() {
    testProgressText.text = "正在执行测试...";
    
    var totalTests = 0;
    var successTests = 0;
    var failedTests = 0;
    var criticalErrors = 0;
    
    // 统计启用的测试函数
    for (var categoryKey in TestFunctionConfig.categories) {
        var category = TestFunctionConfig.categories[categoryKey];
        if (category.enabled) {
            for (var funcKey in category.functions) {
                if (category.functions[funcKey].enabled) {
                    totalTests++;
                }
            }
        }
    }
    
    if (totalTests === 0) {
        // 详细检查原因
        var totalFunctions = 0;
        var enabledFunctions = 0;
        var disabledCategories = [];
        var functionsInDisabledCategories = 0;
        
        for (var categoryKey in TestFunctionConfig.categories) {
            var category = TestFunctionConfig.categories[categoryKey];
            var categoryHasEnabledFunctions = false;
            
            for (var funcKey in category.functions) {
                totalFunctions++;
                if (category.functions[funcKey].enabled) {
                    enabledFunctions++;
                    categoryHasEnabledFunctions = true;
                    if (!category.enabled) {
                        functionsInDisabledCategories++;
                    }
                }
            }
            
            if (!category.enabled && categoryHasEnabledFunctions) {
                disabledCategories.push(getCategoryDisplayName(categoryKey));
            }
        }
        
        var message = "没有可执行的测试函数。";
        if (functionsInDisabledCategories > 0) {
            message += "发现 " + functionsInDisabledCategories + " 个已启用的函数，但其所属类别被禁用：" + disabledCategories.join(", ") + "。请启用对应的类别。";
        } else if (enabledFunctions === 0) {
            message += "共有 " + totalFunctions + " 个测试函数，但都未启用。";
        }
        
        logWarn(message, "TEST");
        testProgressText.text = message;
        return;
    }
    
    logInfo("开始执行 " + totalTests + " 个测试函数", "TEST");
    writeCommandLog("=== 开始批量测试执行 ===");
    writeCommandLog("总测试函数数量: " + totalTests);
    
    // 自动确保测试环境存在
    logInfo("自动确保测试环境已准备...", "TEST");
    var envReady = false;
    
    // 检查是否有活动合成
    if (app.project.activeItem instanceof CompItem) {
        logInfo("找到活动合成: " + app.project.activeItem.name, "TEST");
        envReady = true;
    } else {
        // 查找测试合成
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === "Test_Composition") {
                item.openInViewer();
                logInfo("激活测试合成: " + item.name, "TEST");
                envReady = true;
                break;
            }
        }
    }
    
    // 如果没有可用合成，自动创建测试环境
    if (!envReady) {
        logInfo("自动创建测试环境...", "TEST");
        var createSuccess = createTestEnvironment();
        if (createSuccess) {
            // 激活测试合成
            for (var j = 1; j <= app.project.numItems; j++) {
                var item = app.project.item(j);
                if (item instanceof CompItem && item.name === "Test_Composition") {
                    item.openInViewer();
                    logInfo("已激活新创建的测试合成", "TEST");
                    envReady = true;
                    break;
                }
            }
        }
    }
    
    if (!envReady) {
        logError("无法准备测试环境，终止测试", "TEST");
        testProgressText.text = "测试环境准备失败";
        return;
    }
    
    // 保存原始alert函数并替换
    var originalAlert = alert;
    alert = function(message) {
        writeCommandLog("ALERT: " + message);
    };
    
    var testIndex = 0;
    
    // 执行测试函数
    for (var categoryKey in TestFunctionConfig.categories) {
        var category = TestFunctionConfig.categories[categoryKey];
        if (category.enabled) {
            for (var funcKey in category.functions) {
                if (category.functions[funcKey].enabled) {
                    testIndex++;
                    
                    testProgressText.text = "执行测试 " + testIndex + "/" + totalTests + ": " + funcKey;
                    writeCommandLog("开始执行测试 " + testIndex + "/" + totalTests + ": " + funcKey);
                    
                    var testSuccess = false;
                    var errorMessage = "";
                    
                    try {
                        // 在ExtendScript中直接使用eval调用函数
                        logTest("执行测试函数: " + funcKey, "BATCH_TEST");
                        
                        // 首先检查函数是否存在
                        try {
                            var functionExists = eval("typeof " + funcKey + " === 'function'");
                            if (functionExists) {
                                // 执行测试函数并获取结果
                                var testResult = eval(funcKey + "()");
                                
                                // 检查返回结果判断是否成功
                                if (testResult && typeof testResult === "object") {
                                    // 如果返回对象，检查status字段
                                    if (testResult.status === "error") {
                                        testSuccess = false;
                                        errorMessage = testResult.message || "测试函数返回错误状态";
                                    } else if (testResult.status === "success" || !testResult.hasOwnProperty("status")) {
                                        // 如果明确成功或没有status字段（假设成功）
                                        testSuccess = true;
                                    } else {
                                        testSuccess = false;
                                        errorMessage = "测试函数返回未知状态: " + testResult.status;
                                    }
                                } else if (testResult === false) {
                                    // 如果返回false，认为失败
                                    testSuccess = false;
                                    errorMessage = "测试函数返回false";
                                } else {
                                    // 其他情况认为成功
                                    testSuccess = true;
                                }
                                
                                if (testSuccess) {
                                    successTests++;
                                    logTest("测试函数执行成功: " + funcKey, "BATCH_TEST");
                                    writeCommandLog("✓ 测试成功: " + funcKey);
                                } else {
                                    failedTests++;
                                    logError("测试函数失败: " + funcKey + " - " + errorMessage, "BATCH_TEST");
                                    writeCommandLog("✗ 测试失败: " + funcKey + " - " + errorMessage);
                                }
                            } else {
                                testSuccess = false;
                                errorMessage = "函数不存在";
                                failedTests++;
                                logError("测试函数不存在: " + funcKey, "BATCH_TEST");
                                writeCommandLog("✗ 测试失败: " + funcKey + " - 函数不存在");
                            }
                        } catch (checkError) {
                            testSuccess = false;
                            errorMessage = checkError.toString();
                            failedTests++;
                            criticalErrors++;
                            logError("检查测试函数时出错: " + funcKey + " - " + checkError.toString(), "BATCH_TEST");
                            writeCommandLog("✗ 测试失败: " + funcKey + " - " + checkError.toString());
                        }
                        
                    } catch (error) {
                        testSuccess = false;
                        errorMessage = error.toString();
                        failedTests++;
                        criticalErrors++;
                        logError("测试函数执行失败: " + funcKey + " - " + error.toString(), "BATCH_TEST");
                        writeCommandLog("✗ 测试执行失败: " + funcKey + " - " + error.toString());
                    }
                    
                    // 如果关键错误太多，考虑停止测试
                    if (criticalErrors >= 3) {
                        writeCommandLog("✗ 检测到过多关键错误，停止测试执行");
                        logError("检测到过多关键错误，停止测试执行", "TEST");
                        break;
                    }
                }
            }
            
            // 如果关键错误太多，跳出外层循环
            if (criticalErrors >= 3) {
                break;
            }
        }
    }
    
    // 恢复原始alert函数
    alert = originalAlert;
    
    // 测试完成后保留环境，不进行清理
    
    var summary = "测试完成: " + successTests + " 成功, " + failedTests + " 失败, 共 " + totalTests + " 个";
    if (criticalErrors > 0) {
        summary += " (含 " + criticalErrors + " 个关键错误)";
    }
    
    logInfo(summary, "TEST");
    testProgressText.text = summary;
    
    writeCommandLog("=== 批量测试执行完成 ===");
    writeCommandLog(summary);
    writeCommandLog("测试环境已保留，可继续使用");
    
    // 如果有失败的测试，标记为错误状态
    if (failedTests > 0) {
        logWarn("发现 " + failedTests + " 个失败的测试，请检查详细日志", "TEST");
    }
}

// ========== 自动轮询系统 ==========
function startAutoRunner() {
    if (autoRunCheckbox.value) {
        checkForCommands();
    }
    
    // 设置下次检查
    app.setTimeout(startAutoRunner, 1000); // 每秒检查一次
}

// Log startup
logInfo("MCP Bridge Auto (Enhanced) 已启动 - 包含完整功能和测试控制系统", "STARTUP");
logInfo("新增功能: 文件日志系统、自动滚动日志、优化UI布局", "STARTUP");
logInfo("日志文件位置: " + getTempDirectory().fsName, "STARTUP");
logInfo("日志级别: DEBUG, INFO, WARN, ERROR, TEST", "STARTUP");
statusText.text = "Ready - Auto-run is " + (autoRunCheckbox.value ? "ON" : "OFF");

// 初始化日志清理
cleanupOldLogFiles();

// 自动加载配置文件
logInfo("自动加载配置文件...", "STARTUP");
loadTestConfig();

// 测试命令日志功能
try {
    writeCommandLog("=== MCP Bridge Auto Enhanced 启动 ===");
    writeCommandLog("启动时间: " + new Date().toString());
    writeCommandLog("功能: 无Alert弹框，自动合成选择，UTF-8编码支持");
    logInfo("命令日志系统测试成功", "COMMAND_LOG");
} catch (cmdLogError) {
    logError("命令日志系统测试失败: " + cmdLogError.toString(), "COMMAND_LOG");
}

// 启动自动轮询系统
logInfo("启动自动轮询系统", "STARTUP");
startAutoRunner();

// 显示面板
panel.show();

logInfo("MCP Bridge Auto (Enhanced) 初始化完成", "STARTUP");

// 命令日志写入函数
function writeCommandLog(message) {
    try {
        var tempDir = getTempDirectory();
        var commandLogFile = new File(tempDir.fsName + "/command_log.txt");
        
        // 创建带时间戳的日志条目
        var timestamp = new Date().toISOString();
        var logEntry = "[" + timestamp + "] " + message + "\n";
        
        // 写入文件，使用UTF-8编码
        commandLogFile.encoding = "UTF-8";
        var opened = commandLogFile.open("a"); // append mode
        if (opened) {
            commandLogFile.write(logEntry);
            commandLogFile.close();
            
            // 同时在控制台显示
            logTest("CMD: " + message, "COMMAND_LOG");
        } else {
            logError("无法打开命令日志文件", "COMMAND_LOG");
        }
        
    } catch (error) {
        logError("写入命令日志失败: " + error.toString(), "COMMAND_LOG");
    }
}

// Alert替换函数 - 将alert内容写入命令日志
function logAlert(message) {
    writeCommandLog(message);
}