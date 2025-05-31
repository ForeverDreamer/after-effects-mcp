//@include "utils.jsx"
//@include "effectsCore.jsx"
//@include "effectTemplates.jsx"

// ========== 参数验证Schema ==========
var BATCH_APPLY_EFFECTS_SCHEMA = {
    name: "batchApplyEffects",
    description: "批量为多个图层应用特效或特效模板",
    category: "batch-effects",
    required: ["applications"],
    properties: {
        applications: {
            type: "array",
            description: "特效应用配置数组，支持混合特效和模板",
            example: [
                {
                    "type": "effect",
                    "compName": "Main Comp",
                    "layerIndex": 1,
                    "effectMatchName": "ADBE Gaussian Blur 2",
                    "effectSettings": { "Blurriness": 10 }
                },
                {
                    "type": "template",
                    "compName": "Main Comp",
                    "layerIndex": 2,
                    "templateName": "drop-shadow",
                    "customSettings": { "Opacity": 75 }
                }
            ],
            minLength: 1,
            maxLength: 100
        },
        skipErrors: {
            type: "boolean",
            description: "是否跳过错误继续处理其他特效",
            example: true,
            "default": true
        },
        validateOnly: {
            type: "boolean",
            description: "仅验证参数而不执行应用",
            example: false,
            "default": false
        }
    },
    examples: [
        {
            name: "混合批量应用",
            args: {
                applications: [
                    {
                        type: "template",
                        compName: "Text Comp",
                        layerIndex: 1,
                        templateName: "glow",
                        customSettings: {
                            "Glow Intensity": 2.5
                        }
                    },
                    {
                        type: "effect",
                        compName: "Text Comp",
                        layerIndex: 2,
                        effectMatchName: "ADBE Gaussian Blur 2",
                        effectSettings: {
                            "Blurriness": 15
                        }
                    }
                ],
                skipErrors: true
            }
        },
        {
            name: "批量模板应用",
            args: {
                applications: [
                    {
                        type: "template",
                        compName: "Color Comp",
                        layerIndex: 1,
                        templateName: "cinematic-look"
                    },
                    {
                        type: "template",
                        compName: "Color Comp",
                        layerIndex: 2,
                        templateName: "color-balance",
                        customSettings: {
                            "Hue": 10,
                            "Saturation": 20
                        }
                    }
                ]
            }
        }
    ]
};

