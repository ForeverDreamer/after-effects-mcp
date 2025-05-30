// utils.jsx
// Utility functions for common After Effects operations

// ========== 参数验证Schema ========== 

/**
 * 统一的参数验证函数
 * @param {Object} args - 传入的参数对象
 * @param {Object} schema - 验证schema对象
 * @returns {Object} 验证结果 { isValid: boolean, errors: string[], normalizedArgs: Object }
 */
function validateParameters(args, schema) {
    var errors = [];
    var normalizedArgs = {};
    
    // 检查必需参数
    if (schema.required) {
        for (var i = 0; i < schema.required.length; i++) {
            var param = schema.required[i];
            if (!args.hasOwnProperty(param) || args[param] === null || args[param] === undefined) {
                errors.push("Missing required parameter: " + param);
            }
        }
    }
    
    // 验证所有参数
    for (var paramName in schema.properties) {
        if (schema.properties.hasOwnProperty(paramName)) {
            var paramSchema = schema.properties[paramName];
            var value = args[paramName];
            
            // 如果参数不存在且有默认值，使用默认值
            if (value === undefined || value === null) {
                if (paramSchema.default !== undefined) {
                    normalizedArgs[paramName] = paramSchema.default;
                }
                continue;
            }
            
            // 类型验证
            var validationResult = validateParameterType(value, paramSchema, paramName);
            if (validationResult.error) {
                errors.push(validationResult.error);
            } else {
                normalizedArgs[paramName] = validationResult.value;
            }
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors: errors,
        normalizedArgs: normalizedArgs
    };
}

/**
 * 验证单个参数类型
 */
function validateParameterType(value, paramSchema, paramName) {
    var type = paramSchema.type;
    var convertedValue = value;
    
    try {
        switch (type) {
            case "string":
                if (typeof value !== "string") {
                    return { error: paramName + " must be a string, got " + typeof value };
                }
                if (paramSchema.minLength && value.length < paramSchema.minLength) {
                    return { error: paramName + " must be at least " + paramSchema.minLength + " characters long" };
                }
                if (paramSchema.maxLength && value.length > paramSchema.maxLength) {
                    return { error: paramName + " must be at most " + paramSchema.maxLength + " characters long" };
                }
                if (paramSchema.enum && paramSchema.enum.indexOf(value) === -1) {
                    return { error: paramName + " must be one of: " + paramSchema.enum.join(", ") };
                }
                break;
                
            case "number":
                convertedValue = parseFloat(value);
                if (isNaN(convertedValue)) {
                    return { error: paramName + " must be a valid number, got " + value };
                }
                if (paramSchema.min !== undefined && convertedValue < paramSchema.min) {
                    return { error: paramName + " must be at least " + paramSchema.min };
                }
                if (paramSchema.max !== undefined && convertedValue > paramSchema.max) {
                    return { error: paramName + " must be at most " + paramSchema.max };
                }
                break;
                
            case "integer":
                convertedValue = parseInt(value);
                if (isNaN(convertedValue) || convertedValue !== parseFloat(value)) {
                    return { error: paramName + " must be a valid integer, got " + value };
                }
                if (paramSchema.min !== undefined && convertedValue < paramSchema.min) {
                    return { error: paramName + " must be at least " + paramSchema.min };
                }
                if (paramSchema.max !== undefined && convertedValue > paramSchema.max) {
                    return { error: paramName + " must be at most " + paramSchema.max };
                }
                break;
                
            case "boolean":
                if (typeof value === "string") {
                    convertedValue = value.toLowerCase() === "true";
                } else {
                    convertedValue = Boolean(value);
                }
                break;
                
            case "array":
                if (!Array.isArray && Object.prototype.toString.call(value) !== '[object Array]') {
                    return { error: paramName + " must be an array" };
                }
                break;
                
            case "object":
                if (typeof value !== "object" || value === null || Array.isArray && Array.isArray(value)) {
                    return { error: paramName + " must be an object" };
                }
                break;
        }
        
        return { value: convertedValue };
    } catch (e) {
        return { error: "Error validating " + paramName + ": " + e.toString() };
    }
}

/**
 * Finds a composition by name
 * @param {string} compName - The name of the composition to find (optional)
 * @returns {CompItem|null} The composition object if found, null otherwise
 */
function findCompositionByName(compName) {
    try {
        // If no compName provided or compName is empty, try to use active composition
        if (!compName || compName === "") {
            if (app.project.activeItem instanceof CompItem) {
                return app.project.activeItem;
            } else {
                return null;
            }
        }
        
        // Search for composition by name
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);
            if (item instanceof CompItem && item.name === compName) {
                return item;
            }
        }
        
        // If not found by name, return null
        return null;
    } catch (error) {
        return null;
    }
}

/**
 * Gets a composition by name with error handling
 * @param {string} compName - The name of the composition to find
 * @returns {Object} Object with composition and error info
 */
function getCompositionByName(compName) {
    var comp = findCompositionByName(compName);
    
    if (!comp) {
        var errorMsg = compName && compName !== "" 
            ? "Composition not found with name '" + compName + "'"
            : "No composition found with name '" + compName + "' and no active composition";
        
        return {
            composition: null,
            error: errorMsg
        };
    }
    
    return {
        composition: comp,
        error: null
    };
}

/**
 * Legacy function for backward compatibility - converts index to name-based lookup
 * @param {number} compIndex - The 1-based index of the composition
 * @returns {CompItem|null} The composition object if found, null otherwise
 */
function findCompositionByIndex(compIndex) {
    try {
        var comp = app.project.item(compIndex);
        if (comp instanceof CompItem) {
            return comp;
        }
        return null;
    } catch (error) {
        return null;
    }
} 