//@include "utils.jsx"

// ========== 参数验证Schema ==========
var SET_LAYER_EXPRESSION_SCHEMA = {
    name: "setLayerExpression",
    description: "为图层的特定属性设置表达式",
    category: "animation",
    required: ["compName", "layerIndex", "propertyName", "expressionString"],
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
        expressionString: {
            type: "string",
            description: "表达式代码（空字符串移除表达式）",
            example: "wiggle(1, 50)",
            maxLength: 5000
        }
    },
    examples: [
        {
            name: "添加位置摆动表达式",
            args: {
                compName: "Main Comp",
                layerIndex: 1,
                propertyName: "Position",
                expressionString: "wiggle(2, 30)"
            }
        },
        {
            name: "添加缩放呼吸表达式",
            args: {
                compName: "Animation Comp",
                layerIndex: 2,
                propertyName: "Scale",
                expressionString: "s = Math.sin(time * 2) * 10; [value[0] + s, value[1] + s]"
            }
        },
        {
            name: "移除透明度表达式",
            args: {
                compName: "Effects Comp",
                layerIndex: 1,
                propertyName: "Opacity",
                expressionString: ""
            }
        }
    ]
};

function setLayerExpression(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, SET_LAYER_EXPRESSION_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                success: false,
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: SET_LAYER_EXPRESSION_SCHEMA
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

        var property = transformGroup ? transformGroup.property(params.propertyName) : null;
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

        if (!property.canSetExpression) {
            return JSON.stringify({ success: false, message: "Property '" + params.propertyName + "' does not support expressions." });
        }

        property.expression = params.expressionString;

        var action = params.expressionString === "" ? "removed" : "set";
        return JSON.stringify({ 
            success: true, 
            message: "Expression " + action + " for '" + params.propertyName + "' on layer '" + layer.name + "'.",
            details: {
                compName: comp.name,
                layerName: layer.name,
                propertyName: params.propertyName,
                expressionString: params.expressionString,
                action: action
            }
        });
    } catch (e) {
        return JSON.stringify({ 
            success: false, 
            message: "Error setting expression: " + e.toString() + " (Line: " + e.line + ")" 
        });
    }
} 