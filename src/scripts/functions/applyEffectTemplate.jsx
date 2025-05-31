// applyEffectTemplate.jsx
// Applies predefined effect templates to layers (Refactored)

//@include "utils.jsx"
//@include "effectsCore.jsx"
//@include "effectTemplates.jsx"

// ========== 参数验证Schema ==========
var APPLY_EFFECT_TEMPLATE_SCHEMA = {
    name: "applyEffectTemplate",
    description: "为图层应用预定义的特效模板",
    category: "effects",
    required: ["templateName"],
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
            "default": 1,
            min: 1,
            max: 1000
        },
        templateName: {
            type: "string",
            description: "特效模板名称",
            example: "gaussian-blur",
            "enum": [
                "gaussian-blur", "directional-blur", "color-balance", 
                "brightness-contrast", "curves", "glow", "drop-shadow",
                "cinematic-look", "text-pop"
            ]
        },
        customSettings: {
            type: "object",
            description: "自定义设置（覆盖模板默认值）",
            example: { "blurriness": 15, "opacity": 80 }
        }
    },
    examples: [
        {
            name: "应用高斯模糊模板",
            args: {
                compName: "Main Comp",
                layerIndex: 1,
                templateName: "gaussian-blur",
                customSettings: {
                    "Blurriness": 25
                }
            }
        },
        {
            name: "应用投影模板",
            args: {
                compName: "Effects Comp",
                layerIndex: 2,
                templateName: "drop-shadow",
                customSettings: {
                    "Opacity": 60,
                    "Distance": 15
                }
            }
        },
        {
            name: "应用电影风格模板",
            args: {
                compName: "Cinematic Comp",
                layerIndex: 1,
                templateName: "cinematic-look"
            }
        }
    ]
};

function applyEffectTemplate(args) {
    try {
        // 参数验证（使用增强的验证函数）
        var validation = validateEffectParameters(args, APPLY_EFFECT_TEMPLATE_SCHEMA, function(params) {
            // 验证模板名称
            return validateTemplateName(params.templateName);
        });
        
        if (!validation.isValid) {
            return createStandardResponse("error", "Parameter validation failed", {
                errors: validation.errors,
                schema: APPLY_EFFECT_TEMPLATE_SCHEMA
            });
        }
        
        var params = validation.normalizedArgs;
        
        // 查找图层（使用核心工具函数）
        var layerResult = findLayerInComposition(params.compName, params.layerIndex);
        if (!layerResult.success) {
            return createStandardResponse("error", layerResult.error);
        }
        
        var comp = layerResult.composition;
        var layer = layerResult.layer;
        
        // 获取模板信息
        var templateResult = getEffectTemplate(params.templateName);
        if (!templateResult.success) {
            return createStandardResponse("error", templateResult.error, {
                availableTemplates: templateResult.availableTemplates
            });
        }
        
        var template = templateResult.template;
        var appliedEffects = [];
        
        // 应用单个特效或特效链
        if (template.type === "single") {
            // 合并设置
            var finalSettings = mergeTemplateSettings(template.defaultSettings, params.customSettings);
            
            var effectResult = applySingleEffect(layer, {
                effectMatchName: template.effectMatchName,
                effectSettings: finalSettings
            });
            
            if (!effectResult.success) {
                return createStandardResponse("error", effectResult.error);
            }
            
            appliedEffects.push(effectResult.effect);
            
        } else if (template.type === "chain") {
            // 应用特效链
            for (var i = 0; i < template.effects.length; i++) {
                var effectConfig = template.effects[i];
                var finalSettings = mergeTemplateSettings(effectConfig.defaultSettings, params.customSettings);
                
                var effectResult = applySingleEffect(layer, {
                    effectMatchName: effectConfig.effectMatchName,
                    effectSettings: finalSettings
                });
                
                if (!effectResult.success) {
                    return createStandardResponse("error", "Failed to apply effect " + (i + 1) + " in chain: " + effectResult.error);
                }
                
                appliedEffects.push(effectResult.effect);
            }
        }
        
        return createStandardResponse("success", "Effect template '" + params.templateName + "' applied successfully", {
            template: {
                name: params.templateName,
                type: template.type,
                description: template.description
            },
            appliedEffects: appliedEffects,
            layer: {
                name: layer.name,
                index: params.layerIndex
            },
            composition: {
                name: comp.name
            }
        });
        
    } catch (error) {
        return createStandardResponse("error", "Unexpected error: " + error.toString());
    }
}

// ========== 测试函数 ==========
function testApplyEffectTemplate() {
    try {
        logAlert("开始测试 applyEffectTemplate 函数...");
        
        // 测试用例1: 应用高斯模糊模板
        var testArgs1 = {
            compName: "",  // 使用当前活动合成
            layerIndex: 1,
            templateName: "gaussian-blur",
            customSettings: {
                "Blurriness": 15
            }
        };
        
        logAlert("测试高斯模糊模板...");
        var result1 = applyEffectTemplate(testArgs1);
        logAlert("高斯模糊模板测试结果:\n" + result1);
        
        // 测试用例2: 应用投影模板
        var testArgs2 = {
            compName: "",
            layerIndex: 1,
            templateName: "drop-shadow",
            customSettings: {
                "Opacity": 60,
                "Distance": 15
            }
        };
        
        logAlert("测试投影模板...");
        var result2 = applyEffectTemplate(testArgs2);
        logAlert("投影模板测试结果:\n" + result2);
        
        // 测试用例3: 应用发光模板
        var testArgs3 = {
            compName: "",
            layerIndex: 1,
            templateName: "glow",
            customSettings: {
                "Glow Threshold": 40,
                "Glow Radius": 20
            }
        };
        
        logAlert("测试发光模板...");
        var result3 = applyEffectTemplate(testArgs3);
        logAlert("发光模板测试结果:\n" + result3);
        
        // 测试用例4: 应用亮度对比度模板
        var testArgs4 = {
            compName: "",
            layerIndex: 1,
            templateName: "brightness-contrast",
            customSettings: {
                "Brightness": 20,
                "Contrast": 30
            }
        };
        
        logAlert("测试亮度对比度模板...");
        var result4 = applyEffectTemplate(testArgs4);
        logAlert("亮度对比度模板测试结果:\n" + result4);
        
        // 测试用例5: 应用电影风格模板（链式效果）
        var testArgs5 = {
            compName: "",
            layerIndex: 1,
            templateName: "cinematic-look"
        };
        
        logAlert("测试电影风格模板...");
        var result5 = applyEffectTemplate(testArgs5);
        logAlert("电影风格模板测试结果:\n" + result5);
        
        logAlert("applyEffectTemplate 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testApplyEffectTemplate(); 