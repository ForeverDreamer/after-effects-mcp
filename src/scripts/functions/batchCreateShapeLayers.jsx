// batchCreateShapeLayers.jsx
// Batch create multiple shape layers in compositions

//@include "utils.jsx"
//@include "effectsCore.jsx"
//@include "createShapeLayer.jsx"

// ========== 参数验证Schema ==========
var BATCH_CREATE_SHAPE_LAYERS_SCHEMA = {
    name: "batchCreateShapeLayers",
    description: "批量创建多个形状图层",
    category: "batch-creation",
    required: ["shapeLayers"],
    properties: {
        shapeLayers: {
            type: "array",
            description: "形状图层配置数组",
            example: [
                {
                    "shapeType": "rectangle",
                    "compName": "Main Comp",
                    "position": [400, 300],
                    "size": [200, 100],
                    "fillColor": [1, 0, 0]
                },
                {
                    "shapeType": "ellipse",
                    "compName": "Main Comp", 
                    "position": [800, 300],
                    "size": [150, 150],
                    "fillColor": [0, 1, 0]
                }
            ],
            minLength: 1,
            maxLength: 50
        },
        skipErrors: {
            type: "boolean",
            description: "是否跳过错误继续处理其他图层",
            example: true,
            "default": true
        },
        validateOnly: {
            type: "boolean",
            description: "仅验证参数而不执行创建",
            example: false,
            "default": false
        }
    },
    examples: [
        {
            name: "批量创建基础形状",
            args: {
                shapeLayers: [
                    {
                        shapeType: "rectangle",
                        compName: "Shape Comp",
                        position: [300, 200],
                        size: [200, 100],
                        fillColor: [1, 0, 0],
                        name: "Red Rectangle"
                    },
                    {
                        shapeType: "ellipse",
                        compName: "Shape Comp",
                        position: [700, 200], 
                        size: [150, 150],
                        fillColor: [0, 1, 0],
                        strokeColor: [0, 0, 1],
                        strokeWidth: 5,
                        name: "Green Circle"
                    }
                ],
                skipErrors: true
            }
        },
        {
            name: "批量创建多边形",
            args: {
                shapeLayers: [
                    {
                        shapeType: "polygon",
                        compName: "Polygon Comp",
                        position: [400, 300],
                        size: [180, 180],
                        fillColor: [0, 0, 1],
                        points: 6,
                        name: "Hexagon"
                    },
                    {
                        shapeType: "star",
                        compName: "Polygon Comp",
                        position: [700, 300],
                        size: [160, 160], 
                        fillColor: [1, 1, 0],
                        points: 5,
                        name: "Star"
                    }
                ]
            }
        }
    ]
};

function batchCreateShapeLayers(args) {
    // 参数验证
    var validation = validateParameters(args, BATCH_CREATE_SHAPE_LAYERS_SCHEMA);
    if (!validation.isValid) {
        return createStandardResponse("error", "Parameter validation failed", {
            errors: validation.errors,
            schema: BATCH_CREATE_SHAPE_LAYERS_SCHEMA
        });
    }
    
    var params = validation.normalizedArgs;
    
    // 使用统一的批量处理框架
    return processBatchOperation(
        params.shapeLayers,
        function(layerConfig, index, validateMode) {
            try {
                // 验证必需参数
                if (!layerConfig.shapeType || layerConfig.shapeType === "") {
                    throw new Error("Shape type is required");
                }
                
                var validShapeTypes = ["rectangle", "ellipse", "polygon", "star"];
                if (validShapeTypes.indexOf(layerConfig.shapeType) === -1) {
                    throw new Error("Invalid shape type: " + layerConfig.shapeType);
                }
                
                if (validateMode) {
                    // 仅验证模式，检查参数有效性
                    var testValidation = validateParameters(layerConfig, CREATE_SHAPE_LAYER_SCHEMA);
                    if (!testValidation.isValid) {
                        throw new Error("Invalid parameters: " + testValidation.errors.join(", "));
                    }
                    return { success: true, result: { validated: true } };
                } else {
                    // 实际创建形状图层
                    var createResult = createShapeLayer(layerConfig);
                    var parsedResult = JSON.parse(createResult);
                    
                    if (parsedResult.status === "success") {
                        return { success: true, result: parsedResult.layer };
                    } else {
                        throw new Error(parsedResult.message || "Failed to create shape layer");
                    }
                }
            } catch (error) {
                return { success: false, error: error.toString() };
            }
        },
        {
            skipErrors: params.skipErrors,
            validateOnly: params.validateOnly,
            operationName: "Batch Create Shape Layers",
            itemName: "shape layer"
        }
    );
} 