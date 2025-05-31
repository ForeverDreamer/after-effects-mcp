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
        logAlert("DEBUG: setLayerKeyframe 函数开始执行");
        
        // 安全的值转换，避免数组toString()导致的除零错误
        var valueStr = "";
        var valueType = typeof value;
        try {
            if (value instanceof Array) {
                valueStr = "[" + value.join(",") + "]";
                valueType = "array";
            } else {
                valueStr = String(value);
            }
        } catch (conversionError) {
            valueStr = "无法转换";
            valueType = typeof value;
        }
        
        logAlert("DEBUG: 原始参数 - compName='" + compName + "', layerIndex=" + layerIndex + ", propertyName='" + propertyName + "', timeInSeconds=" + timeInSeconds + ", value=" + valueStr + " (type: " + valueType + ")");
        
        // 添加数组类型检查
        if (value instanceof Array) {
            logAlert("DEBUG: 检测到数组参数，长度: " + value.length + ", 内容: [" + value.join(",") + "]");
        }
        
        // 构建参数对象进行验证
        var args = {
            compName: compName,
            layerIndex: layerIndex,
            propertyName: propertyName,
            timeInSeconds: timeInSeconds,
            value: value
        };
        
        logAlert("DEBUG: 开始参数验证...");
        
        // 参数验证
        try {
            var validation = validateParameters(args, SET_LAYER_KEYFRAME_SCHEMA);
            logAlert("DEBUG: validateParameters调用完成");
        } catch (validationError) {
            logAlert("DEBUG: validateParameters调用失败: " + validationError.toString());
            throw validationError;
        }
        
        if (!validation.isValid) {
            logAlert("DEBUG: 参数验证失败 - " + validation.errors.join(", "));
            return JSON.stringify({
                success: false,
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: SET_LAYER_KEYFRAME_SCHEMA
            }, null, 2);
        }
        
        logAlert("DEBUG: 参数验证成功");
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        // 调试信息：查看实际的参数值
        logAlert("调试信息 - 参数类型: compName=" + typeof params.compName + 
                ", layerIndex=" + typeof params.layerIndex + 
                ", propertyName=" + typeof params.propertyName + 
                ", timeInSeconds=" + typeof params.timeInSeconds + 
                ", value=" + typeof params.value);
        logAlert("调试信息 - 参数值: compName='" + params.compName + 
                "', layerIndex=" + params.layerIndex + 
                ", propertyName='" + params.propertyName + 
                "', timeInSeconds=" + params.timeInSeconds + 
                ", value=" + (params.value instanceof Array ? "[" + params.value.join(",") + "]" : params.value));
        
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

        logAlert("DEBUG: 查找属性 '" + params.propertyName + "'...");
        
        var property = null;
        
        // 首先尝试在Transform组中查找
        property = transformGroup.property(params.propertyName);
        logAlert("DEBUG: 在Transform组中查找结果: " + (property ? "找到" : "未找到"));
        
        // 如果在Transform组中没有找到，尝试直接在图层上查找
        if (!property) {
            property = layer.property(params.propertyName);
            logAlert("DEBUG: 在图层直接属性中查找结果: " + (property ? "找到" : "未找到"));
        }
        
        // 如果还是没有找到，尝试在Effects或Text组中查找
        if (!property) {
             if (layer.property("Effects") && layer.property("Effects").property(params.propertyName)) {
                 property = layer.property("Effects").property(params.propertyName);
                 logAlert("DEBUG: 在Effects组中找到属性");
             } else if (layer.property("Text") && layer.property("Text").property(params.propertyName)) {
                 property = layer.property("Text").property(params.propertyName);
                 logAlert("DEBUG: 在Text组中找到属性");
            }
        }

        if (!property) {
             logAlert("DEBUG: 属性 '" + params.propertyName + "' 在所有位置都未找到");
             return JSON.stringify({ success: false, message: "Property '" + params.propertyName + "' not found on layer '" + layer.name + "'." });
        }
        
        logAlert("DEBUG: 属性找到，检查是否可以设置关键帧...");

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

        // 调试信息：查看即将设置的关键帧值
        logAlert("调试信息 - 即将设置关键帧: 属性='" + params.propertyName + 
                "', 时间=" + params.timeInSeconds + 
                ", 值类型=" + typeof params.value + 
                ", 值内容=" + (params.value instanceof Array ? "[" + params.value.join(",") + "]" : params.value) +
                ", 属性维度=" + (typeof property.value.length !== 'undefined' ? property.value.length : "单维"));

        // 对于Opacity属性，需要将0-100的值转换为0-1的范围
        var finalValue = params.value;
        if (params.propertyName === "Opacity" && typeof params.value === "number") {
            finalValue = params.value / 100.0;
            logAlert("DEBUG: Opacity值转换 - 原值: " + params.value + ", 转换后: " + finalValue);
        }

        // 设置关键帧
        property.setValueAtTime(params.timeInSeconds, finalValue);

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
    
    logAlert(results.join("\n"));
}

