// createSolidLayer.jsx
// Creates a new solid layer in the specified composition

//@include "utils.jsx"
//@include "layerOperations.jsx"

// ========== 参数验证Schema ==========
var CREATE_SOLID_LAYER_SCHEMA = {
    name: "createSolidLayer",
    description: "在指定合成中创建纯色图层",
    category: "creation",
    required: ["color"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        color: {
            type: "array",
            description: "纯色颜色 [r, g, b] (0-1范围)",
            example: [1, 0, 0]
        },
        width: {
            type: "number",
            description: "宽度（像素，0使用合成宽度）",
            example: 1920,
            "default": 0,
            min: 0,
            max: 8192
        },
        height: {
            type: "number",
            description: "高度（像素，0使用合成高度）",
            example: 1080,
            "default": 0,
            min: 0,
            max: 8192
        },
        pixelAspect: {
            type: "number",
            description: "像素长宽比",
            example: 1.0,
            "default": 1.0,
            min: 0.1,
            max: 10.0
        },
        startTime: {
            type: "number",
            description: "开始时间（秒）",
            example: 0,
            "default": 0,
            min: 0
        },
        duration: {
            type: "number",
            description: "持续时间（秒，0表示到合成结束）",
            example: 5,
            "default": 5,
            min: 0
        },
        name: {
            type: "string",
            description: "图层名称",
            example: "My Solid",
            "default": "Solid Layer",
            maxLength: 255
        }
    },
    examples: [
        {
            name: "创建红色纯色",
            args: {
                compName: "Main Comp",
                color: [1, 0, 0],
                name: "Red Background"
            }
        },
        {
            name: "创建自定义尺寸纯色",
            args: {
                compName: "Solid Comp",
                color: [0, 1, 0],
                width: 500,
                height: 300,
                name: "Green Solid"
            }
        }
    ]
};

function createSolidLayer(args) {
    // 参数验证
    var validation = validateParameters(args, CREATE_SOLID_LAYER_SCHEMA);
    if (!validation.isValid) {
        return createStandardResponse("error", "Parameter validation failed", {
            errors: validation.errors,
            schema: CREATE_SOLID_LAYER_SCHEMA
        });
    }
    
    var params = validation.normalizedArgs;
    
    // 使用统一的图层创建函数
    return createLayer("solid", params.compName, params, "Create Solid Layer");
} 