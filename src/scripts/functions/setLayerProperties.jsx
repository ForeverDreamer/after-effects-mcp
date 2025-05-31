// setLayerProperties.jsx
// Sets properties of a specified layer in a composition (enhanced version with text support)

//@include "utils.jsx"
//@include "layerOperations.jsx"

// ========== 参数验证Schema ==========
var SET_LAYER_PROPERTIES_SCHEMA = {
    name: "setLayerProperties",
    description: "设置指定图层的属性（支持文本图层）",
    category: "modification",
    required: ["compName"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        layerName: {
            type: "string",
            description: "图层名称（与layerIndex二选一）",
            example: "Text Layer 1"
        },
        layerIndex: {
            type: "integer",
            description: "图层索引（1开始，与layerName二选一）",
            example: 1,
            min: 1,
            max: 1000
        },
        position: {
            type: "array",
            description: "图层位置 [x, y] 或 [x, y, z]",
            example: [960, 540]
        },
        scale: {
            type: "array",
            description: "图层缩放 [x, y] 或 [x, y, z] (百分比)",
            example: [100, 100]
        },
        rotation: {
            type: "number",
            description: "图层旋转角度（度）",
            example: 45
        },
        opacity: {
            type: "number",
            description: "图层透明度（0-100）",
            example: 75,
            min: 0,
            max: 100
        },
        startTime: {
            type: "number",
            description: "开始时间（秒）",
            example: 1.0,
            min: 0
        },
        duration: {
            type: "number",
            description: "持续时间（秒）",
            example: 5.0,
            min: 0
        },
        text: {
            type: "string",
            description: "文本内容（仅文本图层）",
            example: "Hello World"
        },
        fontFamily: {
            type: "string",
            description: "字体名称（仅文本图层）",
            example: "Arial"
        },
        fontSize: {
            type: "number",
            description: "字体大小（仅文本图层）",
            example: 72,
            min: 1,
            max: 500
        },
        fillColor: {
            type: "array",
            description: "文本颜色 [r, g, b] (0-1范围，仅文本图层)",
            example: [1, 0, 0]
        }
    },
    validation: "layerName或layerIndex必须提供其中一个",
    examples: [
        {
            name: "设置图层基本属性",
            args: {
                compName: "Main Comp",
                layerIndex: 1,
                position: [500, 300],
                scale: [150, 150],
                opacity: 80
            }
        },
        {
            name: "修改文本图层内容",
            args: {
                compName: "Text Comp",
                layerName: "Title",
                text: "New Title",
                fontSize: 48,
                fillColor: [0, 1, 0]
            }
        }
    ]
};

