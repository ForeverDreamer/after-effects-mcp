// effectTemplates.jsx
// Unified effect templates management

// ========== 特效模板定义 ==========
var EFFECT_TEMPLATES = {
    // 模糊特效
    "gaussian-blur": {
        type: "single",
        effectMatchName: "ADBE Gaussian Blur 2",
        defaultSettings: {
            "Blurriness": 20
        },
        description: "高斯模糊特效"
    },
    
    "directional-blur": {
        type: "single",
        effectMatchName: "ADBE Motion Blur",
        defaultSettings: {
            "Direction": 0,
            "Blur Length": 10
        },
        description: "方向模糊特效"
    },
    
    // 颜色校正特效
    "color-balance": {
        type: "single",
        effectMatchName: "ADBE Color Balance (HLS)",
        defaultSettings: {
            "Hue": 0,
            "Lightness": 0,
            "Saturation": 0
        },
        description: "色彩平衡特效"
    },
    
    "brightness-contrast": {
        type: "single",
        effectMatchName: "ADBE Brightness & Contrast 2",
        defaultSettings: {
            "Brightness": 0,
            "Contrast": 0,
            "Use Legacy": false
        },
        description: "亮度对比度特效"
    },
    
    "curves": {
        type: "single",
        effectMatchName: "ADBE CurvesCustom",
        defaultSettings: {},
        description: "曲线调整特效",
        note: "Curves require special handling"
    },
    
    // 风格化特效
    "glow": {
        type: "single",
        effectMatchName: "ADBE Glo2",
        defaultSettings: {
            "Glow Threshold": 50,
            "Glow Radius": 15,
            "Glow Intensity": 1
        },
        description: "发光特效"
    },
    
    "drop-shadow": {
        type: "single",
        effectMatchName: "ADBE Drop Shadow",
        defaultSettings: {
            "Shadow Color": [0, 0, 0, 1],
            "Opacity": 50,
            "Direction": 135,
            "Distance": 10,
            "Softness": 10
        },
        description: "投影特效"
    },
    
    // 复合特效模板
    "cinematic-look": {
        type: "chain",
        effects: [
            {
                effectMatchName: "ADBE Vibrance",
                defaultSettings: {
                    "Vibrance": 15,
                    "Saturation": -5
                }
            },
            {
                effectMatchName: "ADBE Vignette",
                defaultSettings: {
                    "Amount": 15,
                    "Roundness": 50,
                    "Feather": 40
                }
            }
        ],
        description: "电影风格调色"
    },
    
    "text-pop": {
        type: "chain",
        effects: [
            {
                effectMatchName: "ADBE Drop Shadow",
                defaultSettings: {
                    "Shadow Color": [0, 0, 0, 1],
                    "Opacity": 75,
                    "Distance": 5,
                    "Softness": 10
                }
            },
            {
                effectMatchName: "ADBE Glo2",
                defaultSettings: {
                    "Glow Threshold": 50,
                    "Glow Radius": 10,
                    "Glow Intensity": 1.5
                }
            }
        ],
        description: "文字突出效果"
    }
};

// ========== 模板管理函数 ==========

/**
 * 获取特效模板
 * @param {string} templateName - 模板名称
 * @returns {Object} 模板对象或错误信息
 */
function getEffectTemplate(templateName) {
    if (!templateName || typeof templateName !== "string") {
        return {
            success: false,
            error: "Template name must be a non-empty string"
        };
    }
    
    var template = EFFECT_TEMPLATES[templateName];
    if (!template) {
        return {
            success: false,
            error: "Template '" + templateName + "' not found",
            availableTemplates: Object.keys(EFFECT_TEMPLATES)
        };
    }
    
    return {
        success: true,
        template: template
    };
}

/**
 * 验证模板名称
 * @param {string} templateName - 模板名称
 * @returns {Object} 验证结果
 */
function validateTemplateName(templateName) {
    var result = getEffectTemplate(templateName);
    return {
        isValid: result.success,
        errors: result.success ? [] : [result.error]
    };
}

/**
 * 获取所有可用模板列表
 * @returns {Array} 模板名称数组
 */
function getAvailableTemplates() {
    return Object.keys(EFFECT_TEMPLATES);
}

/**
 * 获取模板详细信息
 * @param {string} templateName - 模板名称
 * @returns {Object} 模板详细信息
 */
function getTemplateInfo(templateName) {
    var result = getEffectTemplate(templateName);
    if (!result.success) {
        return result;
    }
    
    var template = result.template;
    var info = {
        name: templateName,
        type: template.type,
        description: template.description
    };
    
    if (template.type === "single") {
        info.effectMatchName = template.effectMatchName;
        info.defaultSettings = template.defaultSettings;
    } else if (template.type === "chain") {
        info.effectsCount = template.effects.length;
        info.effects = template.effects.map(function(effect) {
            return {
                effectMatchName: effect.effectMatchName,
                settingsCount: Object.keys(effect.defaultSettings || {}).length
            };
        });
    }
    
    if (template.note) {
        info.note = template.note;
    }
    
    return {
        success: true,
        info: info
    };
}

/**
 * 合并自定义设置到模板默认设置
 * @param {Object} defaultSettings - 默认设置
 * @param {Object} customSettings - 自定义设置
 * @returns {Object} 合并后的设置
 */
function mergeTemplateSettings(defaultSettings, customSettings) {
    var mergedSettings = {};
    
    // 复制默认设置
    for (var key in defaultSettings) {
        if (defaultSettings.hasOwnProperty(key)) {
            mergedSettings[key] = defaultSettings[key];
        }
    }
    
    // 覆盖自定义设置
    if (customSettings) {
        for (var customKey in customSettings) {
            if (customSettings.hasOwnProperty(customKey)) {
                mergedSettings[customKey] = customSettings[customKey];
            }
        }
    }
    
    return mergedSettings;
}

/**
 * 验证模板设置参数
 * @param {string} templateName - 模板名称
 * @param {Object} settings - 设置参数
 * @returns {Object} 验证结果
 */
function validateTemplateSettings(templateName, settings) {
    var templateResult = getEffectTemplate(templateName);
    if (!templateResult.success) {
        return templateResult;
    }
    
    // 基础验证 - 这里可以扩展更多特定的验证逻辑
    var warnings = [];
    var errors = [];
    
    if (settings && typeof settings !== "object") {
        errors.push("Settings must be an object");
    }
    
    return {
        success: errors.length === 0,
        errors: errors,
        warnings: warnings
    };
} 