// 取消下面的注释来运行完整测试
// testAllKeyframes(); 

// ========== 测试函数 ==========
function testSetLayerKeyframe() {
    var failureCount = 0;
    var testCount = 0;
    var failureDetails = [];
    
    try {
        logAlert("开始测试 setLayerKeyframe 函数...");
        
        // 测试用例1: 设置透明度关键帧 - 修复：确保使用数值
        testCount++;
        logAlert("测试透明度关键帧设置...");
        var result1 = setLayerKeyframe("", 1, "Opacity", 1.0, 100);
        logAlert("透明度关键帧测试结果:\n" + result1);
        
        try {
            var parsed1 = JSON.parse(result1);
            if (!parsed1.success) {
                failureCount++;
                failureDetails.push("透明度测试失败: " + parsed1.message);
            }
        } catch (e) {
            failureCount++;
            failureDetails.push("透明度测试结果解析失败");
        }
        
        // 测试用例2: 设置位置关键帧 - 修复：使用3维数组
        testCount++;
        logAlert("测试位置关键帧设置...");
        var result2 = setLayerKeyframe("", 1, "Position", 2.0, [960, 540, 0]);
        logAlert("位置关键帧测试结果:\n" + result2);
        
        try {
            var parsed2 = JSON.parse(result2);
            if (!parsed2.success) {
                failureCount++;
                failureDetails.push("位置测试失败: " + parsed2.message);
            }
        } catch (e) {
            failureCount++;
            failureDetails.push("位置测试结果解析失败");
        }
        
        // 测试用例3: 设置缩放关键帧 - 修复：使用3维数组
        testCount++;
        logAlert("测试缩放关键帧设置...");
        var result3 = setLayerKeyframe("", 1, "Scale", 3.0, [150, 150, 100]);
        logAlert("缩放关键帧测试结果:\n" + result3);
        
        try {
            var parsed3 = JSON.parse(result3);
            if (!parsed3.success) {
                failureCount++;
                failureDetails.push("缩放测试失败: " + parsed3.message);
            }
        } catch (e) {
            failureCount++;
            failureDetails.push("缩放测试结果解析失败");
        }
        
        // 测试用例4: 设置旋转关键帧 - 修复：确保使用数值
        testCount++;
        logAlert("测试旋转关键帧设置...");
        var result4 = setLayerKeyframe("", 1, "Rotation", 2.5, 45.0);
        logAlert("旋转关键帧测试结果:\n" + result4);
        
        try {
            var parsed4 = JSON.parse(result4);
            if (!parsed4.success) {
                failureCount++;
                failureDetails.push("旋转测试失败: " + parsed4.message);
            }
        } catch (e) {
            failureCount++;
            failureDetails.push("旋转测试结果解析失败");
        }
        
        // 测试用例5: 设置锚点关键帧 - 修复：使用3维数组
        testCount++;
        logAlert("测试锚点关键帧设置...");
        var result5 = setLayerKeyframe("", 1, "Anchor Point", 1.5, [100, 100, 0]);
        logAlert("锚点关键帧测试结果:\n" + result5);
        
        try {
            var parsed5 = JSON.parse(result5);
            if (!parsed5.success) {
                failureCount++;
                failureDetails.push("锚点测试失败: " + parsed5.message);
            }
        } catch (e) {
            failureCount++;
            failureDetails.push("锚点测试结果解析失败");
        }
        
        logAlert("setLayerKeyframe 测试完成!");
        logAlert("测试统计: " + (testCount - failureCount) + "/" + testCount + " 成功");
        
        if (failureCount > 0) {
            logAlert("失败详情: " + failureDetails.join("; "));
            return { status: "error", message: failureCount + " 个测试失败，共 " + testCount + " 个测试" };
        } else {
            return { status: "success", message: "所有 " + testCount + " 个测试用例都成功" };
        }
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return { status: "error", message: error.toString() };
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testSetLayerKeyframe(); 