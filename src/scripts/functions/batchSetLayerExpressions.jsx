// batchSetLayerExpressions.jsx  
// Batch set expressions for multiple layers

//@include "utils.jsx"
//@include "setLayerExpression.jsx"

// ========== 参数验证Schema ==========
var BATCH_SET_LAYER_EXPRESSIONS_SCHEMA = {
    name: "batchSetLayerExpressions",
    description: "批量为多个图层设置表达式",
    category: "batch-animation",
    required: ["expressions"],
    properties: {
        expressions: {
            type: "array",
            description: "表达式配置数组",
            example: [
                {
                    "compName": "Main Comp",
                    "layerIndex": 1,
                    "propertyName": "Position",
                    "expressionString": "wiggle(2, 30)"
                },
                {
                    "compName": "Main Comp",
                    "layerIndex": 2,
                    "propertyName": "Rotation",
                    "expressionString": "time * 45"
                }
            ],
            minLength: 1,
            maxLength: 100
        },
        skipErrors: {
            type: "boolean",
            description: "是否跳过错误继续处理其他表达式",
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
            name: "批量抖动效果",
            args: {
                expressions: [
                    {
                        compName: "Animation Comp",
                        layerIndex: 1,
                        propertyName: "Position",
                        expressionString: "wiggle(2, 30)"
                    },
                    {
                        compName: "Animation Comp",
                        layerIndex: 2,
                        propertyName: "Position", 
                        expressionString: "wiggle(1, 20)"
                    },
                    {
                        compName: "Animation Comp",
                        layerIndex: 3,
                        propertyName: "Position",
                        expressionString: "wiggle(3, 15)"
                    }
                ],
                skipErrors: true
            }
        },
        {
            name: "批量旋转动画",
            args: {
                expressions: [
                    {
                        compName: "Rotation Comp",
                        layerIndex: 1,
                        propertyName: "Rotation",
                        expressionString: "time * 45"
                    },
                    {
                        compName: "Rotation Comp",
                        layerIndex: 2,
                        propertyName: "Rotation",
                        expressionString: "time * -30"
                    },
                    {
                        compName: "Rotation Comp",
                        layerIndex: 3,
                        propertyName: "Rotation",
                        expressionString: "Math.sin(time) * 180"
                    }
                ]
            }
        }
    ]
};

function batchSetLayerExpressions(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, BATCH_SET_LAYER_EXPRESSIONS_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: BATCH_SET_LAYER_EXPRESSIONS_SCHEMA
            }, null, 2);
        }
        
        var params = validation.normalizedArgs;
        var expressions = params.expressions;
        var skipErrors = params.skipErrors;
        var validateOnly = params.validateOnly;
        
        var results = {
            status: "success",
            message: validateOnly ? "Validation completed" : "Batch expression setting completed",
            totalExpressions: expressions.length,
            successful: 0,
            failed: 0,
            results: [],
            errors: []
        };
        
        // 开始撤销组
        if (!validateOnly) {
            app.beginUndoGroup("Batch Set Layer Expressions");
        }
        
        try {
            // 处理每个表达式配置
            for (var i = 0; i < expressions.length; i++) {
                var expressionConfig = expressions[i];
                var expressionResult = {
                    index: i + 1,
                    config: expressionConfig,
                    status: "pending"
                };
                
                try {
                    // 验证必需参数
                    if (!expressionConfig.compName && expressionConfig.compName !== "") {
                        throw new Error("Composition name is required");
                    }
                    
                    if (!expressionConfig.layerIndex || expressionConfig.layerIndex < 1) {
                        throw new Error("Valid layer index is required");
                    }
                    
                    if (!expressionConfig.propertyName || expressionConfig.propertyName === "") {
                        throw new Error("Property name is required");
                    }
                    
                    if (expressionConfig.expressionString === undefined || expressionConfig.expressionString === null) {
                        throw new Error("Expression string is required (use empty string to remove expression)");
                    }
                    
                    if (validateOnly) {
                        // 仅验证模式，检查参数有效性
                        var testValidation = validateParameters(expressionConfig, SET_LAYER_EXPRESSION_SCHEMA);
                        if (!testValidation.isValid) {
                            throw new Error("Invalid parameters: " + testValidation.errors.join(", "));
                        }
                        expressionResult.status = "valid";
                        results.successful++;
                    } else {
                        // 实际设置表达式
                        var setResult = setLayerExpression({
                            compName: expressionConfig.compName,
                            layerIndex: expressionConfig.layerIndex,
                            propertyName: expressionConfig.propertyName,
                            expressionString: expressionConfig.expressionString
                        });
                        var parsedResult = JSON.parse(setResult);
                        
                        if (parsedResult.success) {
                            expressionResult.status = "success";
                            expressionResult.details = parsedResult.details;
                            results.successful++;
                        } else {
                            throw new Error(parsedResult.message || "Failed to set expression");
                        }
                    }
                } catch (error) {
                    expressionResult.status = "error";
                    expressionResult.error = error.toString();
                    results.failed++;
                    results.errors.push({
                        index: i + 1,
                        config: expressionConfig,
                        error: error.toString()
                    });
                    
                    if (!skipErrors) {
                        // 如果不跳过错误，立即终止
                        results.status = "error";
                        results.message = "Batch operation failed at expression " + (i + 1) + ": " + error.toString();
                        break;
                    }
                }
                
                results.results.push(expressionResult);
            }
            
            // 设置最终状态
            if (results.failed > 0 && results.successful === 0) {
                results.status = "error";
                results.message = "All expression operations failed";
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
            message: "Batch set expressions failed: " + error.toString(),
            details: {
                line: error.line || "unknown"
            }
        }, null, 2);
    }
}

