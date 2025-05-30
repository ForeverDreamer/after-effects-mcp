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

// ========== 批量处理核心函数 ==========
function processBatchOperation(items, processor, options) {
    options = options || {};
    var skipErrors = options.skipErrors !== false; // 默认跳过错误
    var validateOnly = options.validateOnly === true;
    
    var results = {
        totalItems: items.length,
        successful: 0,
        failed: 0,
        results: [],
        errors: []
    };
    
    for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var itemResult = {
            index: i + 1,
            item: item,
            status: "pending"
        };
        
        try {
            var processResult = processor(item, i, validateOnly);
            
            if (processResult.success) {
                itemResult.status = validateOnly ? "valid" : "success";
                itemResult.result = processResult.result;
                results.successful++;
            } else {
                throw new Error(processResult.error || "Processing failed");
            }
        } catch (error) {
            itemResult.status = "error";
            itemResult.error = error.toString();
            results.failed++;
            results.errors.push({
                index: i + 1,
                item: item,
                error: error.toString()
            });
            
            if (!skipErrors) {
                results.aborted = true;
                break;
            }
        }
        
        results.results.push(itemResult);
    }
    
    return results;
} 