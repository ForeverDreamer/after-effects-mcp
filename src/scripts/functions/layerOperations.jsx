// layerOperations.jsx
// 统一的图层操作模块，提取所有图层创建和操作的公共逻辑

//@include "utils.jsx"
//@include "effectsCore.jsx"

// ========== 通用图层创建函数 ==========
function createLayer(layerType, compName, layerParams, operationName) {
    return performCreateOperation(compName, function(comp) {
        var layer;
        var layerName = layerParams.name || (layerType + " Layer");
        
        // 根据图层类型创建图层
        switch (layerType) {
            case "solid":
                layer = comp.layers.addSolid(
                    layerParams.color || [1, 0, 0],
                    layerName,
                    layerParams.width || comp.width,
                    layerParams.height || comp.height,
                    layerParams.pixelAspect || 1.0
                );
                break;
                
            case "text":
                layer = comp.layers.addText(layerParams.text || "Sample Text");
                layer.name = layerName;
                
                // 设置文本属性
                if (layerParams.fontSize || layerParams.fontFamily || layerParams.fillColor) {
                    var textDocument = layer.property("Source Text").value;
                    if (layerParams.fontSize) textDocument.fontSize = layerParams.fontSize;
                    if (layerParams.fontFamily) textDocument.font = layerParams.fontFamily;
                    if (layerParams.fillColor) textDocument.fillColor = layerParams.fillColor;
                    layer.property("Source Text").setValue(textDocument);
                }
                break;
                
            case "shape":
                layer = comp.layers.addShape();
                layer.name = layerName;
                
                // 创建形状内容
                if (layerParams.shapeType) {
                    createShapeContent(layer, layerParams);
                }
                break;
                
            default:
                throw new Error("Unsupported layer type: " + layerType);
        }
        
        // 应用通用图层属性
        applyCommonLayerProperties(layer, layerParams);
        
        return createStandardResponse("success", layerType + " layer created successfully", {
            layer: {
                name: layer.name,
                index: layer.index,
                type: layerType
            },
            composition: {
                name: comp.name
            }
        });
    }, operationName || ("Create " + layerType + " Layer"));
}

// ========== 形状内容创建函数 ==========
function createShapeContent(layer, params) {
    var contents = layer.property("Contents");
    var shapeGroup = contents.addProperty("ADBE Vector Group");
    var groupContents = shapeGroup.property("Contents");
    
    var shapePathProperty;
    switch (params.shapeType) {
        case "rectangle":
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Rect");
            if (params.size && shapePathProperty.property("Size")) {
                shapePathProperty.property("Size").setValue(params.size);
            }
            break;
            
        case "ellipse":
            shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Ellipse");
            if (params.size && shapePathProperty.property("Size")) {
                shapePathProperty.property("Size").setValue(params.size);
            }
            break;
            
        case "polygon":
        case "star":
            try {
                shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Star");
                // 简化星形/多边形设置
                if (params.points || params.size) {
                    // 基本设置，避免复杂的属性链操作
                }
            } catch (e) {
                // 如果星形创建失败，回退到椭圆
                shapePathProperty = groupContents.addProperty("ADBE Vector Shape - Ellipse");
            }
            break;
    }
    
    // 添加填充和描边
    if (params.fillColor) {
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        if (fill && fill.property("Color")) {
            fill.property("Color").setValue(params.fillColor);
        }
    }
    
    if (params.strokeColor && params.strokeWidth > 0) {
        var stroke = groupContents.addProperty("ADBE Vector Graphic - Stroke");
        if (stroke) {
            if (stroke.property("Color")) {
                stroke.property("Color").setValue(params.strokeColor);
            }
            if (stroke.property("Stroke Width")) {
                stroke.property("Stroke Width").setValue(params.strokeWidth);
            }
        }
    }
}

// ========== 通用图层属性应用函数 ==========
function applyCommonLayerProperties(layer, params) {
    // 设置位置
    if (params.position) {
        layer.property("Transform").property("Position").setValue(params.position);
    }
    
    // 设置时间属性
    if (params.startTime !== undefined) {
        layer.startTime = params.startTime;
    }
    
    if (params.duration !== undefined && params.duration > 0) {
        layer.outPoint = layer.startTime + params.duration;
    }
    
    // 设置其他变换属性
    if (params.scale) {
        layer.property("Transform").property("Scale").setValue(params.scale);
    }
    
    if (params.rotation !== undefined) {
        layer.property("Transform").property("Rotation").setValue(params.rotation);
    }
    
    if (params.opacity !== undefined) {
        layer.property("Transform").property("Opacity").setValue(params.opacity);
    }
    
    if (params.anchorPoint) {
        layer.property("Transform").property("Anchor Point").setValue(params.anchorPoint);
    }
}

// ========== 图层属性设置函数 ==========
function setLayerProperty(layer, propertyPath, value) {
    try {
        var property = layer.property(propertyPath);
        if (!property) {
            throw new Error("Property not found: " + propertyPath);
        }
        
        if (property.canSetValue) {
            property.setValue(value);
            return { success: true, property: propertyPath, value: value };
        } else {
            throw new Error("Property cannot be set: " + propertyPath);
        }
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}

// ========== 图层关键帧设置函数 ==========
function setLayerKeyframeInternal(layer, propertyPath, time, value, interpolationType) {
    try {
        var property = layer.property(propertyPath);
        if (!property) {
            throw new Error("Property not found: " + propertyPath);
        }
        
        if (!property.canVaryOverTime) {
            throw new Error("Property cannot be keyframed: " + propertyPath);
        }
        
        var keyIndex = property.addKey(time);
        property.setValueAtKey(keyIndex, value);
        
        // 设置插值类型
        if (interpolationType) {
            switch (interpolationType.toLowerCase()) {
                case "linear":
                    property.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.LINEAR);
                    break;
                case "bezier":
                    property.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.BEZIER);
                    break;
                case "hold":
                    property.setInterpolationTypeAtKey(keyIndex, KeyframeInterpolationType.HOLD);
                    break;
            }
        }
        
        return {
            success: true,
            keyframe: {
                index: keyIndex,
                time: time,
                value: value,
                property: propertyPath
            }
        };
    } catch (error) {
        return { success: false, error: error.toString() };
    }
}

// ========== 图层表达式设置函数 ==========
function setLayerExpression(layer, propertyPath, expression) {
    try {
        var property = layer.property(propertyPath);
        if (!property) {
            throw new Error("Property not found: " + propertyPath);
        }
        
        if (!property.canSetExpression) {
            throw new Error("Property does not support expressions: " + propertyPath);
        }
        
        property.expression = expression;
        
        return {
            success: true,
            expression: {
                property: propertyPath,
                expression: expression
            }
        };
    } catch (error) {
        return { success: false, error: error.toString() };
    }
} 