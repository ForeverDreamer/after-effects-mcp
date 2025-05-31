//@include "utils.jsx"
//@include "layerOperations.jsx"

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

// ========== 测试函数 ==========
function testSetLayerExpression() {
    try {
        logAlert("开始测试 setLayerExpression 函数...");
        
        // 测试用例1: 添加位置摆动表达式
        var testArgs1 = {
            compName: "",  // 使用当前活动合成
            layerIndex: 1,
            propertyName: "Position",
            expressionString: "wiggle(2, 30)"
        };
        
        logAlert("测试位置摆动表达式...");
        var result1 = setLayerExpression(testArgs1);
        logAlert("位置摆动表达式测试结果:\n" + result1);
        
        // 测试用例2: 添加缩放呼吸表达式
        var testArgs2 = {
            compName: "",
            layerIndex: 1,
            propertyName: "Scale",
            expressionString: "s = Math.sin(time * 2) * 10; [value[0] + s, value[1] + s]"
        };
        
        logAlert("测试缩放呼吸表达式...");
        var result2 = setLayerExpression(testArgs2);
        logAlert("缩放呼吸表达式测试结果:\n" + result2);
        
        // 测试用例3: 添加旋转表达式
        var testArgs3 = {
            compName: "",
            layerIndex: 1,
            propertyName: "Rotation",
            expressionString: "time * 50"
        };
        
        logAlert("测试旋转表达式...");
        var result3 = setLayerExpression(testArgs3);
        logAlert("旋转表达式测试结果:\n" + result3);
        
        // 测试用例4: 添加透明度闪烁表达式
        var testArgs4 = {
            compName: "",
            layerIndex: 1,
            propertyName: "Opacity",
            expressionString: "50 + Math.sin(time * 5) * 50"
        };
        
        logAlert("测试透明度闪烁表达式...");
        var result4 = setLayerExpression(testArgs4);
        logAlert("透明度闪烁表达式测试结果:\n" + result4);
        
        // 测试用例5: 移除表达式
        var testArgs5 = {
            compName: "",
            layerIndex: 1,
            propertyName: "Position",
            expressionString: ""
        };
        
        logAlert("测试移除表达式...");
        var result5 = setLayerExpression(testArgs5);
        logAlert("移除表达式测试结果:\n" + result5);
        
        logAlert("setLayerExpression 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testSetLayerExpression(); 