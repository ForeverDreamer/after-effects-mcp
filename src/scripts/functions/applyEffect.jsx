// applyEffect.jsx
// Applies an effect to a specified layer in a composition

//@include "utils.jsx"

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
    try {
        // 参数验证
        var validation = validateParameters(args, APPLY_EFFECT_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: APPLY_EFFECT_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        // 验证特效参数逻辑
        if (!params.effectName && !params.effectMatchName && !params.presetPath) {
            return JSON.stringify({
                status: "error",
                message: "You must specify either effectName, effectMatchName, or presetPath"
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
        
        // Find the layer by index
        var layer = comp.layer(params.layerIndex);
        if (!layer) {
            return JSON.stringify({
                status: "error",
                message: "Layer not found at index " + params.layerIndex + " in composition '" + comp.name + "'"
            }, null, 2);
        }
        
        var effectResult;
        
        // Apply preset if a path is provided
        if (params.presetPath) {
            var presetFile = new File(params.presetPath);
            if (!presetFile.exists) {
                return JSON.stringify({
                    status: "error",
                    message: "Effect preset file not found: " + params.presetPath
                }, null, 2);
            }
            
            // Apply the preset to the layer
            layer.applyPreset(presetFile);
            effectResult = {
                type: "preset",
                name: params.presetPath.split('/').pop().split('\\').pop(),
                applied: true
            };
        }
        // Apply effect by match name (more reliable method)
        else if (params.effectMatchName) {
            var effect = layer.Effects.addProperty(params.effectMatchName);
            effectResult = {
                type: "effect",
                name: effect.name,
                matchName: effect.matchName,
                index: effect.propertyIndex
            };
            
            // Apply settings if provided
            if (params.effectSettings) {
                applyEffectSettings(effect, params.effectSettings);
            }
        }
        // Apply effect by display name
        else {
            // Get the effect from the Effect menu
            var effect = layer.Effects.addProperty(params.effectName);
            effectResult = {
                type: "effect",
                name: effect.name,
                matchName: effect.matchName,
                index: effect.propertyIndex
            };
            
            // Apply settings if provided
            if (params.effectSettings) {
                applyEffectSettings(effect, params.effectSettings);
            }
        }
        
        return JSON.stringify({
            status: "success",
            message: "Effect applied successfully",
            effect: effectResult,
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

// Helper function to apply effect settings
function applyEffectSettings(effect, settings) {
    // Skip if no settings are provided
    if (!settings || Object.keys(settings).length === 0) {
        return;
    }
    
    // Iterate through all provided settings
    for (var propName in settings) {
        if (settings.hasOwnProperty(propName)) {
            try {
                // Find the property in the effect
                var property = null;
                
                // Try direct property access first
                try {
                    property = effect.property(propName);
                } catch (e) {
                    // If direct access fails, search through all properties
                    for (var i = 1; i <= effect.numProperties; i++) {
                        var prop = effect.property(i);
                        if (prop.name === propName) {
                            property = prop;
                            break;
                        }
                    }
                }
                
                // Set the property value if found
                if (property && property.setValue) {
                    property.setValue(settings[propName]);
                }
            } catch (e) {
                // Log error but continue with other properties
                $.writeln("Error setting effect property '" + propName + "': " + e.toString());
            }
        }
    }
} 