function batchApplyEffects(args) {
    try {
        // 参数验证
        var validation = validateEffectParameters(args, BATCH_APPLY_EFFECTS_SCHEMA, function(params) {
            // 验证每个应用配置
            var errors = [];
            for (var i = 0; i < params.applications.length; i++) {
                var app = params.applications[i];
                
                // 验证应用类型
                if (!app.type || (app.type !== "effect" && app.type !== "template")) {
                    errors.push("Application " + (i + 1) + ": type must be 'effect' or 'template'");
                    continue;
                }
                
                // 基础必需字段验证
                if (!app.compName && app.compName !== "") {
                    errors.push("Application " + (i + 1) + ": compName is required");
                }
                
                if (!app.layerIndex || app.layerIndex < 1) {
                    errors.push("Application " + (i + 1) + ": valid layerIndex is required");
                }
                
                // 特效类型特定验证
                if (app.type === "effect") {
                    if (!app.effectName && !app.effectMatchName && !app.presetPath) {
                        errors.push("Application " + (i + 1) + ": effect type requires effectName, effectMatchName, or presetPath");
                    }
                } else if (app.type === "template") {
                    if (!app.templateName) {
                        errors.push("Application " + (i + 1) + ": template type requires templateName");
                    } else {
                        var templateValidation = validateTemplateName(app.templateName);
                        if (!templateValidation.isValid) {
                            errors.push("Application " + (i + 1) + ": " + templateValidation.errors.join(", "));
                        }
                    }
                }
            }
            
            return {
                isValid: errors.length === 0,
                errors: errors
            };
        });
        
        if (!validation.isValid) {
            return createStandardResponse("error", "Parameter validation failed", {
                errors: validation.errors,
                schema: BATCH_APPLY_EFFECTS_SCHEMA
            });
        }
        
        var params = validation.normalizedArgs;
        var applications = params.applications;
        var skipErrors = params.skipErrors;
        var validateOnly = params.validateOnly;
        
        // 开始撤销组
        if (!validateOnly) {
            app.beginUndoGroup("Batch Apply Effects");
        }
        
        try {
            // 处理批量应用
            var processor = function(application, index, validateMode) {
                try {
                    if (validateMode) {
                        // 验证模式：仅检查参数有效性
                        if (application.type === "template") {
                            var templateResult = getEffectTemplate(application.templateName);
                            if (!templateResult.success) {
                                throw new Error("Invalid template: " + templateResult.error);
                            }
                        }
                        
                        // 验证图层存在性
                        var layerCheck = findLayerInComposition(application.compName, application.layerIndex);
                        if (!layerCheck.success) {
                            throw new Error("Layer validation failed: " + layerCheck.error);
                        }
                        
                        return {
                            success: true,
                            result: { validated: true }
                        };
                    }
                    
                    // 执行模式：实际应用特效
                    var layerResult = findLayerInComposition(application.compName, application.layerIndex);
                    if (!layerResult.success) {
                        throw new Error(layerResult.error);
                    }
                    
                    var layer = layerResult.layer;
                    var effectResult;
                    
                    if (application.type === "effect") {
                        // 应用单个特效
                        effectResult = applySingleEffect(layer, {
                            effectName: application.effectName,
                            effectMatchName: application.effectMatchName,
                            presetPath: application.presetPath,
                            effectSettings: application.effectSettings
                        });
                    } else if (application.type === "template") {
                        // 应用特效模板
                        var templateResult = getEffectTemplate(application.templateName);
                        if (!templateResult.success) {
                            throw new Error(templateResult.error);
                        }
                        
                        var template = templateResult.template;
                        var appliedEffects = [];
                        
                        if (template.type === "single") {
                            var finalSettings = mergeTemplateSettings(template.defaultSettings, application.customSettings);
                            var singleResult = applySingleEffect(layer, {
                                effectMatchName: template.effectMatchName,
                                effectSettings: finalSettings
                            });
                            
                            if (!singleResult.success) {
                                throw new Error(singleResult.error);
                            }
                            appliedEffects.push(singleResult.effect);
                            
                        } else if (template.type === "chain") {
                            for (var j = 0; j < template.effects.length; j++) {
                                var effectConfig = template.effects[j];
                                var finalSettings = mergeTemplateSettings(effectConfig.defaultSettings, application.customSettings);
                                var chainResult = applySingleEffect(layer, {
                                    effectMatchName: effectConfig.effectMatchName,
                                    effectSettings: finalSettings
                                });
                                
                                if (!chainResult.success) {
                                    throw new Error("Chain effect " + (j + 1) + " failed: " + chainResult.error);
                                }
                                appliedEffects.push(chainResult.effect);
                            }
                        }
                        
                        effectResult = {
                            success: true,
                            effect: {
                                type: "template",
                                templateName: application.templateName,
                                appliedEffects: appliedEffects
                            }
                        };
                    }
                    
                    if (!effectResult.success) {
                        throw new Error(effectResult.error);
                    }
                    
                    return {
                        success: true,
                        result: {
                            layerName: layer.name,
                            layerIndex: application.layerIndex,
                            compName: application.compName,
                            applicationType: application.type,
                            effect: effectResult.effect
                        }
                    };
                    
                } catch (error) {
                    return {
                        success: false,
                        error: error.toString()
                    };
                }
            };
            
            var batchResult = processBatchOperation(applications, processor, {
                skipErrors: skipErrors,
                validateOnly: validateOnly
            });
            
            // 修复：processBatchOperation 返回的是标准响应格式，需要从data字段获取真实数据
            var resultData = batchResult.data || {};
            
            var finalStatus = "success";
            var finalMessage = validateOnly ? "Validation completed" : "Batch effect application completed";
            
            if (resultData.failed > 0 && resultData.successful === 0) {
                finalStatus = "error";
                finalMessage = "All applications failed";
            } else if (resultData.failed > 0) {
                finalStatus = "partial";
                finalMessage = "Batch operation completed with " + resultData.failed + " errors";
            }
            
            return createStandardResponse(finalStatus, finalMessage, {
                summary: {
                    totalApplications: resultData.totalItems,
                    successful: resultData.successful,
                    failed: resultData.failed,
                    validateOnly: validateOnly
                },
                results: resultData.results,
                errors: resultData.errors
            });
            
        } finally {
            if (!validateOnly) {
                app.endUndoGroup();
            }
        }
        
    } catch (error) {
        if (!validateOnly) {
            try { app.endUndoGroup(); } catch (e) {}
        }
        return createStandardResponse("error", "Batch apply effects failed: " + error.toString());
    }
}

/**
 * Helper function to apply effect template to a layer
 * @param {Layer} layer - Target layer
 * @param {string} templateName - Template name
 * @param {Object} customSettings - Custom settings to override template defaults
 * @returns {Property} Applied effect property
 */
