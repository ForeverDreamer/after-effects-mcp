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