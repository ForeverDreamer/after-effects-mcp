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

// ========== 日志级别控制 ==========
var LOG_LEVEL = {
    ERROR: 0,
    WARN: 1,
    INFO: 2,
    DEBUG: 3
};

// 当前日志级别（可通过全局变量控制）
var CURRENT_LOG_LEVEL = typeof GLOBAL_LOG_LEVEL !== 'undefined' ? GLOBAL_LOG_LEVEL : LOG_LEVEL.INFO;

function logWithLevel(level, message) {
    if (level <= CURRENT_LOG_LEVEL) {
        logAlert(message);
    }
}

// 自定义数组检查函数，兼容ExtendScript
function isArray(obj) {
    return Object.prototype.toString.call(obj) === '[object Array]';
}

function setLayerKeyframe(args) {
    try {
        logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: setLayerKeyframe 函数开始执行");
        
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
        
        // 仅在DEBUG级别显示详细参数信息
        logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 原始参数 - compName='" + params.compName + "', layerIndex=" + params.layerIndex + ", propertyName='" + params.propertyName + "', timeInSeconds=" + params.timeInSeconds + ", value=" + (isArray(params.value) ? "[" + params.value.join(",") + "]" : params.value) + " (type: " + (isArray(params.value) ? "array" : typeof params.value) + ")");
        
        if (isArray(params.value)) {
            logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 检测到数组参数，长度: " + params.value.length + ", 内容: [" + params.value.join(",") + "]");
        }
        
        logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 开始参数验证...");
        
        // 验证参数类型
        if (typeof params.compName !== "string") {
            return JSON.stringify({ success: false, message: "compName must be a string" });
        }
        if (typeof params.layerIndex !== "number" || params.layerIndex < 1) {
            return JSON.stringify({ success: false, message: "layerIndex must be a positive integer" });
        }
        if (typeof params.propertyName !== "string" || params.propertyName.length === 0) {
            return JSON.stringify({ success: false, message: "propertyName must be a non-empty string" });
        }
        if (typeof params.timeInSeconds !== "number" || params.timeInSeconds < 0) {
            return JSON.stringify({ success: false, message: "timeInSeconds must be a non-negative number" });
        }
        if (params.value === undefined || params.value === null) {
            return JSON.stringify({ success: false, message: "value is required" });
        }
        
        logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: validateParameters调用完成");
        logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 参数验证成功");
        
        // 移除冗长的参数调试信息，仅在DEBUG模式下简化显示
        logWithLevel(LOG_LEVEL.DEBUG, "参数: " + params.propertyName + " @ " + params.timeInSeconds + "s = " + (isArray(params.value) ? "[" + params.value.join(",") + "]" : params.value));
        
        // Find the composition using utility function
        var compResult = getCompositionByName(params.compName);
        if (compResult.error) {
            return JSON.stringify({ success: false, message: compResult.error });
        }
        var comp = compResult.composition;
        
        if (!comp || !(comp instanceof CompItem)) {
            return JSON.stringify({ 
                success: false, 
                message: "合成验证失败: 无效的合成对象 (compName='" + params.compName + "')" 
            });
        }
        
        if (comp.numLayers === 0) {
            return JSON.stringify({ 
                success: false, 
                message: "Composition '" + comp.name + "' has no layers. Please create layers first." 
            });
        }
        
        // 检查图层索引是否有效
        if (params.layerIndex < 1 || params.layerIndex > comp.numLayers) {
            return JSON.stringify({ 
                success: false, 
                message: "Layer index " + params.layerIndex + " is out of range. Composition '" + comp.name + "' has " + comp.numLayers + " layers (valid range: 1-" + comp.numLayers + ")" 
            });
        }
        
        var layer = comp.layers[params.layerIndex];
        if (!layer) {
            return JSON.stringify({ success: false, message: "Layer not found at index " + params.layerIndex + " in composition '" + comp.name + "'"});
        }

        var transformGroup = layer.property("Transform");
        if (!transformGroup) {
             return JSON.stringify({ success: false, message: "Transform properties not found for layer '" + layer.name + "' (type: " + layer.matchName + ")." });
        }

        logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 查找属性 '" + params.propertyName + "'...");
        
        var property = null;
        
        // 首先尝试在Transform组中查找
        property = transformGroup.property(params.propertyName);
        logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 在Transform组中查找结果: " + (property ? "找到" : "未找到"));
        
        // 如果在Transform组中没有找到，尝试直接在图层上查找
        if (!property) {
            property = layer.property(params.propertyName);
            logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 在图层直接属性中查找结果: " + (property ? "找到" : "未找到"));
        }
        
        // 如果还是没有找到，尝试在Effects或Text组中查找
        if (!property) {
             if (layer.property("Effects") && layer.property("Effects").property(params.propertyName)) {
                 property = layer.property("Effects").property(params.propertyName);
                 logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 在Effects组中找到属性");
             } else if (layer.property("Text") && layer.property("Text").property(params.propertyName)) {
                 property = layer.property("Text").property(params.propertyName);
                 logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 在Text组中找到属性");
            }
        }

        if (!property) {
             logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 属性 '" + params.propertyName + "' 在所有位置都未找到");
             return JSON.stringify({ success: false, message: "Property '" + params.propertyName + "' not found on layer '" + layer.name + "'." });
        }
        
        logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: 属性找到，检查是否可以设置关键帧...");

        if (!property.canVaryOverTime) {
             return JSON.stringify({ success: false, message: "Property '" + params.propertyName + "' cannot be keyframed." });
        }

        // 获取属性维度信息（用于验证值的格式）
        var propertyDimensions = 1; // 默认单维
        try {
            if (property.value && isArray(property.value)) {
                propertyDimensions = property.value.length;
            }
        } catch (e) {
            // 如果无法获取当前值，使用默认维度
        }
        
        // 简化关键帧设置信息，仅在DEBUG级别显示
        logWithLevel(LOG_LEVEL.DEBUG, "设置关键帧: " + params.propertyName + " @ " + params.timeInSeconds + "s = " + (isArray(params.value) ? "[" + params.value.join(",") + "]" : params.value) + " (维度: " + (propertyDimensions > 1 ? propertyDimensions : "1") + ")");

        // 处理特殊属性值转换
        var finalValue = params.value;
        if (params.propertyName === "Opacity") {
            // 透明度需要从百分比转换为0-1范围
            if (typeof params.value === "number") {
                finalValue = params.value / 100.0;
                logWithLevel(LOG_LEVEL.DEBUG, "DEBUG: Opacity值转换 - 原值: " + params.value + ", 转换后: " + finalValue);
            }
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
                value: params.value, // 返回原始值
                propertyDimensions: propertyDimensions
            }
        });
    } catch (e) {
        return JSON.stringify({ 
            success: false, 
            message: "Error setting keyframe: " + e.toString() + (e.line ? " (Line: " + e.line + ")" : "")
        });
    }
}

