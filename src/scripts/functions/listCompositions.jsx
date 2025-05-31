// listCompositions.jsx
// Lists all compositions in the project

//@include "utils.jsx"

// ========== 参数验证Schema ==========
var LIST_COMPOSITIONS_SCHEMA = {
    name: "listCompositions",
    description: "列出项目中的所有合成",
    category: "project",
    required: [],
    properties: {
        includeDetails: {
            type: "boolean",
            description: "是否包含详细信息",
            example: true,
            "default": true
        },
        sortBy: {
            type: "string",
            description: "排序字段",
            example: "name",
            "default": "name",
            "enum": ["name", "duration", "created", "size"]
        }
    },
    examples: [
        {
            name: "列出所有合成",
            args: {}
        },
        {
            name: "按持续时间排序",
            args: {
                sortBy: "duration",
                includeDetails: true
            }
        }
    ]
};

function listCompositions(args) {
    try {
        // 参数验证
        args = args || {};
        var validation = validateParameters(args, LIST_COMPOSITIONS_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: LIST_COMPOSITIONS_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        var project = app.project;
        var compositions = [];
        
        for (var i = 1; i <= project.numItems; i++) {
            var item = project.item(i);
            
            if (item instanceof CompItem) {
                var compInfo = {
                    id: item.id,
                    name: item.name
                };
                
                if (params.includeDetails) {
                    compInfo.duration = item.duration;
                    compInfo.frameRate = item.frameRate;
                    compInfo.width = item.width;
                    compInfo.height = item.height;
                    compInfo.numLayers = item.numLayers;
                    compInfo.pixelAspect = item.pixelAspect;
                    compInfo.bgColor = item.bgColor;
                }
                
                compositions.push(compInfo);
            }
        }
        
        // 排序
        if (params.sortBy === "duration") {
            compositions.sort(function(a, b) { return (a.duration || 0) - (b.duration || 0); });
        } else if (params.sortBy === "size") {
            compositions.sort(function(a, b) { return ((a.width || 0) * (a.height || 0)) - ((b.width || 0) * (b.height || 0)); });
        } else {
            compositions.sort(function(a, b) { return a.name.localeCompare(b.name); });
        }
        
        return JSON.stringify({
            status: "success",
            message: "Compositions listed successfully",
            count: compositions.length,
            compositions: compositions
        }, null, 2);
    } catch (error) {
        return JSON.stringify({
            status: "error",
            message: error.toString()
        }, null, 2);
    }
}

// ========== 测试函数 ==========
function testListCompositions() {
    try {
        logAlert("开始测试 listCompositions 函数...");
        
        // 测试用例1: 列出所有合成（默认参数）
        var testArgs1 = {};
        
        logAlert("测试默认合成列表...");
        var result1 = listCompositions(testArgs1);
        logAlert("默认列表测试结果:\n" + result1);
        
        // 测试用例2: 列出合成不包含详细信息
        var testArgs2 = {
            includeDetails: false
        };
        
        logAlert("测试简单合成列表...");
        var result2 = listCompositions(testArgs2);
        logAlert("简单列表测试结果:\n" + result2);
        
        // 测试用例3: 按持续时间排序
        var testArgs3 = {
            sortBy: "duration",
            includeDetails: true
        };
        
        logAlert("测试按持续时间排序...");
        var result3 = listCompositions(testArgs3);
        logAlert("持续时间排序测试结果:\n" + result3);
        
        // 测试用例4: 按尺寸排序
        var testArgs4 = {
            sortBy: "size",
            includeDetails: true
        };
        
        logAlert("测试按尺寸排序...");
        var result4 = listCompositions(testArgs4);
        logAlert("尺寸排序测试结果:\n" + result4);
        
        logAlert("listCompositions 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testListCompositions(); 
