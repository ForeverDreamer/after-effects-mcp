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
            type: ["number", "array"],
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
                value: [960, 540, 0]
            }
        },
        {
            name: "设置缩放关键帧",
            args: {
                compName: "Animation Comp",
                layerIndex: 1,
                propertyName: "Scale",
                timeInSeconds: 1.0,
                value: [100, 100, 100]
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

        // 验证value类型是否匹配属性要求
        var expectedDimensions = property.value.length;
        if (typeof expectedDimensions !== 'undefined') {
            // 这是一个多维属性（如Position, Scale, Anchor Point）
            if (!(params.value instanceof Array)) {
                return JSON.stringify({ 
                    success: false, 
                    message: "Property '" + params.propertyName + "' requires an array value with " + expectedDimensions + " dimensions, but got: " + typeof params.value 
                });
            }
            if (params.value.length !== expectedDimensions) {
                return JSON.stringify({ 
                    success: false, 
                    message: "Property '" + params.propertyName + "' requires " + expectedDimensions + " dimensions, but got " + params.value.length 
                });
            }
        } else {
            // 这是一个单维属性（如Opacity, Rotation）
            if (params.value instanceof Array) {
                return JSON.stringify({ 
                    success: false, 
                    message: "Property '" + params.propertyName + "' requires a single number value, but got an array" 
                });
            }
            if (typeof params.value !== 'number') {
                return JSON.stringify({ 
                    success: false, 
                    message: "Property '" + params.propertyName + "' requires a number value, but got: " + typeof params.value 
                });
            }
        }

        // 确保属性有至少一个关键帧，如果没有则创建一个
        if (property.numKeys === 0 && !property.isTimeVarying) {
             property.setValueAtTime(comp.time, property.value);
        }

        // 设置关键帧
        property.setValueAtTime(params.timeInSeconds, params.value);

        return JSON.stringify({ 
            success: true, 
            message: "Keyframe set for '" + params.propertyName + "' on layer '" + layer.name + "' at " + params.timeInSeconds + "s.",
            details: {
                compName: comp.name,
                layerName: layer.name,
                propertyName: params.propertyName,
                timeInSeconds: params.timeInSeconds,
                value: params.value,
                propertyDimensions: expectedDimensions || 1
            }
        });
    } catch (e) {
        return JSON.stringify({ 
            success: false, 
            message: "Error setting keyframe: " + e.toString() + " (Line: " + e.line + ")" 
        });
    }
} 

// ========== 手动测试调用代码 ==========
// 取消下面的注释来手动测试

// 测试设置透明度关键帧
// var result1 = setLayerKeyframe("", 1, "Opacity", 1.0, 50);
// alert("Opacity Test Result:\n" + result1);

// 测试设置缩放关键帧（修复前可能导致卡死的情况）
// var result2 = setLayerKeyframe("", 1, "Scale", 2.0, [120, 120, 100]);
// alert("Scale Test Result:\n" + result2);

// 测试设置位置关键帧
// var result3 = setLayerKeyframe("", 1, "Position", 3.0, [960, 540, 0]);
// alert("Position Test Result:\n" + result3);

// 测试错误情况：Scale使用单个数字（这应该会报错）
// var result4 = setLayerKeyframe("", 1, "Scale", 4.0, 100);
// alert("Scale Error Test Result:\n" + result4);

// 一键测试所有情况的函数
function testAllKeyframes() {
    var results = [];
    
    try {
        // 测试1: 透明度
        results.push("=== 测试透明度关键帧 ===");
        var result1 = setLayerKeyframe("", 1, "Opacity", 1.0, 50);
        results.push("结果: " + result1);
        
        // 测试2: 缩放（正确的3维数组格式）
        results.push("\n=== 测试缩放关键帧（正确格式）===");
        var result2 = setLayerKeyframe("", 1, "Scale", 2.0, [120, 120, 100]);
        results.push("结果: " + result2);
        
        // 测试3: 位置（正确的3维数组格式）
        results.push("\n=== 测试位置关键帧 ===");
        var result3 = setLayerKeyframe("", 1, "Position", 3.0, [960, 540, 0]);
        results.push("结果: " + result3);
        
        // 测试4: 错误情况 - Scale使用单个数字
        results.push("\n=== 测试缩放关键帧（错误格式）===");
        var result4 = setLayerKeyframe("", 1, "Scale", 4.0, 100);
        results.push("结果: " + result4);
        
        // 测试5: 旋转测试
        results.push("\n=== 测试旋转关键帧 ===");
        var result5 = setLayerKeyframe("", 1, "Rotation", 5.0, 45);
        results.push("结果: " + result5);
        
    } catch (e) {
        results.push("测试过程中发生错误: " + e.toString());
    }
    
    alert(results.join("\n"));
}

// 取消下面的注释来运行完整测试
// testAllKeyframes(); 