function applyEffectTemplateToLayer(layer, templateName, customSettings) {
    // Effect templates definitions
    var templates = {
        "Glow": {
            effectName: "CC Composite",
            settings: {
                "Glow Intensity": 1.0,
                "Glow Colors": [1, 0.8, 0.2]
            }
        },
        "Drop Shadow": {
            effectName: "Drop Shadow",
            settings: {
                "Opacity": 75,
                "Direction": 135,
                "Distance": 5,
                "Softness": 5
            }
        },
        "Blur": {
            effectName: "Fast Blur",
            settings: {
                "Blurriness": 10
            }
        }
        // Add more templates as needed
    };
    
    var template = templates[templateName];
    if (!template) {
        throw new Error("Effect template '" + templateName + "' not found");
    }
    
    // Apply the effect
    var effect = layer.property("Effects").addProperty(template.effectName);
    
    // Apply template settings
    for (var settingName in template.settings) {
        try {
            var prop = effect.property(settingName);
            if (prop) {
                prop.setValue(template.settings[settingName]);
            }
        } catch (e) {
            // Continue if setting fails
        }
    }
    
    // Apply custom settings (override template defaults)
    if (customSettings) {
        for (var customSetting in customSettings) {
            try {
                var customProp = effect.property(customSetting);
                if (customProp) {
                    customProp.setValue(customSettings[customSetting]);
                }
            } catch (e) {
                // Continue if custom setting fails
            }
        }
    }
    
    return effect;
}

// ========== 测试函数 ==========
function testBatchApplyEffects() {
    try {
        logAlert("开始测试 batchApplyEffects 函数...");
        
        // 测试用例1: 混合批量应用（效果和模板）
        var testArgs1 = {
            applications: [
                {
                    type: "template",
                    compName: "",  // 使用当前活动合成
                    layerIndex: 1,
                    templateName: "glow",
                    customSettings: {
                        "Glow Threshold": 40,
                        "Glow Radius": 15
                    }
                },
                {
                    type: "effect",
                    compName: "",
                    layerIndex: 1,
                    effectMatchName: "ADBE Gaussian Blur 2",
                    effectSettings: {
                        "Blurriness": 10
                    }
                }
            ],
            skipErrors: true
        };
        
        logAlert("测试混合批量应用（效果和模板）...");
        var result1 = batchApplyEffects(testArgs1);
        logAlert("混合批量应用测试结果:\n" + result1);
        
        // 测试用例2: 批量模板应用
        var testArgs2 = {
            applications: [
                {
                    type: "template",
                    compName: "",
                    layerIndex: 1,
                    templateName: "drop-shadow",
                    customSettings: {
                        "Opacity": 60,
                        "Distance": 12
                    }
                },
                {
                    type: "template",
                    compName: "",
                    layerIndex: 1,
                    templateName: "brightness-contrast",
                    customSettings: {
                        "Brightness": 15,
                        "Contrast": 25
                    }
                }
            ]
        };
        
        logAlert("测试批量模板应用...");
        var result2 = batchApplyEffects(testArgs2);
        logAlert("批量模板应用测试结果:\n" + result2);
        
        // 测试用例3: 仅验证模式测试
        var testArgs3 = {
            applications: [
                {
                    type: "effect",
                    compName: "",
                    layerIndex: 1,
                    effectMatchName: "ADBE Drop Shadow",
                    effectSettings: {
                        "Distance": 8,
                        "Opacity": 50
                    }
                }
            ],
            validateOnly: true
        };
        
        logAlert("测试仅验证模式...");
        var result3 = batchApplyEffects(testArgs3);
        logAlert("仅验证模式测试结果:\n" + result3);
        
        // 测试用例4: 测试错误处理
        var testArgs4 = {
            applications: [
                {
                    type: "template",
                    compName: "",
                    layerIndex: 999,  // 无效图层索引
                    templateName: "glow"
                },
                {
                    type: "effect",  // 有效应用
                    compName: "",
                    layerIndex: 1,
                    effectMatchName: "ADBE Gaussian Blur 2",
                    effectSettings: {
                        "Blurriness": 5
                    }
                }
            ],
            skipErrors: true
        };
        
        logAlert("测试错误处理（跳过错误）...");
        var result4 = batchApplyEffects(testArgs4);
        logAlert("错误处理测试结果:\n" + result4);
        
        logAlert("batchApplyEffects 测试完成!");
        
        return { status: "success", message: "所有测试用例已执行完成" };
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return { status: "error", message: error.toString() };
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testBatchApplyEffects(); 