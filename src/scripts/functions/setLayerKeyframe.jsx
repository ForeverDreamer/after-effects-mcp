//@include "utils.jsx"

// ========== 参数验证Schema ==========
var SET_LAYER_KEYFRAME_SCHEMA = {
    name: "setLayerKeyframe",
    description: "为图层的特定属性设置关键帧",
    category: "animation",
    required: ["compName", "layerIndex", "propertyName", "timeInSeconds", "value"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        layerIndex: {
            type: "integer",
            description: "图层索引（1-based）",
            example: 1,
            min: 1
        },
        propertyName: {
            type: "string",
            description: "属性名称",
            example: "Position",
            "enum": ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"]
        },
        timeInSeconds: {
            type: "number",
            description: "关键帧时间（秒）",
            example: 1.0,
            min: 0.0,
            max: 3600.0
        },
        value: {
            type: "number",
            description: "属性值（根据属性类型可能是数字或数组）",
            example: 50
        }
    },
    examples: [
        {
            name: "设置透明度关键帧",
            args: {
                compName: "Main Comp",
                layerIndex: 1,
                propertyName: "Opacity",
                timeInSeconds: 1.0,
                value: 50
            }
        },
        {
            name: "设置位置关键帧",
            args: {
                compName: "Animation Comp",
                layerIndex: 2,
                propertyName: "Position",
                timeInSeconds: 2.5,
                value: [960, 540]
            }
        }
    ]
};

function setLayerKeyframe(compName, layerIndex, propertyName, timeInSeconds, value) {
    try {
        // 构建参数对象进行验证
        var args = {
            compName: compName,
            layerIndex: layerIndex,
            propertyName: propertyName,
            timeInSeconds: timeInSeconds,
            value: value
        };
        
        // 参数验证
        var validation = validateParameters(args, SET_LAYER_KEYFRAME_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                success: false,
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: SET_LAYER_KEYFRAME_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        // Find the composition using utility function
        var compResult = getCompositionByName(params.compName);
        if (compResult.error) {
            return JSON.stringify({ success: false, message: compResult.error });
        }
        var comp = compResult.composition;
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ success: false, message: "Composition not found" });
        }
        var layer = comp.layers[params.layerIndex];
        if (!layer) {
            return JSON.stringify({ success: false, message: "Layer not found at index " + params.layerIndex + " in composition '" + comp.name + "'"});
        }

        var transformGroup = layer.property("Transform");
        if (!transformGroup) {
             return JSON.stringify({ success: false, message: "Transform properties not found for layer '" + layer.name + "' (type: " + layer.matchName + ")." });
        }

        var property = transformGroup.property(params.propertyName);
        if (!property) {
             if (layer.property("Effects") && layer.property("Effects").property(params.propertyName)) {
                 property = layer.property("Effects").property(params.propertyName);
             } else if (layer.property("Text") && layer.property("Text").property(params.propertyName)) {
                 property = layer.property("Text").property(params.propertyName);
            }

            if (!property) {
                 return JSON.stringify({ success: false, message: "Property '" + params.propertyName + "' not found on layer '" + layer.name + "'." });
            }
        }

        if (!property.canVaryOverTime) {
             return JSON.stringify({ success: false, message: "Property '" + params.propertyName + "' cannot be keyframed." });
        }

        if (property.numKeys === 0 && !property.isTimeVarying) {
             property.setValueAtTime(comp.time, property.value);
        }

        property.setValueAtTime(params.timeInSeconds, params.value);

        return JSON.stringify({ 
            success: true, 
            message: "Keyframe set for '" + params.propertyName + "' on layer '" + layer.name + "' at " + params.timeInSeconds + "s.",
            details: {
                compName: comp.name,
                layerName: layer.name,
                propertyName: params.propertyName,
                timeInSeconds: params.timeInSeconds,
                value: params.value
            }
        });
    } catch (e) {
        return JSON.stringify({ 
            success: false, 
            message: "Error setting keyframe: " + e.toString() + " (Line: " + e.line + ")" 
        });
    }
} 