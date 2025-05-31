// batchSetLayerKeyframes.jsx
// Batch set keyframes for multiple layers

//@include "utils.jsx"
//@include "setLayerKeyframe.jsx"

// ========== 参数验证Schema ==========
var BATCH_SET_LAYER_KEYFRAMES_SCHEMA = {
    name: "batchSetLayerKeyframes",
    description: "批量为多个图层设置关键帧",
    category: "batch-animation",
    required: ["keyframes"],
    properties: {
        keyframes: {
            type: "array",
            description: "关键帧配置数组",
            example: [
                {
                    "compName": "Main Comp",
                    "layerIndex": 1,
                    "propertyName": "Opacity",
                    "timeInSeconds": 0,
                    "value": 0
                },
                {
                    "compName": "Main Comp",
                    "layerIndex": 1,
                    "propertyName": "Opacity", 
                    "timeInSeconds": 1,
                    "value": 100
                }
            ],
            minLength: 1,
            maxLength: 200
        },
        skipErrors: {
            type: "boolean",
            description: "是否跳过错误继续处理其他关键帧",
            example: true,
            "default": true
        },
        validateOnly: {
            type: "boolean",
            description: "仅验证参数而不执行设置",
            example: false,
            "default": false
        }
    },
    examples: [
        {
            name: "批量淡入动画",
            args: {
                keyframes: [
                    {
                        compName: "Animation Comp",
                        layerIndex: 1,
                        propertyName: "Opacity",
                        timeInSeconds: 0,
                        value: 0
                    },
                    {
                        compName: "Animation Comp",
                        layerIndex: 1,
                        propertyName: "Opacity",
                        timeInSeconds: 1,
                        value: 100
                    },
                    {
                        compName: "Animation Comp",
                        layerIndex: 2,
                        propertyName: "Opacity",
                        timeInSeconds: 0.5,
                        value: 0
                    },
                    {
                        compName: "Animation Comp",
                        layerIndex: 2,
                        propertyName: "Opacity",
                        timeInSeconds: 1.5,
                        value: 100
                    }
                ],
                skipErrors: true
            }
        },
        {
            name: "批量位置动画",
            args: {
                keyframes: [
                    {
                        compName: "Move Comp",
                        layerIndex: 1,
                        propertyName: "Position",
                        timeInSeconds: 0,
                        value: [100, 540]
                    },
                    {
                        compName: "Move Comp",
                        layerIndex: 1,
                        propertyName: "Position",
                        timeInSeconds: 2,
                        value: [1820, 540]
                    },
                    {
                        compName: "Move Comp",
                        layerIndex: 2,
                        propertyName: "Position",
                        timeInSeconds: 0.5,
                        value: [100, 300]
                    },
                    {
                        compName: "Move Comp",
                        layerIndex: 2,
                        propertyName: "Position",
                        timeInSeconds: 2.5,
                        value: [1820, 300]
                    }
                ]
            }
        }
    ]
};

function batchSetLayerKeyframes(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, BATCH_SET_LAYER_KEYFRAMES_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: BATCH_SET_LAYER_KEYFRAMES_SCHEMA
            }, null, 2);
        }
        
        var params = validation.normalizedArgs;
        var keyframes = params.keyframes;
        var skipErrors = params.skipErrors;
        var validateOnly = params.validateOnly;
        
        var results = {
            status: "success",
            message: validateOnly ? "Validation completed" : "Batch keyframe setting completed",
            totalKeyframes: keyframes.length,
            successful: 0,
            failed: 0,
            results: [],
            errors: []
        };
        
        // 开始撤销组
        if (!validateOnly) {
            app.beginUndoGroup("Batch Set Layer Keyframes");
        }
        
        try {
            // 处理每个关键帧配置
            for (var i = 0; i < keyframes.length; i++) {
                var keyframeConfig = keyframes[i];
                var keyframeResult = {
                    index: i + 1,
                    config: keyframeConfig,
                    status: "pending"
                };
                
                try {
                    // 验证必需参数
                    if (!keyframeConfig.compName && keyframeConfig.compName !== "") {
                        throw new Error("Composition name is required");
                    }
                    
                    if (!keyframeConfig.layerIndex || keyframeConfig.layerIndex < 1) {
                        throw new Error("Valid layer index is required");
                    }
                    
                    if (!keyframeConfig.propertyName || keyframeConfig.propertyName === "") {
                        throw new Error("Property name is required");
                    }
                    
                    if (keyframeConfig.timeInSeconds === undefined || keyframeConfig.timeInSeconds === null) {
                        throw new Error("Time in seconds is required");
                    }
                    
                    if (keyframeConfig.value === undefined || keyframeConfig.value === null) {
                        throw new Error("Keyframe value is required");
                    }
                    
                    if (validateOnly) {
                        // 仅验证模式，检查参数有效性
                        var testValidation = validateParameters(keyframeConfig, SET_LAYER_KEYFRAME_SCHEMA);
                        if (!testValidation.isValid) {
                            throw new Error("Invalid parameters: " + testValidation.errors.join(", "));
                        }
                        keyframeResult.status = "valid";
                        results.successful++;
                    } else {
                        // 实际设置关键帧
                        var setResult = setLayerKeyframe(keyframeConfig);
                        var parsedResult = JSON.parse(setResult);
                        
                        if (parsedResult.success) {
                            keyframeResult.status = "success";
                            keyframeResult.details = parsedResult.details;
                            results.successful++;
                        } else {
                            throw new Error(parsedResult.message || "Failed to set keyframe");
                        }
                    }
                } catch (error) {
                    keyframeResult.status = "error";
                    keyframeResult.error = error.toString();
                    results.failed++;
                    results.errors.push({
                        index: i + 1,
                        config: keyframeConfig,
                        error: error.toString()
                    });
                    
                    if (!skipErrors) {
                        // 如果不跳过错误，立即终止
                        results.status = "error";
                        results.message = "Batch operation failed at keyframe " + (i + 1) + ": " + error.toString();
                        break;
                    }
                }
                
                results.results.push(keyframeResult);
            }
            
            // 设置最终状态
            if (results.failed > 0 && results.successful === 0) {
                results.status = "error";
                results.message = "All keyframe operations failed";
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
            message: "Batch set keyframes failed: " + error.toString(),
            details: {
                line: error.line || "unknown"
            }
        }, null, 2);
    }
}

