//@include "utils.jsx"

// ========== 参数验证Schema ==========
var BATCH_APPLY_EFFECTS_SCHEMA = {
    name: "batchApplyEffects",
    description: "批量为多个图层应用特效或特效模板",
    category: "effects",
    required: ["compName", "layerIndices"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            default: ""
        },
        layerIndices: {
            type: "array",
            description: "要应用特效的图层索引数组（1开始）",
            example: [1, 2, 3],
            minLength: 1
        },
        effectTemplate: {
            type: "string",
            description: "特效模板名称",
            example: "Drop Shadow",
            enum: ["Glow", "Drop Shadow", "Blur", "Sharpen", "Color Correction"]
        },
        effectMatchName: {
            type: "string",
            description: "特效内部名称（与effectTemplate二选一）",
            example: "ADBE Drop Shadow"
        },
        effectSettings: {
            type: "object",
            description: "特效参数设置",
            example: { "Opacity": 75, "Distance": 5 }
        },
        skipErrors: {
            type: "boolean",
            description: "是否跳过错误继续处理其他图层",
            example: true,
            default: true
        }
    },
    validation: "effectTemplate或effectMatchName必须提供其中一个",
    examples: [
        {
            name: "批量应用阴影模板",
            args: {
                compName: "Main Comp",
                layerIndices: [1, 2, 3],
                effectTemplate: "Drop Shadow",
                effectSettings: {
                    "Opacity": 50,
                    "Distance": 8
                }
            }
        },
        {
            name: "批量应用自定义特效",
            args: {
                compName: "Effects Comp",
                layerIndices: [1, 3, 5],
                effectMatchName: "ADBE Gaussian Blur 2",
                effectSettings: {
                    "Blurriness": 15
                },
                skipErrors: false
            }
        }
    ]
};

/**
 * Batch apply effects or effect templates to multiple layers
 * @param {Object} args - Parameters object containing:
 *   - compName: Composition name
 *   - layerIndices: Array of layer indices to apply effects to
 *   - effectTemplate: Template name (optional)
 *   - effectMatchName: Effect match name (optional)
 *   - effectSettings: Effect settings object (optional)
 *   - skipErrors: Whether to skip errors and continue with other layers
 * @returns {string} JSON string with batch operation results
 */
function batchApplyEffects(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, BATCH_APPLY_EFFECTS_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: BATCH_APPLY_EFFECTS_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        // 验证特效参数逻辑
        if (!params.effectTemplate && !params.effectMatchName) {
            return JSON.stringify({
                status: "error",
                message: "Must specify either effectTemplate or effectMatchName"
            }, null, 2);
        }
        
        // Find the composition using utility function
        var compResult = getCompositionByName(params.compName);
        if (compResult.error) {
            return JSON.stringify({
                status: "error",
                message: compResult.error
            }, null, 2);
        }
        var comp = compResult.composition;
        
        var results = [];
        var successCount = 0;
        var errorCount = 0;
        
        // Process each layer
        for (var i = 0; i < params.layerIndices.length; i++) {
            var layerIndex = params.layerIndices[i];
            try {
                var layer = comp.layers[layerIndex];
                if (!layer) {
                    var errorMsg = "Layer not found at index " + layerIndex;
                    if (params.skipErrors) {
                        results.push({
                            layerIndex: layerIndex,
                            status: "skipped",
                            message: errorMsg
                        });
                        errorCount++;
                        continue;
                    } else {
                        return JSON.stringify({
                            status: "error",
                            message: errorMsg,
                            processedLayers: results.length
                        }, null, 2);
                    }
                }
                
                var effect;
                
                // Apply effect template or direct effect
                if (params.effectTemplate) {
                    // Load and apply effect template
                    effect = applyEffectTemplateToLayer(layer, params.effectTemplate, params.effectSettings);
                } else {
                    // Apply direct effect
                    effect = layer.property("Effects").addProperty(params.effectMatchName);
                    
                    // Apply settings if provided
                    if (params.effectSettings) {
                        for (var settingName in params.effectSettings) {
                            try {
                                var prop = effect.property(settingName);
                                if (prop) {
                                    prop.setValue(params.effectSettings[settingName]);
                                }
                            } catch (settingError) {
                                // Log setting error but continue
                            }
                        }
                    }
                }
                
                results.push({
                    layerIndex: layerIndex,
                    layerName: layer.name,
                    status: "success",
                    effectName: params.effectTemplate || params.effectMatchName
                });
                successCount++;
                
            } catch (layerError) {
                var layerErrorMsg = "Error processing layer " + layerIndex + ": " + layerError.toString();
                if (params.skipErrors) {
                    results.push({
                        layerIndex: layerIndex,
                        status: "error",
                        message: layerErrorMsg
                    });
                    errorCount++;
                } else {
                    return JSON.stringify({
                        status: "error",
                        message: layerErrorMsg,
                        processedLayers: results.length
                    }, null, 2);
                }
            }
        }
        
        return JSON.stringify({
            status: "success",
            message: "Batch effect application completed",
            summary: {
                totalLayers: params.layerIndices.length,
                successCount: successCount,
                errorCount: errorCount,
                effectApplied: params.effectTemplate || params.effectMatchName
            },
            results: results
        }, null, 2);
        
    } catch (error) {
        return JSON.stringify({
            status: "error",
            message: "Batch apply effects failed: " + error.toString()
        }, null, 2);
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