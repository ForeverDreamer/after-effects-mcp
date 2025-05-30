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