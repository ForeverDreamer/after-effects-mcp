// effectsCore.jsx
// Core utilities for After Effects effect management

//@include "utils.jsx"

// ========== 标准响应创建函数 ==========
function createStandardResponse(status, message, data, errors) {
    var response = {
        status: status || "success",
        message: message || ""
    };
    
    if (data) {
        for (var key in data) {
            if (data.hasOwnProperty(key)) {
                response[key] = data[key];
            }
        }
    }
    
    if (errors) {
        response.errors = errors;
    }
    
    return JSON.stringify(response, null, 2);
}

// ========== 增强的操作包装函数 ==========
function executeWithUndoGroup(operationName, operation) {
    try {
        app.beginUndoGroup(operationName);
        var result = operation();
        app.endUndoGroup();
        return result;
    } catch (error) {
        app.endUndoGroup();
        throw error;
    }
}

// ========== 统一图层操作函数 ==========
function performLayerOperation(compName, layerIndex, operation, operationName) {
    try {
        var layerResult = findLayerInComposition(compName, layerIndex);
        if (!layerResult.success) {
            return createStandardResponse("error", layerResult.error);
        }
        
        return executeWithUndoGroup(operationName || "Layer Operation", function() {
            return operation(layerResult.layer, layerResult.composition);
        });
    } catch (error) {
        return createStandardResponse("error", "Operation failed: " + error.toString());
    }
}

// ========== 统一创建操作函数 ==========
function performCreateOperation(compName, operation, operationName) {
    try {
        var compResult = getCompositionByName(compName);
        if (compResult.error) {
            return createStandardResponse("error", compResult.error);
        }
        
        return executeWithUndoGroup(operationName || "Create Operation", function() {
            return operation(compResult.composition);
        });
    } catch (error) {
        return createStandardResponse("error", "Creation failed: " + error.toString());
    }
}

// ========== 参数验证增强函数 ==========
function validateEffectParameters(args, schema, additionalValidation) {
    var validation = validateParameters(args, schema);
    
    if (!validation.isValid) {
        return validation;
    }
    
    // 执行额外的业务逻辑验证
    if (additionalValidation && typeof additionalValidation === "function") {
        var additionalResult = additionalValidation(validation.normalizedArgs);
        if (additionalResult && !additionalResult.isValid) {
            validation.isValid = false;
            validation.errors = validation.errors.concat(additionalResult.errors);
        }
    }
    
    return validation;
}

