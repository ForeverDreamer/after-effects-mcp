// batchSetLayerProperties.jsx
// Batch set properties for multiple layers

//@include "utils.jsx" 
//@include "setLayerProperties.jsx"

// ========== 参数验证Schema ==========
var BATCH_SET_LAYER_PROPERTIES_SCHEMA = {
    name: "batchSetLayerProperties",
    description: "批量为多个图层设置属性",
    category: "batch-modification",
    required: ["layerProperties"],
    properties: {
        layerProperties: {
            type: "array",
            description: "图层属性配置数组",
            example: [
                {
                    "compName": "Main Comp",
                    "layerIndex": 1,
                    "position": [500, 300],
                    "opacity": 80
                },
                {
                    "compName": "Main Comp",
                    "layerName": "Text Layer",
                    "fontSize": 48,
                    "fillColor": [1, 0, 0]
                }
            ],
            minLength: 1,
            maxLength: 100
        },
        skipErrors: {
            type: "boolean",
            description: "是否跳过错误继续处理其他图层",
            example: true,
            "default": true
        },
        validateOnly: {
            type: "boolean",
            description: "仅验证参数而不执行设置",
            example: false,
            "default": false
        }
    },
    examples: [
        {
            name: "批量调整图层位置和透明度",
            args: {
                layerProperties: [
                    {
                        compName: "Animation Comp",
                        layerIndex: 1,
                        position: [300, 200],
                        opacity: 80,
                        scale: [120, 120]
                    },
                    {
                        compName: "Animation Comp",
                        layerIndex: 2,
                        position: [700, 200],
                        opacity: 90,
                        rotation: 15
                    },
                    {
                        compName: "Animation Comp",
                        layerIndex: 3,
                        position: [500, 400],
                        opacity: 70,
                        scale: [80, 80]
                    }
                ],
                skipErrors: true
            }
        },
        {
            name: "批量修改文本图层",
            args: {
                layerProperties: [
                    {
                        compName: "Text Comp",
                        layerName: "Title",
                        text: "New Title",
                        fontSize: 72,
                        fillColor: [1, 1, 1],
                        position: [960, 200]
                    },
                    {
                        compName: "Text Comp",
                        layerName: "Subtitle",
                        text: "New Subtitle",
                        fontSize: 48,
                        fillColor: [0.8, 0.8, 0.8],
                        position: [960, 350]
                    }
                ]
            }
        }
    ]
};

function batchSetLayerProperties(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, BATCH_SET_LAYER_PROPERTIES_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: BATCH_SET_LAYER_PROPERTIES_SCHEMA
            }, null, 2);
        }
        
        var params = validation.normalizedArgs;
        var layerProperties = params.layerProperties;
        var skipErrors = params.skipErrors;
        var validateOnly = params.validateOnly;
        
        var results = {
            status: "success",
            message: validateOnly ? "Validation completed" : "Batch layer properties setting completed",
            totalLayers: layerProperties.length,
            successful: 0,
            failed: 0,
            results: [],
            errors: []
        };
        
        // 开始撤销组
        if (!validateOnly) {
            app.beginUndoGroup("Batch Set Layer Properties");
        }
        
        try {
            // 处理每个图层属性配置
            for (var i = 0; i < layerProperties.length; i++) {
                var propertyConfig = layerProperties[i];
                var propertyResult = {
                    index: i + 1,
                    config: propertyConfig,
                    status: "pending"
                };
                
                try {
                    // 验证必需参数
                    if (!propertyConfig.compName && propertyConfig.compName !== "") {
                        throw new Error("Composition name is required");
                    }
                    
                    if (!propertyConfig.layerName && !propertyConfig.layerIndex) {
                        throw new Error("Either layerName or layerIndex is required");
                    }
                    
                    if (validateOnly) {
                        // 仅验证模式，检查参数有效性
                        var testValidation = validateParameters(propertyConfig, SET_LAYER_PROPERTIES_SCHEMA);
                        if (!testValidation.isValid) {
                            throw new Error("Invalid parameters: " + testValidation.errors.join(", "));
                        }
                        propertyResult.status = "valid";
                        results.successful++;
                    } else {
                        // 实际设置图层属性
                        var setResult = setLayerProperties(propertyConfig);
                        var parsedResult = JSON.parse(setResult);
                        
                        if (parsedResult.status === "success") {
                            propertyResult.status = "success";
                            propertyResult.details = parsedResult.details;
                            results.successful++;
                        } else {
                            throw new Error(parsedResult.message || "Failed to set layer properties");
                        }
                    }
                } catch (error) {
                    propertyResult.status = "error";
                    propertyResult.error = error.toString();
                    results.failed++;
                    results.errors.push({
                        index: i + 1,
                        config: propertyConfig,
                        error: error.toString()
                    });
                    
                    if (!skipErrors) {
                        // 如果不跳过错误，立即终止
                        results.status = "error";
                        results.message = "Batch operation failed at layer " + (i + 1) + ": " + error.toString();
                        break;
                    }
                }
                
                results.results.push(propertyResult);
            }
            
            // 设置最终状态
            if (results.failed > 0 && results.successful === 0) {
                results.status = "error";
                results.message = "All layer property operations failed";
            } else if (results.failed > 0) {
                results.status = "partial";
                results.message = "Batch operation completed with " + results.failed + " errors";
            }
            
        } finally {
            if (!validateOnly) {
                app.endUndoGroup();
            }
        }
        
        return JSON.stringify(results, null, 2);
        
    } catch (error) {
        if (!validateOnly) {
            try { app.endUndoGroup(); } catch (e) {}
        }
        return JSON.stringify({
            status: "error",
            message: "Batch set layer properties failed: " + error.toString(),
            details: {
                line: error.line || "unknown"
            }
        }, null, 2);
    }
} 