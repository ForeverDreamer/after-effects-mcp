// createShapeLayer.jsx
// Creates a new shape layer in the specified composition

// Import utility functions
//@include "utils.jsx"

// ========== 参数验证Schema ==========
var CREATE_SHAPE_LAYER_SCHEMA = {
    name: "createShapeLayer",
    description: "在指定合成中创建形状图层",
    category: "creation",
    required: ["shape"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        shape: {
            type: "string",
            description: "形状类型",
            example: "rectangle",
            "enum": ["rectangle", "ellipse", "polygon", "star"]
        },
        position: {
            type: "array",
            description: "形状位置 [x, y]",
            example: [960, 540],
            "default": [960, 540]
        },
        size: {
            type: "array",
            description: "形状大小 [width, height]",
            example: [200, 200],
            "default": [200, 200]
        },
        fillColor: {
            type: "array",
            description: "填充颜色 [r, g, b] (0-1范围)",
            example: [1, 0, 0],
            "default": [1, 0, 0]
        },
        strokeColor: {
            type: "array",
            description: "描边颜色 [r, g, b] (0-1范围)",
            example: [0, 0, 0],
            "default": [0, 0, 0]
        },
        strokeWidth: {
            type: "number",
            description: "描边宽度（像素）",
            example: 2,
            "default": 0,
            min: 0,
            max: 100
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
        layerName: {
            type: "string",
            description: "图层名称",
            example: "My Shape",
            "default": "Shape Layer",
            maxLength: 255
        },
        cornerRadius: {
            type: "number",
            description: "圆角半径（仅适用于矩形）",
            example: 10,
            "default": 5,
            min: 0,
            max: 1000
        }
    },
    examples: [
        {
            name: "创建矩形形状",
            args: {
                compName: "Main Comp",
                shape: "rectangle",
                size: [300, 200],
                fillColor: [0, 1, 0],
                layerName: "Green Rectangle"
            }
        },
        {
            name: "创建带描边的圆形",
            args: {
                compName: "Shape Comp",
                shape: "ellipse",
                size: [150, 150],
                fillColor: [1, 1, 0],
                strokeColor: [0, 0, 1],
                strokeWidth: 5
            }
        },
        {
            name: "创建六边形",
            args: {
                compName: "Polygon Comp",
                shape: "polygon",
                size: [180, 180],
                fillColor: [1, 0, 1]
            }
        }
    ]
};

function createShapeLayer(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, CREATE_SHAPE_LAYER_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: CREATE_SHAPE_LAYER_SCHEMA
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
        
        // Create a shape layer
        var shapeLayer = comp.layers.addShape();
        shapeLayer.name = params.layerName;
        
        // Get the root content property group
        var contents = shapeLayer.property("Contents");
        
        // Add a shape group (e.g., "Group 1")
        var shapeGroup = contents.addProperty("ADBE Vector Group");
        // Get the Contents property group WITHIN the new shape group
        var groupContents = shapeGroup.property("Contents");
        
        // Add the appropriate shape path based on type TO THE GROUP'S CONTENTS
        var shapePathProperty;
        if (params.shape === "rectangle") {
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Rect");
            var rectSizeProp = shapePathProperty.property("Size");
            rectSizeProp.setValue(params.size);
        } else if (params.shape === "ellipse") {
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Ellipse");
            var ellipseSizeProp = shapePathProperty.property("Size");
            ellipseSizeProp.setValue(params.size);
        } else if (params.shape === "polygon" || params.shape === "star") {
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Star");
            shapePathProperty.property("Type").setValue(params.shape === "polygon" ? 1 : 2);
            shapePathProperty.property("Points").setValue(params.points);
            shapePathProperty.property("Outer Radius").setValue(params.size[0] / 2);
            if (params.shape === "star") {
                shapePathProperty.property("Inner Radius").setValue(params.size[0] / 3);
            }
        }
        
        // Add fill TO THE GROUP'S CONTENTS
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        fill.property("Color").setValue(params.fillColor);
        fill.property("Opacity").setValue(100);
        
        // Add stroke TO THE GROUP'S CONTENTS if width > 0
        if (params.strokeWidth > 0) {
            var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
            stroke.property("Color").setValue(params.strokeColor);
            stroke.property("Stroke Width").setValue(params.strokeWidth);
            stroke.property("Opacity").setValue(100);
        }
        
        // Set layer's main transform properties
        shapeLayer.property("Position").setValue(params.position);
        
        // Set timing
        shapeLayer.startTime = params.startTime;
        if (params.duration > 0) {
            shapeLayer.outPoint = params.startTime + params.duration;
        }
        
        // Return success with layer details
        return JSON.stringify({
            status: "success",
            message: "Shape layer created successfully",
            layer: {
                name: shapeLayer.name,
                index: shapeLayer.index,
                type: "shape",
                shapeType: params.shape,
                inPoint: shapeLayer.inPoint,
                outPoint: shapeLayer.outPoint,
                position: shapeLayer.property("Position").value
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