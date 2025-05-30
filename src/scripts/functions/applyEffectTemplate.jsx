// applyEffectTemplate.jsx
// Applies predefined effect templates to layers

//@include "utils.jsx"

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
            default: ""
        },
        layerIndex: {
            type: "integer",
            description: "图层索引（1开始）",
            example: 1,
            default: 1,
            min: 1,
            max: 1000
        },
        templateName: {
            type: "string",
            description: "特效模板名称",
            example: "gaussian-blur",
            enum: [
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
                    "blurriness": 25
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
                    "opacity": 60,
                    "distance": 15
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
        // 参数验证
        var validation = validateParameters(args, APPLY_EFFECT_TEMPLATE_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: APPLY_EFFECT_TEMPLATE_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        // Find the composition using utility function
        var compResult = getCompositionByName(params.compName);
        if (compResult.error) {
            return JSON.stringify({
                status: "error",
                message: compResult.error
            }, null, 2);
        }
        var comp = compResult.composition;
        
        // Find the layer by index
        var layer = comp.layer(params.layerIndex);
        if (!layer) {
            return JSON.stringify({
                status: "error",
                message: "Layer not found at index " + params.layerIndex + " in composition '" + comp.name + "'"
            }, null, 2);
        }
        
        // Template definitions
        var templates = {
            // Blur effects
            "gaussian-blur": {
                effectMatchName: "ADBE Gaussian Blur 2",
                settings: {
                    "Blurriness": params.customSettings && params.customSettings.blurriness || 20
                }
            },
            "directional-blur": {
                effectMatchName: "ADBE Motion Blur",
                settings: {
                    "Direction": params.customSettings && params.customSettings.direction || 0,
                    "Blur Length": params.customSettings && params.customSettings.length || 10
                }
            },
            
            // Color correction effects
            "color-balance": {
                effectMatchName: "ADBE Color Balance (HLS)",
                settings: {
                    "Hue": params.customSettings && params.customSettings.hue || 0,
                    "Lightness": params.customSettings && params.customSettings.lightness || 0,
                    "Saturation": params.customSettings && params.customSettings.saturation || 0
                }
            },
            "brightness-contrast": {
                effectMatchName: "ADBE Brightness & Contrast 2",
                settings: {
                    "Brightness": params.customSettings && params.customSettings.brightness || 0,
                    "Contrast": params.customSettings && params.customSettings.contrast || 0,
                    "Use Legacy": false
                }
            },
            "curves": {
                effectMatchName: "ADBE CurvesCustom"
                // Curves are complex and would need special handling
            },
            
            // Stylistic effects
            "glow": {
                effectMatchName: "ADBE Glo2",
                settings: {
                    "Glow Threshold": params.customSettings && params.customSettings.threshold || 50,
                    "Glow Radius": params.customSettings && params.customSettings.radius || 15,
                    "Glow Intensity": params.customSettings && params.customSettings.intensity || 1
                }
            },
            "drop-shadow": {
                effectMatchName: "ADBE Drop Shadow",
                settings: {
                    "Shadow Color": params.customSettings && params.customSettings.color || [0, 0, 0, 1],
                    "Opacity": params.customSettings && params.customSettings.opacity || 50,
                    "Direction": params.customSettings && params.customSettings.direction || 135,
                    "Distance": params.customSettings && params.customSettings.distance || 10,
                    "Softness": params.customSettings && params.customSettings.softness || 10
                }
            },
            
            // Common effect chains
            "cinematic-look": {
                effects: [
                    {
                        effectMatchName: "ADBE Curves",
                        settings: {} // Would need special handling
                    },
                    {
                        effectMatchName: "ADBE Vibrance",
                        settings: {
                            "Vibrance": 15,
                            "Saturation": -5
                        }
                    },
                    {
                        effectMatchName: "ADBE Vignette",
                        settings: {
                            "Amount": 15,
                            "Roundness": 50,
                            "Feather": 40
                        }
                    }
                ]
            },
            "text-pop": {
                effects: [
                    {
                        effectMatchName: "ADBE Drop Shadow",
                        settings: {
                            "Shadow Color": [0, 0, 0, 1],
                            "Opacity": 75,
                            "Distance": 5,
                            "Softness": 10
                        }
                    },
                    {
                        effectMatchName: "ADBE Glo2",
                        settings: {
                            "Glow Threshold": 50,
                            "Glow Radius": 10,
                            "Glow Intensity": 1.5
                        }
                    }
                ]
            }
        };
        
        // Check if the requested template exists
        var template = templates[params.templateName];
        if (!template) {
            var availableTemplates = Object.keys(templates).join(", ");
            return JSON.stringify({
                status: "error",
                message: "Template '" + params.templateName + "' not found. Available templates: " + availableTemplates
            }, null, 2);
        }
        
        var appliedEffects = [];
        
        // Apply single effect or multiple effects based on template structure
        if (template.effectMatchName) {
            // Single effect template
            var effect = layer.Effects.addProperty(template.effectMatchName);
            
            // Apply settings
            for (var propName in template.settings) {
                try {
                    var property = effect.property(propName);
                    if (property) {
                        property.setValue(template.settings[propName]);
                    }
                } catch (e) {
                    $.writeln("Warning: Could not set " + propName + " on effect " + effect.name + ": " + e);
                }
            }
            
            appliedEffects.push({
                name: effect.name,
                matchName: effect.matchName
            });
        } else if (template.effects) {
            // Multiple effects template
            for (var i = 0; i < template.effects.length; i++) {
                var effectData = template.effects[i];
                var effect = layer.Effects.addProperty(effectData.effectMatchName);
                
                // Apply settings
                for (var propName in effectData.settings) {
                    try {
                        var property = effect.property(propName);
                        if (property) {
                            property.setValue(effectData.settings[propName]);
                        }
                    } catch (e) {
                        $.writeln("Warning: Could not set " + propName + " on effect " + effect.name + ": " + e);
                    }
                }
                
                appliedEffects.push({
                    name: effect.name,
                    matchName: effect.matchName
                });
            }
        }
        
        return JSON.stringify({
            status: "success",
            message: "Effect template '" + params.templateName + "' applied successfully",
            appliedEffects: appliedEffects,
            layer: {
                name: layer.name,
                index: params.layerIndex
            },
            composition: {
                name: comp.name
            }
        }, null, 2);
    } catch (error) {
        return JSON.stringify({
            status: "error",
            message: error.toString()
        }, null, 2);
    }
} 