// ========== 图层查找函数 ==========
function findLayerInComposition(compName, layerIndex) {
    try {
        var compResult = getCompositionByName(compName);
        if (compResult.error) {
            return {
                success: false,
                error: compResult.error
            };
        }
        
        var comp = compResult.composition;
        var layer = comp.layer(layerIndex);
        
        if (!layer) {
            return {
                success: false,
                error: "Layer not found at index " + layerIndex + " in composition '" + comp.name + "'"
            };
        }
        
        return {
            success: true,
            composition: comp,
            layer: layer
        };
    } catch (error) {
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ========== 统一特效设置应用函数 ==========
function applyEffectSettings(effect, settings) {
    if (!settings || Object.keys(settings).length === 0) {
        return { success: true, appliedSettings: [] };
    }
    
    var appliedSettings = [];
    var failedSettings = [];
    
    for (var propName in settings) {
        if (settings.hasOwnProperty(propName)) {
            try {
                var property = null;
                
                // 尝试直接属性访问
                try {
                    property = effect.property(propName);
                } catch (e) {
                    // 如果直接访问失败，搜索所有属性
                    for (var i = 1; i <= effect.numProperties; i++) {
                        var prop = effect.property(i);
                        if (prop.name === propName) {
                            property = prop;
                            break;
                        }
                    }
                }
                
                if (property && property.setValue) {
                    property.setValue(settings[propName]);
                    appliedSettings.push({
                        name: propName,
                        value: settings[propName]
                    });
                } else {
                    failedSettings.push({
                        name: propName,
                        error: "Property not found or not settable"
                    });
                }
            } catch (e) {
                failedSettings.push({
                    name: propName,
                    error: e.toString()
                });
            }
        }
    }
    
    return {
        success: failedSettings.length === 0,
        appliedSettings: appliedSettings,
        failedSettings: failedSettings
    };
}

// ========== 单个特效应用核心函数 ==========
function applySingleEffect(layer, effectConfig) {
    try {
        var effect;
        var effectResult = {};
        
        // 应用预设文件
        if (effectConfig.presetPath) {
            var presetFile = new File(effectConfig.presetPath);
            if (!presetFile.exists) {
                throw new Error("Effect preset file not found: " + effectConfig.presetPath);
            }
            
            layer.applyPreset(presetFile);
            effectResult = {
                type: "preset",
                name: effectConfig.presetPath.split('/').pop().split('\\').pop(),
                applied: true
            };
        }
        // 通过内部名称应用特效
        else if (effectConfig.effectMatchName) {
            effect = layer.Effects.addProperty(effectConfig.effectMatchName);
            effectResult = {
                type: "effect",
                name: effect.name,
                matchName: effect.matchName,
                index: effect.propertyIndex
            };
        }
        // 通过显示名称应用特效
        else if (effectConfig.effectName) {
            effect = layer.Effects.addProperty(effectConfig.effectName);
            effectResult = {
                type: "effect",
                name: effect.name,
                matchName: effect.matchName,
                index: effect.propertyIndex
            };
        } else {
            throw new Error("Must specify effectName, effectMatchName, or presetPath");
        }
        
        // 应用设置
        if (effect && effectConfig.effectSettings) {
            var settingsResult = applyEffectSettings(effect, effectConfig.effectSettings);
            effectResult.settingsApplied = settingsResult.appliedSettings;
            if (settingsResult.failedSettings.length > 0) {
                effectResult.settingsWarnings = settingsResult.failedSettings;
            }
        }
        
        return {
            success: true,
            effect: effectResult
        };
    } catch (error) {
        return {
            success: false,
            error: error.toString()
        };
    }
}

// ========== 增强的通用批量处理函数 ==========
function processBatchOperation(items, processor, options) {
    var defaultOptions = {
        skipErrors: true,
        validateOnly: false,
        operationName: "Batch Operation",
        itemName: "item"
    };
    
    // 合并选项
    var opts = {};
    for (var key in defaultOptions) {
        opts[key] = defaultOptions[key];
    }
    if (options) {
        for (var key in options) {
            if (options.hasOwnProperty(key)) {
                opts[key] = options[key];
            }
        }
    }
    
    var results = {
        status: "success",
        message: opts.validateOnly ? "Validation completed" : opts.operationName + " completed",
        totalItems: items.length,
        successful: 0,
        failed: 0,
        results: [],
        errors: []
    };
    
    // 开始撤销组
    if (!opts.validateOnly) {
        app.beginUndoGroup(opts.operationName);
    }
    
    try {
        // 处理每个项目
        for (var i = 0; i < items.length; i++) {
            var item = items[i];
            var itemResult = {
                index: i + 1,
                config: item,
                status: "pending"
            };
            
            try {
                var processorResult = processor(item, i, opts.validateOnly);
                
                if (processorResult.success) {
                    itemResult.status = opts.validateOnly ? "valid" : "success";
                    if (processorResult.result) {
                        itemResult.result = processorResult.result;
                    }
                    results.successful++;
                } else {
                    throw new Error(processorResult.error || "Processor failed");
                }
            } catch (error) {
                itemResult.status = "error";
                itemResult.error = error.toString();
                results.failed++;
                results.errors.push({
                    index: i + 1,
                    config: item,
                    error: error.toString()
                });
                
                if (!opts.skipErrors) {
                    results.status = "error";
                    results.message = opts.operationName + " failed at " + opts.itemName + " " + (i + 1) + ": " + error.toString();
                    break;
                }
            }
            
            results.results.push(itemResult);
        }
        
        // 设置最终状态
        if (results.failed > 0 && results.successful === 0) {
            results.status = "error";
            results.message = "All " + opts.itemName + "s failed to process";
        } else if (results.failed > 0) {
            results.status = "partial";
            results.message = opts.operationName + " completed with " + results.failed + " failures";
        }
        
        return createStandardResponse(results.status, results.message, {
            totalItems: results.totalItems,
            successful: results.successful,
            failed: results.failed,
            results: results.results,
            errors: results.errors
        });
        
    } finally {
        if (!opts.validateOnly) {
            app.endUndoGroup();
        }
    }
} 