// ========== 测试函数 ==========
function testBatchSetLayerKeyframes() {
    try {
        logAlert("开始测试 batchSetLayerKeyframes 函数...");
        
        // 测试用例1: 批量淡入动画关键帧
        var testArgs1 = {
            keyframes: [
                {
                    compName: "",  // 使用当前活动合成
                    layerIndex: 1,
                    propertyName: "Opacity",
                    timeInSeconds: 0,
                    value: 0
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Opacity",
                    timeInSeconds: 1,
                    value: 100
                },
                {
                    compName: "",
                    layerIndex: 2,
                    propertyName: "Opacity",
                    timeInSeconds: 0.5,
                    value: 0
                },
                {
                    compName: "",
                    layerIndex: 2,
                    propertyName: "Opacity",
                    timeInSeconds: 1.5,
                    value: 100
                }
            ]
        };
        
        logAlert("测试批量淡入动画关键帧...");
        var result1 = batchSetLayerKeyframes(testArgs1);
        logAlert("批量淡入动画测试结果:\n" + result1);
        
        // 测试用例2: 批量位置和缩放动画
        var testArgs2 = {
            keyframes: [
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Position",
                    timeInSeconds: 0,
                    value: [100, 540, 0]
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Position",
                    timeInSeconds: 2,
                    value: [1820, 540, 0]
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Scale",
                    timeInSeconds: 0,
                    value: [50, 50, 100]
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Scale",
                    timeInSeconds: 2,
                    value: [150, 150, 100]
                }
            ]
        };
        
        logAlert("测试批量位置和缩放动画...");
        var result2 = batchSetLayerKeyframes(testArgs2);
        logAlert("批量位置动画测试结果:\n" + result2);
        
        // 测试用例3: 仅验证模式
        var testArgs3 = {
            keyframes: [
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Rotation",
                    timeInSeconds: 0,
                    value: 0
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Rotation",
                    timeInSeconds: 1,
                    value: 360
                }
            ],
            validateOnly: true
        };
        
        logAlert("测试仅验证模式...");
        var result3 = batchSetLayerKeyframes(testArgs3);
        logAlert("仅验证模式测试结果:\n" + result3);
        
        // 测试用例4: 错误处理（跳过错误）
        var testArgs4 = {
            keyframes: [
                {
                    compName: "",
                    layerIndex: 999,  // 不存在的图层
                    propertyName: "Opacity",
                    timeInSeconds: 0,
                    value: 50
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Opacity",
                    timeInSeconds: 3,
                    value: 80
                }
            ],
            skipErrors: true
        };
        
        logAlert("测试错误处理（跳过错误）...");
        var result4 = batchSetLayerKeyframes(testArgs4);
        logAlert("错误处理测试结果:\n" + result4);
        
        logAlert("batchSetLayerKeyframes 测试完成!");
        
        return { status: "success", message: "所有测试用例已执行完成" };
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return { status: "error", message: error.toString() };
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testBatchSetLayerKeyframes(); 