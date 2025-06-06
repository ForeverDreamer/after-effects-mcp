// batchCreateTextLayers.jsx
// Batch create multiple text layers in compositions

//@include "utils.jsx"
//@include "createTextLayer.jsx"

// ========== 参数验证Schema ==========
var BATCH_CREATE_TEXT_LAYERS_SCHEMA = {
    name: "batchCreateTextLayers",
    description: "批量创建多个文本图层",
    category: "batch-creation",
    required: ["textLayers"],
    properties: {
        textLayers: {
            type: "array",
            description: "文本图层配置数组",
            example: [
                {
                    "text": "Title",
                    "compName": "Main Comp",
                    "position": [960, 300],
                    "fontSize": 72
                },
                {
                    "text": "Subtitle", 
                    "compName": "Main Comp",
                    "position": [960, 400],
                    "fontSize": 48
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
            name: "批量创建标题文本",
            args: {
                textLayers: [
                    {
                        text: "Main Title",
                        compName: "Title Comp",
                        position: [960, 200],
                        fontSize: 72,
                        color: [1, 1, 1],
                        fontFamily: "Arial Black"
                    },
                    {
                        text: "Subtitle",
                        compName: "Title Comp", 
                        position: [960, 350],
                        fontSize: 48,
                        color: [0.8, 0.8, 0.8],
                        fontFamily: "Arial"
                    }
                ],
                skipErrors: true
            }
        },
        {
            name: "批量创建多合成文本",
            args: {
                textLayers: [
                    {
                        text: "Scene 1",
                        compName: "Scene 1",
                        position: [960, 540],
                        fontSize: 60
                    },
                    {
                        text: "Scene 2",
                        compName: "Scene 2", 
                        position: [960, 540],
                        fontSize: 60
                    },
                    {
                        text: "Scene 3",
                        compName: "Scene 3",
                        position: [960, 540], 
                        fontSize: 60
                    }
                ]
            }
        }
    ]
};

function batchCreateTextLayers(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, BATCH_CREATE_TEXT_LAYERS_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: BATCH_CREATE_TEXT_LAYERS_SCHEMA
            }, null, 2);
        }
        
        var params = validation.normalizedArgs;
        var textLayers = params.textLayers;
        var skipErrors = params.skipErrors;
        var validateOnly = params.validateOnly;
        
        var results = {
            status: "success",
            message: validateOnly ? "Validation completed" : "Batch text layer creation completed",
            totalLayers: textLayers.length,
            successful: 0,
            failed: 0,
            results: [],
            errors: []
        };
        
        // 开始撤销组
        if (!validateOnly) {
            app.beginUndoGroup("Batch Create Text Layers");
        }
        
        try {
            // 验证每个文本图层配置
            for (var i = 0; i < textLayers.length; i++) {
                var layerConfig = textLayers[i];
                var layerResult = {
                    index: i + 1,
                    config: layerConfig,
                    status: "pending"
                };
                
                try {
                    // 验证必需参数
                    if (!layerConfig.text || layerConfig.text === "") {
                        throw new Error("Text content is required");
                    }
                    
                    if (validateOnly) {
                        // 仅验证模式，检查参数有效性
                        var testValidation = validateParameters(layerConfig, CREATE_TEXT_LAYER_SCHEMA);
                        if (!testValidation.isValid) {
                            throw new Error("Invalid parameters: " + testValidation.errors.join(", "));
                        }
                        layerResult.status = "valid";
                        results.successful++;
                    } else {
                        // 实际创建文本图层
                        var createResult = createTextLayer(layerConfig);
                        var parsedResult = JSON.parse(createResult);
                        
                        if (parsedResult.status === "success") {
                            layerResult.status = "success";
                            layerResult.layer = parsedResult.layer;
                            results.successful++;
                        } else {
                            throw new Error(parsedResult.message || "Failed to create text layer");
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
                results.message = "All text layer operations failed";
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
            message: "Batch create text layers failed: " + error.toString(),
            details: {
                line: error.line || "unknown"
            }
        }, null, 2);
    }
}

// ========== 测试函数 ==========
function testBatchCreateTextLayers() {
    try {
        logAlert("开始测试 batchCreateTextLayers 函数...");
        
        // 测试用例1: 批量创建标题文本
        var testArgs1 = {
            textLayers: [
                {
                    text: "主标题",
                    compName: "",  // 使用当前活动合成
                    position: [960, 200],
                    fontSize: 72,
                    fillColor: [1, 1, 1],
                    name: "Main Title"
                },
                {
                    text: "副标题",
                    compName: "",
                    position: [960, 300],
                    fontSize: 48,
                    fillColor: [0.8, 0.8, 0.8],
                    name: "Sub Title"
                },
                {
                    text: "描述文本",
                    compName: "",
                    position: [960, 400],
                    fontSize: 36,
                    fillColor: [0.6, 0.6, 0.6],
                    name: "Description Text"
                }
            ]
        };
        
        logAlert("测试批量创建标题文本...");
        var result1 = batchCreateTextLayers(testArgs1);
        logAlert("标题文本批量创建测试结果:\n" + result1);
        
        // 测试用例2: 批量创建不同颜色文本
        var testArgs2 = {
            textLayers: [
                {
                    text: "红色文本",
                    compName: "",
                    position: [300, 600],
                    fontSize: 48,
                    fillColor: [1, 0, 0],
                    name: "Red Text"
                },
                {
                    text: "绿色文本",
                    compName: "",
                    position: [600, 600],
                    fontSize: 48,
                    fillColor: [0, 1, 0],
                    name: "Green Text"
                },
                {
                    text: "蓝色文本",
                    compName: "",
                    position: [900, 600],
                    fontSize: 48,
                    fillColor: [0, 0, 1],
                    name: "Blue Text"
                }
            ]
        };
        
        logAlert("测试批量创建不同颜色文本...");
        var result2 = batchCreateTextLayers(testArgs2);
        logAlert("彩色文本批量创建测试结果:\n" + result2);
        
        // 测试用例3: 仅验证模式
        var testArgs3 = {
            textLayers: [
                {
                    text: "验证文本",
                    compName: "",
                    position: [960, 800],
                    fontSize: 60,
                    fillColor: [1, 1, 0],
                    name: "Validation Text"
                }
            ],
            validateOnly: true
        };
        
        logAlert("测试仅验证模式...");
        var result3 = batchCreateTextLayers(testArgs3);
        logAlert("仅验证模式测试结果:\n" + result3);
        
        // 测试用例4: 错误处理（跳过错误）
        var testArgs4 = {
            textLayers: [
                {
                    text: "",  // 空文本会导致错误
                    compName: "",
                    position: [960, 900],
                    fontSize: 48,
                    name: "Empty Text"
                },
                {
                    text: "有效文本",
                    compName: "",
                    position: [960, 950],
                    fontSize: 48,
                    fillColor: [1, 0, 1],
                    name: "Valid Text"
                }
            ],
            skipErrors: true
        };
        
        logAlert("测试错误处理（跳过错误）...");
        var result4 = batchCreateTextLayers(testArgs4);
        logAlert("错误处理测试结果:\n" + result4);
        
        logAlert("batchCreateTextLayers 测试完成!");
        
        return { status: "success", message: "所有测试用例已执行完成" };
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return { status: "error", message: error.toString() };
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testBatchCreateTextLayers(); 