// 一键测试所有情况的函数
function testAllKeyframes() {
    var results = [];
    
    try {
        // 测试1: 透明度
        results.push("=== 测试透明度关键帧 ===");
        var result1 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Opacity",
            timeInSeconds: 1.0,
            value: 50
        });
        results.push("结果: " + result1);
        
        // 测试2: 缩放（正确的3维数组格式）
        results.push("\n=== 测试缩放关键帧（正确格式）===");
        var result2 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Scale",
            timeInSeconds: 2.0,
            value: [120, 120, 100]
        });
        results.push("结果: " + result2);
        
        // 测试3: 位置（正确的3维数组格式）
        results.push("\n=== 测试位置关键帧 ===");
        var result3 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Position",
            timeInSeconds: 3.0,
            value: [960, 540, 0]
        });
        results.push("结果: " + result3);
        
        // 测试4: 错误情况 - Scale使用单个数字
        results.push("\n=== 测试缩放关键帧（错误格式）===");
        var result4 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Scale",
            timeInSeconds: 4.0,
            value: 100
        });
        results.push("结果: " + result4);
        
        // 测试5: 旋转测试
        results.push("\n=== 测试旋转关键帧 ===");
        var result5 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Rotation",
            timeInSeconds: 5.0,
            value: 45
        });
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
        
        // 测试用例1: 设置透明度关键帧 - 修复：使用对象参数
        testCount++;
        logAlert("测试透明度关键帧设置...");
        var result1 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Opacity",
            timeInSeconds: 1.0,
            value: 100
        });
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
        
        // 测试用例2: 设置位置关键帧 - 修复：使用对象参数和3维数组
        testCount++;
        logAlert("测试位置关键帧设置...");
        var result2 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Position",
            timeInSeconds: 2.0,
            value: [960, 540, 0]
        });
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
        
        // 测试用例3: 设置缩放关键帧 - 修复：使用对象参数和3维数组
        testCount++;
        logAlert("测试缩放关键帧设置...");
        var result3 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Scale",
            timeInSeconds: 3.0,
            value: [150, 150, 100]
        });
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
        
        // 测试用例4: 设置旋转关键帧 - 修复：使用对象参数
        testCount++;
        logAlert("测试旋转关键帧设置...");
        var result4 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Rotation",
            timeInSeconds: 2.5,
            value: 45.0
        });
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
        
        // 测试用例5: 设置锚点关键帧 - 修复：使用对象参数和3维数组
        testCount++;
        logAlert("测试锚点关键帧设置...");
        var result5 = setLayerKeyframe({
            compName: "",
            layerIndex: 1,
            propertyName: "Anchor Point",
            timeInSeconds: 1.5,
            value: [100, 100, 0]
        });
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