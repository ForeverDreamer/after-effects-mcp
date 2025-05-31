// batchCreateSolidLayers.jsx
// Batch create multiple solid layers in compositions

//@include "utils.jsx"
//@include "createSolidLayer.jsx"

// ========== 参数验证Schema ==========
var BATCH_CREATE_SOLID_LAYERS_SCHEMA = {
    name: "batchCreateSolidLayers",
    description: "批量创建多个纯色图层",
    category: "batch-creation",
    required: ["solidLayers"],
    properties: {
        solidLayers: {
            type: "array",
            description: "纯色图层配置数组",
            example: [
                {
                    "compName": "Main Comp",
                    "color": [1, 0, 0],
                    "name": "Red Background",
                    "size": [1920, 1080]
                },
                {
                    "compName": "Main Comp",
                    "color": [0, 1, 0],
                    "name": "Green Overlay",
                    "size": [400, 300],
                    "position": [760, 390]
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
            name: "批量创建背景图层",
            args: {
                solidLayers: [
                    {
                        compName: "Background Comp",
                        color: [0.1, 0.1, 0.1],
                        name: "Dark Background",
                        size: [1920, 1080],
                        position: [960, 540]
                    },
                    {
                        compName: "Background Comp",
                        color: [1, 1, 1],
                        name: "White Overlay",
                        size: [800, 600],
                        position: [960, 540],
                        opacity: 50
                    }
                ],
                skipErrors: true
            }
        },
        {
            name: "批量创建调整图层",
            args: {
                solidLayers: [
                    {
                        compName: "Color Comp",
                        color: [1, 0, 0],
                        name: "Red Adjustment",
                        isAdjustment: true
                    },
                    {
                        compName: "Color Comp",
                        color: [0, 1, 0],
                        name: "Green Adjustment",
                        isAdjustment: true
                    },
                    {
                        compName: "Color Comp",
                        color: [0, 0, 1],
                        name: "Blue Adjustment",
                        isAdjustment: true
                    }
                ]
            }
        }
    ]
};

function batchCreateSolidLayers(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, BATCH_CREATE_SOLID_LAYERS_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: BATCH_CREATE_SOLID_LAYERS_SCHEMA
            }, null, 2);
        }
        
        var params = validation.normalizedArgs;
        var solidLayers = params.solidLayers;
        var skipErrors = params.skipErrors;
        var validateOnly = params.validateOnly;
        
        var results = {
            status: "success",
            message: validateOnly ? "Validation completed" : "Batch solid layer creation completed",
            totalLayers: solidLayers.length,
            successful: 0,
            failed: 0,
            results: [],
            errors: []
        };
        
        // 开始撤销组
        if (!validateOnly) {
            app.beginUndoGroup("Batch Create Solid Layers");
        }
        
        try {
            // 处理每个纯色图层配置
            for (var i = 0; i < solidLayers.length; i++) {
                var layerConfig = solidLayers[i];
                var layerResult = {
                    index: i + 1,
                    config: layerConfig,
                    status: "pending"
                };
                
                try {
                    // 验证基本参数
                    if (!layerConfig.compName && layerConfig.compName !== "") {
                        throw new Error("Composition name is required");
                    }
                    
                    if (validateOnly) {
                        // 仅验证模式，检查参数有效性
                        var testValidation = validateParameters(layerConfig, CREATE_SOLID_LAYER_SCHEMA);
                        if (!testValidation.isValid) {
                            throw new Error("Invalid parameters: " + testValidation.errors.join(", "));
                        }
                        layerResult.status = "valid";
                        results.successful++;
                    } else {
                        // 实际创建纯色图层
                        var createResult = createSolidLayer(layerConfig);
                        var parsedResult = JSON.parse(createResult);
                        
                        if (parsedResult.status === "success") {
                            layerResult.status = "success";
                            layerResult.layer = parsedResult.layer;
                            results.successful++;
                        } else {
                            throw new Error(parsedResult.message || "Failed to create solid layer");
                        }
                    }
                } catch (error) {
                    layerResult.status = "error";
                    layerResult.error = error.toString();
                    results.failed++;
                    results.errors.push({
                        index: i + 1,
                        config: layerConfig,
                        error: error.toString()
                    });
                    
                    if (!skipErrors) {
                        // 如果不跳过错误，立即终止
                        results.status = "error";
                        results.message = "Batch operation failed at layer " + (i + 1) + ": " + error.toString();
                        break;
                    }
                }
                
                results.results.push(layerResult);
            }
            
            // 设置最终状态
            if (results.failed > 0 && results.successful === 0) {
                results.status = "error";
                results.message = "All solid layer operations failed";
            } else if (results.failed > 0) {
                results.status = "partial";
                results.message = "Batch operation completed with " + results.failed + " errors";
            }
            
        } finally {
            if (!validateOnly) {
                app.endUndoGroup();
            }
        }
        
        return JSON.stringify(results, null, 2);
        
    } catch (error) {
        if (!validateOnly) {
            try { app.endUndoGroup(); } catch (e) {}
        }
        return JSON.stringify({
            status: "error",
            message: "Batch create solid layers failed: " + error.toString(),
            details: {
                line: error.line || "unknown"
            }
        }, null, 2);
    }
}

