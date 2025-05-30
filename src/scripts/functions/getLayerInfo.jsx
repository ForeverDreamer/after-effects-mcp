// getLayerInfo.jsx
// Gets information about layers in the specified composition

//@include "utils.jsx"

// ========== 参数验证Schema ==========
var GET_LAYER_INFO_SCHEMA = {
    name: "getLayerInfo",
    description: "获取指定合成中的图层信息",
    category: "project",
    required: [],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        includeProperties: {
            type: "boolean",
            description: "是否包含图层属性详情",
            example: true,
            "default": true
        },
        includeEffects: {
            type: "boolean",
            description: "是否包含特效信息",
            example: false,
            "default": false
        },
        layerIndices: {
            type: "array",
            description: "指定图层索引数组（空数组获取所有图层）",
            example: [1, 2, 3],
            "default": []
        }
    },
    examples: [
        {
            name: "获取活动合成图层基本信息",
            args: {
                compName: "",
                includeProperties: false
            }
        },
        {
            name: "获取指定合成详细图层信息",
            args: {
                compName: "Main Comp",
                includeProperties: true,
                includeEffects: true
            }
        },
        {
            name: "筛选文本图层",
            args: {
                compName: "Text Comp",
                layerIndices: [1, 2]
            }
        }
    ]
};

function getLayerInfo(args) {
    try {
        // 参数验证
        args = args || {};
        var validation = validateParameters(args, GET_LAYER_INFO_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: GET_LAYER_INFO_SCHEMA
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
        
        var result = {
            status: "success",
            composition: {
                name: comp.name,
                width: comp.width,
                height: comp.height,
                duration: comp.duration,
                frameRate: comp.frameRate,
                numLayers: comp.numLayers
            },
            layers: []
        };
        
        // Helper function to get layer type
        function getLayerType(layer) {
            if (layer instanceof TextLayer) return "text";
            if (layer instanceof ShapeLayer) return "shape";
            if (layer instanceof CameraLayer) return "camera";
            if (layer instanceof LightLayer) return "light";
            if (layer instanceof AVLayer) {
                if (layer.source instanceof SolidSource) return "solid";
                if (layer.adjustmentLayer) return "adjustment";
                return "footage";
            }
            return "unknown";
        }
        
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);
            var layerType = getLayerType(layer);
            
            // Filter by layer types if specified
            if (params.layerIndices.length > 0 && params.layerIndices.indexOf(i) === -1) {
                continue;
            }
            
            var layerInfo = {
                index: layer.index,
                name: layer.name,
                type: layerType,
                enabled: layer.enabled,
                locked: layer.locked,
                solo: layer.solo,
                shy: layer.shy,
                inPoint: layer.inPoint,
                outPoint: layer.outPoint,
                startTime: layer.startTime
            };
            
            // Add detailed information if requested
            if (params.includeProperties) {
                layerInfo.details = {
                    hasVideo: layer.hasVideo,
                    hasAudio: layer.hasAudio,
                    active: layer.active,
                    selected: layer.selected,
                    motionBlur: layer.motionBlur,
                    threeDLayer: layer.threeDLayer,
                    effectsActive: layer.effectsActive,
                    quality: layer.quality,
                    samplingQuality: layer.samplingQuality
                };
                
                // Add source information for footage layers
                if (layer instanceof AVLayer && layer.source) {
                    layerInfo.details.source = {
                        name: layer.source.name,
                        width: layer.source.width || 0,
                        height: layer.source.height || 0,
                        duration: layer.source.duration || 0
                    };
                }
                
                // Add text-specific information
                if (layer instanceof TextLayer) {
                    try {
                        var textDoc = layer.property("Source Text").value;
                        layerInfo.details.text = {
                            content: textDoc.text,
                            fontSize: textDoc.fontSize,
                            font: textDoc.font
                        };
                    } catch (e) {
                        // Text properties might not be accessible
                        layerInfo.details.text = { content: "Unable to read text properties" };
                    }
                }
                
                // Add effects information
                var effects = layer.property("Effects");
                if (effects && effects.numProperties > 0) {
                    layerInfo.details.effects = [];
                    for (var j = 1; j <= effects.numProperties; j++) {
                        var effect = effects.property(j);
                        layerInfo.details.effects.push({
                            name: effect.name,
                            matchName: effect.matchName,
                            enabled: effect.enabled
                        });
                    }
                }
            }
            
            // Add transform properties if requested
            if (params.includeEffects) {
                try {
                    var transform = layer.property("Transform");
                    layerInfo.transform = {
                        position: transform.property("Position").value,
                        scale: transform.property("Scale").value,
                        rotation: layer.threeDLayer ? 
                            transform.property("Z Rotation").value : 
                            transform.property("Rotation").value,
                        opacity: transform.property("Opacity").value,
                        anchorPoint: transform.property("Anchor Point").value
                    };
                } catch (e) {
                    layerInfo.transform = { error: "Unable to read transform properties" };
                }
            }
            
            result.layers.push(layerInfo);
        }
        
        return JSON.stringify(result, null, 2);
    } catch (error) {
        return JSON.stringify({
            status: "error",
            message: error.toString()
        }, null, 2);
    }
} 