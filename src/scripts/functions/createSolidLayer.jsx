// createSolidLayer.jsx
// Creates a new solid layer in the specified composition

//@include "utils.jsx"

// ========== 参数验证Schema ==========
var CREATE_SOLID_LAYER_SCHEMA = {
    name: "createSolidLayer",
    description: "在指定合成中创建纯色图层",
    category: "creation",
    required: [],
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
            example: [1, 1, 1],
            "default": [1, 1, 1]
        },
        name: {
            type: "string",
            description: "图层名称",
            example: "Background",
            "default": "Solid Layer",
            maxLength: 255
        },
        size: {
            type: "array",
            description: "图层尺寸 [width, height]（空数组使用合成尺寸）",
            example: [1920, 1080],
            "default": [960, 540]
        },
        position: {
            type: "array",
            description: "图层位置 [x, y]",
            example: [960, 540],
            "default": [960, 540]
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
        isAdjustment: {
            type: "boolean",
            description: "是否为调整图层",
            example: false,
            "default": false
        }
    },
    examples: [
        {
            name: "创建白色背景",
            args: {
                compName: "Main Comp",
                color: [1, 1, 1],
                name: "White Background",
                size: [1920, 1080]
            }
        },
        {
            name: "创建调节图层",
            args: {
                compName: "Effects Comp",
                name: "Adjustment Layer",
                isAdjustment: true
            }
        },
        {
            name: "创建蓝色纯色",
            args: {
                compName: "Color Comp",
                color: [0, 0.5, 1],
                name: "Blue Solid",
                duration: 10
            }
        }
    ]
};

function createSolidLayer(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, CREATE_SOLID_LAYER_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: CREATE_SOLID_LAYER_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        // Find the composition using utility function
        var compResult = getCompositionByName(params.compName);
        if (compResult.error) {
            return JSON.stringify({
                status: "error",
                message: compResult.error
            }, null, 2);
        }
        var comp = compResult.composition;
        
        // If size is not specified, use composition size
        var layerSize = params.size;
        if (!layerSize) {
            layerSize = [comp.width, comp.height];
        }
        
        // Create a solid layer
        var solidLayer;
        
        if (params.isAdjustment) {
            // Create an adjustment layer
            solidLayer = comp.layers.addSolid([0, 0, 0], params.name, layerSize[0], layerSize[1], 1);
            solidLayer.adjustmentLayer = true;
        } else {
            // Create a regular solid layer
            solidLayer = comp.layers.addSolid(
                params.color,
                params.name,
                layerSize[0],
                layerSize[1],
                1 // Pixel aspect ratio
            );
        }
        
        // Set position
        solidLayer.property("Position").setValue(params.position);
        
        // Set timing
        solidLayer.startTime = params.startTime;
        if (params.duration > 0) {
            solidLayer.outPoint = params.startTime + params.duration;
        }
        
        // Return success with layer details
        return JSON.stringify({
            status: "success",
            message: params.isAdjustment ? "Adjustment layer created successfully" : "Solid layer created successfully",
            layer: {
                name: solidLayer.name,
                index: solidLayer.index,
                type: params.isAdjustment ? "adjustment" : "solid",
                inPoint: solidLayer.inPoint,
                outPoint: solidLayer.outPoint,
                position: solidLayer.property("Position").value,
                isAdjustment: solidLayer.adjustmentLayer
            }
        }, null, 2);
    } catch (error) {
        // Return error message
        return JSON.stringify({
            status: "error",
            message: error.toString()
        }, null, 2);
    }
} 