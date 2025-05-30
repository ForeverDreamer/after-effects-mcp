// setLayerProperties.jsx
// Sets properties of a specified layer in a composition (enhanced version with text support)

//@include "utils.jsx"

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
            default: ""
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
        if (params.layerIndex !== undefined && params.layerIndex !== null) {
            if (params.layerIndex > 0 && params.layerIndex <= comp.numLayers) { 
                layer = comp.layer(params.layerIndex); 
            } else { 
                return JSON.stringify({
                    status: "error",
                    message: "Layer index out of bounds: " + params.layerIndex
                }, null, 2);
            }
        } else if (params.layerName) {
            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layer(j).name === params.layerName) { 
                    layer = comp.layer(j); 
                    break; 
                }
            }
        }
        
        if (!layer) { 
            return JSON.stringify({
                status: "error",
                message: "Layer not found: " + (params.layerName || "index " + params.layerIndex)
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