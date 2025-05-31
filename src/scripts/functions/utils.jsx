// utils.jsx
// Utility functions for common After Effects operations

// ========== ExtendScript兼容性Polyfills ==========

// Object.keys polyfill for ExtendScript
if (!Object.keys) {
    Object.keys = function(obj) {
        if (obj !== Object(obj)) {
            throw new TypeError('Object.keys called on a non-object');
        }
        var keys = [];
        for (var key in obj) {
            if (Object.prototype.hasOwnProperty.call(obj, key)) {
                keys.push(key);
            }
        }
        return keys;
    };
}

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
 * 验证单个参数类型（非递归版本，用于联合类型处理）
 */
function validateSingleParameterType(value, type, paramSchema, paramName) {
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
                if (paramSchema["enum"]) {
                    // 兼容性检查：手动遍历enum数组
                    var enumFound = false;
                    for (var j = 0; j < paramSchema["enum"].length; j++) {
                        if (paramSchema["enum"][j] === value) {
                            enumFound = true;
                            break;
                        }
                    }
                    if (!enumFound) {
                        var enumValues = "";
                        for (var k = 0; k < paramSchema["enum"].length; k++) {
                            enumValues += paramSchema["enum"][k];
                            if (k < paramSchema["enum"].length - 1) {
                                enumValues += ", ";
                            }
                        }
                        return { error: paramName + " must be one of: " + enumValues };
                    }
                }
                break;
                
            case "number":
                // 首先检查是否为数组，如果是数组则直接返回错误，避免parseFloat(array)
                if (value instanceof Array || Object.prototype.toString.call(value) === '[object Array]') {
                    return { error: paramName + " must be a number, got array" };
                }
                if (typeof value === "object" && value !== null) {
                    return { error: paramName + " must be a number, got object" };
                }
                
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
                // 首先检查是否为数组，如果是数组则直接返回错误
                if (value instanceof Array || Object.prototype.toString.call(value) === '[object Array]') {
                    return { error: paramName + " must be an integer, got array" };
                }
                if (typeof value === "object" && value !== null) {
                    return { error: paramName + " must be an integer, got object" };
                }
                
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
                if (!(Array.isArray && Array.isArray(value)) && Object.prototype.toString.call(value) !== '[object Array]') {
                    return { error: paramName + " must be an array" };
                }
                if (paramSchema.minLength && value.length < paramSchema.minLength) {
                    return { error: paramName + " must have at least " + paramSchema.minLength + " items" };
                }
                if (paramSchema.maxLength && value.length > paramSchema.maxLength) {
                    return { error: paramName + " must have at most " + paramSchema.maxLength + " items" };
                }
                break;
                
            case "object":
                if (typeof value !== "object" || value === null || (Array.isArray && Array.isArray(value))) {
                    return { error: paramName + " must be an object" };
                }
                break;
                
            default:
                return { error: "Unknown type: " + type };
        }
        
        return { value: convertedValue };
    } catch (e) {
        return { error: "Error validating " + paramName + " as " + type + ": " + e.toString() };
    }
}

/**
 * 验证单个参数类型
 */
function validateParameterType(value, paramSchema, paramName) {
    var type = paramSchema.type;
    
    try {
        // 处理联合类型（type是数组的情况）
        if (type instanceof Array) {
            var validationErrors = [];
            
            // 尝试每种类型
            for (var typeIndex = 0; typeIndex < type.length; typeIndex++) {
                var currentType = type[typeIndex];
                
                var typeResult = validateSingleParameterType(value, currentType, paramSchema, paramName);
                if (!typeResult.error) {
                    // 找到匹配的类型
                    return typeResult;
                }
                validationErrors.push(currentType + ": " + typeResult.error);
            }
            
            // 所有类型都不匹配
            return { 
                error: paramName + " must be one of types [" + type.join(", ") + "], validation errors: " + validationErrors.join("; ")
            };
        }
        
        // 处理单一类型，使用非递归版本
        return validateSingleParameterType(value, type, paramSchema, paramName);
        
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

// ========== 通用日志函数 ==========
/**
 * 统一的Alert替换函数，写入命令日志文件
 * @param {string} message - 要记录的消息
 */
function logAlert(message) {
    try {
        // 使用固定的项目结构路径
        // utils.jsx在src/scripts/functions/目录中
        var scriptFile = new File($.fileName); // utils.jsx的路径
        var functionsDir = scriptFile.parent; // functions目录
        var scriptsDir = functionsDir.parent; // scripts目录  
        var tempDir = new Folder(scriptsDir.fsName + "/temp");
        
        // 确保临时目录存在
        if (!tempDir.exists) {
            tempDir.create();
        }
        
        var commandLogFile = new File(tempDir.fsName + "/command_log.txt");
        
        // 创建带时间戳的日志条目
        var timestamp = new Date().toISOString();
        var logEntry = "[" + timestamp + "] " + message + "\n";
        
        // 写入文件，使用UTF-8编码
        commandLogFile.encoding = "UTF-8";
        var opened = commandLogFile.open("a"); // append mode
        if (opened) {
            commandLogFile.write(logEntry);
            commandLogFile.close();
        }
    } catch (error) {
        // 如果日志写入失败，不影响主功能
        // 可以选择性地在这里添加fallback逻辑
    }
}

// ========== ExtendScript兼容性函数 ==========

/**
 * ExtendScript兼容的indexOf函数
 * @param {Array} array - 要搜索的数组
 * @param {*} searchElement - 要搜索的元素
 * @param {number} fromIndex - 搜索的起始索引（可选）
 * @returns {number} 元素的索引，如果未找到则返回-1
 */
function arrayIndexOf(array, searchElement, fromIndex) {
    fromIndex = fromIndex || 0;
    if (!array || typeof array.length === 'undefined') {
        return -1;
    }
    
    for (var i = fromIndex; i < array.length; i++) {
        if (array[i] === searchElement) {
            return i;
        }
    }
    return -1;
}

/**
 * 检查数组中是否包含指定元素
 * @param {Array} array - 要检查的数组
 * @param {*} element - 要查找的元素
 * @returns {boolean} 如果找到返回true，否则返回false
 */
function arrayContains(array, element) {
    return arrayIndexOf(array, element) !== -1;
}

/**
 * ExtendScript兼容的Object.keys函数
 * @param {Object} obj - 要获取键的对象
 * @returns {Array} 对象的键数组
 */
function getObjectKeys(obj) {
    var keys = [];
    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            keys.push(key);
        }
    }
    return keys;
}

/**
 * 检查对象是否为空
 * @param {Object} obj - 要检查的对象
 * @returns {boolean} 如果对象为空返回true
 */
function isEmptyObject(obj) {
    if (!obj || typeof obj !== 'object') {
        return true;
    }
    return getObjectKeys(obj).length === 0;
} 