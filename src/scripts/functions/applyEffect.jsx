// applyEffect.jsx
// Applies an effect to a specified layer in a composition (Refactored)

//@include "utils.jsx"
//@include "effectsCore.jsx"

// ========== 参数验证Schema ==========
var APPLY_EFFECT_SCHEMA = {
    name: "applyEffect",
    description: "为指定图层应用特效",
    category: "effects",
    required: ["compName", "layerIndex"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        layerIndex: {
            type: "integer",
            description: "图层索引（1开始）",
            example: 1,
            min: 1,
            max: 1000
        },
        effectName: {
            type: "string",
            description: "特效显示名称",
            example: "Gaussian Blur"
        },
        effectMatchName: {
            type: "string",
            description: "特效内部名称（更可靠）",
            example: "ADBE Gaussian Blur 2"
        },
        effectCategory: {
            type: "string",
            description: "特效分类（可选，用于筛选）",
            example: "Blur & Sharpen"
        },
        presetPath: {
            type: "string",
            description: "特效预设文件路径",
            example: "/path/to/preset.ffx"
        },
        effectSettings: {
            type: "object",
            description: "特效参数设置",
            example: { "Blurriness": 10, "Blur Dimensions": "Horizontal and Vertical" }
        }
    },
    validation: "effectName、effectMatchName或presetPath至少需要提供一个",
    examples: [
        {
            name: "通过内部名称应用高斯模糊",
            args: {
                compName: "Main Comp",
                layerIndex: 1,
                effectMatchName: "ADBE Gaussian Blur 2",
                effectSettings: {
                    "Blurriness": 5.0
                }
            }
        },
        {
            name: "通过显示名称应用发光效果",
            args: {
                compName: "Effects Comp",
                layerIndex: 2,
                effectName: "Glow",
                effectSettings: {
                    "Glow Threshold": 50,
                    "Glow Radius": 10
                }
            }
        },
        {
            name: "应用预设文件",
            args: {
                compName: "Preset Comp",
                layerIndex: 1,
                presetPath: "/Users/Username/Documents/Adobe/After Effects 2024/User Presets/My Effect.ffx"
            }
        }
    ]
};

function applyEffect(args) {
    // 参数验证（使用增强的验证函数）
    var validation = validateEffectParameters(args, APPLY_EFFECT_SCHEMA, function(params) {
        // 自定义验证逻辑
        if (!params.effectName && !params.effectMatchName && !params.presetPath) {
            return {
                isValid: false,
                errors: ["You must specify either effectName, effectMatchName, or presetPath"]
            };
        }
        return { isValid: true };
    });
    
    if (!validation.isValid) {
        return createStandardResponse("error", "Parameter validation failed", {
            errors: validation.errors,
            schema: APPLY_EFFECT_SCHEMA
        });
    }
    
    var params = validation.normalizedArgs;
    
    // 使用统一的图层操作函数
    return performLayerOperation(params.compName, params.layerIndex, function(layer, comp) {
        // 应用特效（使用核心函数）
        var effectResult = applySingleEffect(layer, {
            effectName: params.effectName,
            effectMatchName: params.effectMatchName,
            presetPath: params.presetPath,
            effectSettings: params.effectSettings
        });
        
        if (!effectResult.success) {
            throw new Error(effectResult.error);
        }
        
        return createStandardResponse("success", "Effect applied successfully", {
            effect: effectResult.effect,
            layer: {
                name: layer.name,
                index: params.layerIndex
            },
            composition: {
                name: comp.name
            }
        });
    }, "Apply Effect");
}

// ========== 测试函数 ==========
function testApplyEffect() {
    try {
        logAlert("开始测试 applyEffect 函数...");
        
        // 测试用例1: 添加高斯模糊
        var testArgs1 = {
            compName: "",  // 使用当前活动合成
            layerIndex: 1,
            effectName: "Gaussian Blur",
            properties: {
                "Blurriness": 10
            }
        };
        
        logAlert("测试高斯模糊效果...");
        var result1 = applyEffect(testArgs1);
        logAlert("高斯模糊测试结果:\n" + result1);
        
        // 测试用例2: 添加发光效果
        var testArgs2 = {
            compName: "",
            layerIndex: 1,
            effectName: "Glow",
            properties: {
                "Glow Intensity": 1.5,
                "Glow Radius": 20
            }
        };
        
        logAlert("测试发光效果...");
        var result2 = applyEffect(testArgs2);
        logAlert("发光效果测试结果:\n" + result2);
        
        // 测试用例3: 添加阴影效果
        var testArgs3 = {
            compName: "",
            layerIndex: 1,
            effectName: "Drop Shadow",
            properties: {
                "Distance": 15,
                "Softness": 10
            }
        };
        
        logAlert("测试阴影效果...");
        var result3 = applyEffect(testArgs3);
        logAlert("阴影效果测试结果:\n" + result3);
        
        // 测试用例4: 错误情况（无效图层索引）
        var testArgs4 = {
            compName: "",
            layerIndex: 999,  // 不存在的图层索引
            effectName: "Blur"
        };
        
        logAlert("测试错误情况（无效图层索引）...");
        var result4 = applyEffect(testArgs4);
        logAlert("错误测试结果:\n" + result4);
        
        logAlert("applyEffect 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testApplyEffect(); 