// ========== 测试函数 ==========
function testBatchSetLayerExpressions() {
    try {
        logAlert("开始测试 batchSetLayerExpressions 函数...");
        
        // 测试用例1: 批量摆动表达式
        var testArgs1 = {
            expressions: [
                {
                    compName: "",  // 使用当前活动合成
                    layerIndex: 1,
                    propertyName: "Position",
                    expressionString: "wiggle(2, 30)"
                },
                {
                    compName: "",
                    layerIndex: 2,
                    propertyName: "Scale", 
                    expressionString: "s = Math.sin(time * 3) * 10; [value[0] + s, value[1] + s]"
                }
            ]
        };
        
        logAlert("测试批量摆动表达式...");
        var result1 = batchSetLayerExpressions(testArgs1);
        logAlert("批量摆动表达式测试结果:\n" + result1);
        
        // 测试用例2: 批量旋转和透明度表达式
        var testArgs2 = {
            expressions: [
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Rotation",
                    expressionString: "time * 45"
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Opacity",
                    expressionString: "50 + Math.sin(time * 2) * 50"
                },
                {
                    compName: "",
                    layerIndex: 2,
                    propertyName: "Position",
                    expressionString: "value + [Math.sin(time) * 50, Math.cos(time) * 30]"
                }
            ]
        };
        
        logAlert("测试批量旋转和透明度表达式...");
        var result2 = batchSetLayerExpressions(testArgs2);
        logAlert("批量旋转表达式测试结果:\n" + result2);
        
        // 测试用例3: 仅验证模式
        var testArgs3 = {
            expressions: [
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Scale",
                    expressionString: "[100 + Math.sin(time) * 20, 100 + Math.cos(time) * 20]"
                }
            ],
            validateOnly: true
        };
        
        logAlert("测试仅验证模式...");
        var result3 = batchSetLayerExpressions(testArgs3);
        logAlert("仅验证模式测试结果:\n" + result3);
        
        // 测试用例4: 错误处理（跳过错误）
        var testArgs4 = {
            expressions: [
                {
                    compName: "",
                    layerIndex: 999,  // 不存在的图层
                    propertyName: "Position",
                    expressionString: "wiggle(1, 20)"
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Position",
                    expressionString: "value + [Math.random() * 10, Math.random() * 10]"
                }
            ],
            skipErrors: true
        };
        
        logAlert("测试错误处理（跳过错误）...");
        var result4 = batchSetLayerExpressions(testArgs4);
        logAlert("错误处理测试结果:\n" + result4);
        
        // 测试用例5: 移除表达式
        var testArgs5 = {
            expressions: [
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Position",
                    expressionString: ""  // 空字符串移除表达式
                },
                {
                    compName: "",
                    layerIndex: 1,
                    propertyName: "Rotation",
                    expressionString: ""
                }
            ]
        };
        
        logAlert("测试移除表达式...");
        var result5 = batchSetLayerExpressions(testArgs5);
        logAlert("移除表达式测试结果:\n" + result5);
        
        logAlert("batchSetLayerExpressions 测试完成!");
        
        return { status: "success", message: "所有测试用例已执行完成" };
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return { status: "error", message: error.toString() };
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testBatchSetLayerExpressions(); 