function setLayerProperties(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, SET_LAYER_PROPERTIES_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: SET_LAYER_PROPERTIES_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        // 验证图层标识参数
        if (!params.layerName && !params.layerIndex) {
            return JSON.stringify({
                status: "error",
                message: "Must specify either layerName or layerIndex"
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
        
        // Find the layer
        var layer = null;
        var layerSearchInfo = "";
        
        if (params.layerIndex !== undefined && params.layerIndex !== null) {
            if (params.layerIndex > 0 && params.layerIndex <= comp.numLayers) { 
                layer = comp.layer(params.layerIndex); 
                layerSearchInfo = "by index " + params.layerIndex;
            } else { 
                return JSON.stringify({
                    status: "error",
                    message: "Layer index out of bounds: " + params.layerIndex + " (composition has " + comp.numLayers + " layers)"
                }, null, 2);
            }
        } else if (params.layerName) {
            // 改进的图层名称搜索逻辑  
            layerSearchInfo = "by name '" + params.layerName + "'";
            for (var j = 1; j <= comp.numLayers; j++) {
                var currentLayer = comp.layer(j);
                if (currentLayer.name === params.layerName) { 
                    layer = currentLayer; 
                    break; 
                }
            }
            
            // 如果未找到，提供更详细的调试信息和建议
            if (!layer) {
                var availableLayerNames = [];
                var closeMatches = [];
                
                // 收集所有可用图层名称，并检查相似名称
                for (var k = 1; k <= comp.numLayers; k++) {
                    var layerName = comp.layer(k).name;
                    availableLayerNames.push("'" + layerName + "'");
                    
                    // 检查是否包含搜索字符串
                    if (layerName.toLowerCase().indexOf(params.layerName.toLowerCase()) !== -1) {
                        closeMatches.push("'" + layerName + "'");
                    }
                }
                
                var errorMessage = "Layer not found: '" + params.layerName + "'";
                var errorDetails = {
                    status: "error",
                    message: errorMessage,
                    searchedName: params.layerName,
                    totalLayers: comp.numLayers,
                    compositionName: comp.name,
                    availableLayers: availableLayerNames
                };
                
                // 如果有相似的名称，添加建议
                if (closeMatches.length > 0) {
                    errorDetails.suggestions = closeMatches;
                    errorDetails.message += ". Did you mean: " + closeMatches.join(", ") + "?";
                } else {
                    errorDetails.message += ". Available layers: " + availableLayerNames.join(", ");
                }
                
                return JSON.stringify(errorDetails, null, 2);
            }
        }
        
        if (!layer) { 
            return JSON.stringify({
                status: "error",
                message: "Layer not found " + layerSearchInfo + " in composition '" + comp.name + "'"
            }, null, 2);
        }
        
        var changedProperties = [];
        var textDocument = null;

        // --- Text Property Handling ---
        if (layer instanceof TextLayer && (params.text !== undefined || params.fontFamily !== undefined || params.fontSize !== undefined || params.fillColor !== undefined)) {
            var sourceTextProp = layer.property("Source Text");
            if (sourceTextProp && sourceTextProp.value) {
                var currentTextDocument = sourceTextProp.value;
                var updated = false;

                if (params.text !== undefined && params.text !== null && currentTextDocument.text !== params.text) {
                    currentTextDocument.text = params.text;
                    changedProperties.push("text");
                    updated = true;
                }
                if (params.fontFamily !== undefined && params.fontFamily !== null && currentTextDocument.font !== params.fontFamily) {
                    currentTextDocument.font = params.fontFamily;
                    changedProperties.push("fontFamily");
                    updated = true;
                }
                if (params.fontSize !== undefined && params.fontSize !== null && currentTextDocument.fontSize !== params.fontSize) {
                    currentTextDocument.fontSize = params.fontSize;
                    changedProperties.push("fontSize");
                    updated = true;
                }
                if (params.fillColor !== undefined && params.fillColor !== null && 
                    (currentTextDocument.fillColor[0] !== params.fillColor[0] || 
                     currentTextDocument.fillColor[1] !== params.fillColor[1] || 
                     currentTextDocument.fillColor[2] !== params.fillColor[2])) {
                    currentTextDocument.fillColor = params.fillColor;
                    changedProperties.push("fillColor");
                    updated = true;
                }

                if (updated) {
                    sourceTextProp.setValue(currentTextDocument);
                }
                textDocument = currentTextDocument; 
            }
        }

        // --- General Property Handling ---
        if (params.position !== undefined && params.position !== null) { 
            layer.property("Position").setValue(params.position); 
            changedProperties.push("position"); 
        }
        if (params.scale !== undefined && params.scale !== null) { 
            layer.property("Scale").setValue(params.scale); 
            changedProperties.push("scale"); 
        }
        if (params.rotation !== undefined && params.rotation !== null) {
            if (layer.threeDLayer) { 
                layer.property("Z Rotation").setValue(params.rotation);
            } else { 
                layer.property("Rotation").setValue(params.rotation); 
            }
            changedProperties.push("rotation");
        }
        if (params.opacity !== undefined && params.opacity !== null) { 
            layer.property("Opacity").setValue(params.opacity); 
            changedProperties.push("opacity"); 
        }
        if (params.startTime !== undefined && params.startTime !== null) { 
            layer.startTime = params.startTime; 
            changedProperties.push("startTime"); 
        }
        if (params.duration !== undefined && params.duration !== null && params.duration > 0) {
            var actualStartTime = (params.startTime !== undefined && params.startTime !== null) ? params.startTime : layer.startTime;
            layer.outPoint = actualStartTime + params.duration;
            changedProperties.push("duration");
        }

        // Return success with updated layer details
        var returnLayerInfo = {
            name: layer.name,
            index: layer.index,
            position: layer.property("Position").value,
            scale: layer.property("Scale").value,
            rotation: layer.threeDLayer ? layer.property("Z Rotation").value : layer.property("Rotation").value,
            opacity: layer.property("Opacity").value,
            inPoint: layer.inPoint,
            outPoint: layer.outPoint,
            changedProperties: changedProperties
        };
        
        // Add text properties to the return object if it was a text layer
        if (layer instanceof TextLayer && textDocument) {
            returnLayerInfo.text = textDocument.text;
            returnLayerInfo.fontFamily = textDocument.font;
            returnLayerInfo.fontSize = textDocument.fontSize;
            returnLayerInfo.fillColor = textDocument.fillColor;
        }

        return JSON.stringify({
            status: "success", 
            message: "Layer properties updated successfully",
            layer: returnLayerInfo
        }, null, 2);
    } catch (error) {
        return JSON.stringify({ 
            status: "error", 
            message: error.toString() 
        }, null, 2);
    }
}

// ========== 测试函数 ==========
function testSetLayerProperties() {
    try {
        logAlert("开始测试 setLayerProperties 函数...");
        
        // 测试用例1: 设置图层位置和缩放
        var testArgs1 = {
            compName: "",  // 使用当前活动合成
            layerIndex: 1,
            position: [500, 300],
            scale: [150, 150],
            opacity: 80
        };
        
        logAlert("测试图层位置和缩放设置...");
        var result1 = setLayerProperties(testArgs1);
        logAlert("位置缩放测试结果:\n" + result1);
        
        // 测试用例2: 设置图层旋转和时间
        var testArgs2 = {
            compName: "",
            layerIndex: 1,
            rotation: 45,
            startTime: 2.0,
            duration: 8.0
        };
        
        logAlert("测试图层旋转和时间设置...");
        var result2 = setLayerProperties(testArgs2);
        logAlert("旋转时间测试结果:\n" + result2);
        
        // 测试用例3: 修改文本图层内容（如果第一个图层是文本）
        var testArgs3 = {
            compName: "",
            layerIndex: 1,
            text: "Modified Text",
            fontSize: 48,
            fillColor: [0, 1, 0]  // 绿色
        };
        
        logAlert("测试文本图层属性修改...");
        var result3 = setLayerProperties(testArgs3);
        logAlert("文本修改测试结果:\n" + result3);
        
        // 测试用例4: 通过图层名称设置属性
        var testArgs4 = {
            compName: "",
            layerName: "Test Layer",  // 假设存在此名称的图层
            position: [960, 540],
            opacity: 50
        };
        
        logAlert("测试通过图层名称设置属性...");
        var result4 = setLayerProperties(testArgs4);
        logAlert("图层名称测试结果:\n" + result4);
        
        logAlert("setLayerProperties 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testSetLayerProperties(); 