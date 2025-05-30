// createTextLayer.jsx
// Creates a new text layer in the specified composition

//@include "utils.jsx"

// ========== 参数验证Schema ==========
var CREATE_TEXT_LAYER_SCHEMA = {
    name: "createTextLayer",
    description: "在指定合成中创建文本图层",
    category: "creation",
    required: ["text"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        text: {
            type: "string",
            description: "文本内容",
            example: "Hello World",
            minLength: 1,
            maxLength: 1000
        },
        position: {
            type: "array",
            description: "文本位置 [x, y]",
            example: [960, 540],
            "default": [960, 540]
        },
        fontSize: {
            type: "number",
            description: "字体大小（像素）",
            example: 72,
            "default": 72,
            min: 1,
            max: 500
        },
        color: {
            type: "array",
            description: "文本颜色 [r, g, b] (0-1范围)",
            example: [1, 1, 1],
            "default": [1, 1, 1]
        },
        startTime: {
            type: "number",
            description: "开始时间（秒）",
            example: 0,
            "default": 0,
            min: 0
        },
        duration: {
            type: "number",
            description: "持续时间（秒，0表示到合成结束）",
            example: 5,
            "default": 5,
            min: 0
        },
        fontFamily: {
            type: "string",
            description: "字体名称",
            example: "Arial",
            "default": "Arial"
        },
        alignment: {
            type: "string",
            description: "文本对齐方式",
            example: "center",
            "default": "center",
            "enum": ["left", "center", "right"]
        }
    },
    examples: [
        {
            name: "简单文本图层",
            args: {
                text: "Hello World",
                compName: "Main Comp"
            }
        },
        {
            name: "自定义格式文本",
            args: {
                text: "Custom Text",
                compName: "Text Comp",
                position: [100, 200],
                fontSize: 48,
                color: [1, 0, 0],
                fontFamily: "Helvetica",
                alignment: "left"
            }
        }
    ]
};

function createTextLayer(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, CREATE_TEXT_LAYER_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: CREATE_TEXT_LAYER_SCHEMA
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
        
        // Create the text layer
        var textLayer = comp.layers.addText(params.text);
        
        // Get text properties
        var textProp = textLayer.property("ADBE Text Properties").property("ADBE Text Document");
        var textDocument = textProp.value;
        
        // Set font size and color
        textDocument.fontSize = params.fontSize;
        textDocument.fillColor = params.color;
        textDocument.font = params.fontFamily;
        
        // Set text alignment
        if (params.alignment === "left") {
            textDocument.justification = ParagraphJustification.LEFT_JUSTIFY;
        } else if (params.alignment === "center") {
            textDocument.justification = ParagraphJustification.CENTER_JUSTIFY;
        } else if (params.alignment === "right") {
            textDocument.justification = ParagraphJustification.RIGHT_JUSTIFY;
        }
        
        // Update the text property
        textProp.setValue(textDocument);
        
        // Set position
        textLayer.property("Position").setValue(params.position);
        
        // Set timing
        textLayer.startTime = params.startTime;
        if (params.duration > 0) {
            textLayer.outPoint = params.startTime + params.duration;
        }
        
        // Return success with layer details
        return JSON.stringify({
            status: "success",
            message: "Text layer created successfully",
            layer: {
                name: textLayer.name,
                index: textLayer.index,
                type: "text",
                inPoint: textLayer.inPoint,
                outPoint: textLayer.outPoint,
                position: textLayer.property("Position").value
            }
        }, null, 2);
    } catch (error) {
        // Return error message
        return JSON.stringify({
            status: "error",
            message: error.toString()
        }, null, 2);
    }
} 