// ========== 测试函数 ==========
function testBatchCreateSolidLayers() {
    try {
        logAlert("开始测试 batchCreateSolidLayers 函数...");
        
        // 测试用例1: 批量创建背景图层
        var testArgs1 = {
            solidLayers: [
                {
                    color: [0.2, 0.2, 0.2],  // 深灰色背景
                    compName: "",  // 使用当前活动合成
                    name: "Dark Background",
                    width: 1920,
                    height: 1080
                },
                {
                    color: [1, 1, 1],  // 白色前景
                    compName: "",
                    name: "White Overlay",
                    width: 800,
                    height: 600,
                    opacity: 80
                }
            ]
        };
        
        logAlert("测试批量创建背景图层...");
        var result1 = batchCreateSolidLayers(testArgs1);
        logAlert("背景图层批量创建测试结果:\n" + result1);
        
        // 测试用例2: 批量创建不同颜色纯色
        var testArgs2 = {
            solidLayers: [
                {
                    color: [1, 0, 0],  // 红色
                    compName: "",
                    name: "Red Layer",
                    width: 400,
                    height: 300,
                    position: [200, 200]
                },
                {
                    color: [0, 1, 0],  // 绿色
                    compName: "",
                    name: "Green Layer",
                    width: 400,
                    height: 300,
                    position: [760, 200]
                },
                {
                    color: [0, 0, 1],  // 蓝色
                    compName: "",
                    name: "Blue Layer",
                    width: 400,
                    height: 300,
                    position: [1320, 200]
                }
            ]
        };
        
        logAlert("测试批量创建不同颜色纯色...");
        var result2 = batchCreateSolidLayers(testArgs2);
        logAlert("彩色纯色批量创建测试结果:\n" + result2);
        
        // 测试用例3: 仅验证模式
        var testArgs3 = {
            solidLayers: [
                {
                    color: [0.5, 0.5, 0.5],
                    compName: "",
                    name: "Validation Layer",
                    width: 1920,
                    height: 1080
                }
            ],
            validateOnly: true
        };
        
        logAlert("测试仅验证模式...");
        var result3 = batchCreateSolidLayers(testArgs3);
        logAlert("仅验证模式测试结果:\n" + result3);
        
        // 测试用例4: 错误处理（跳过错误）
        var testArgs4 = {
            solidLayers: [
                {
                    color: [1.5, 0, 0],  // 无效颜色值（>1）
                    compName: "",
                    name: "Invalid Color Layer",
                    width: 200,
                    height: 200
                },
                {
                    color: [1, 1, 0],  // 有效的黄色
                    compName: "",
                    name: "Valid Yellow Layer",
                    width: 300,
                    height: 300,
                    position: [960, 540]
                }
            ],
            skipErrors: true
        };
        
        logAlert("测试错误处理（跳过错误）...");
        var result4 = batchCreateSolidLayers(testArgs4);
        logAlert("错误处理测试结果:\n" + result4);
        
        logAlert("batchCreateSolidLayers 测试完成!");
        
        return { status: "success", message: "所有测试用例已执行完成" };
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return { status: "error", message: error.toString() };
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testBatchCreateSolidLayers(); 