// createTextLayer.jsx
// Creates a new text layer in the specified composition

//@include "utils.jsx"
//@include "layerOperations.jsx"

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
        fontFamily: {
            type: "string",
            description: "字体家族",
            example: "Arial",
            "default": "Arial"
        },
        fillColor: {
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
        name: {
            type: "string",
            description: "图层名称",
            example: "My Text",
            "default": "Text Layer",
            maxLength: 255
        }
    },
    examples: [
        {
            name: "创建基础文本",
            args: {
                compName: "Main Comp",
                text: "Hello World",
                fontSize: 72,
                fillColor: [1, 0, 0]
            }
        },
        {
            name: "创建自定义样式文本",
            args: {
                compName: "Text Comp",
                text: "Custom Text",
                position: [500, 300],
                fontSize: 48,
                fontFamily: "Helvetica",
                fillColor: [0, 1, 0],
                name: "Custom Text Layer"
            }
        }
    ]
};

function createTextLayer(args) {
    // 参数验证
    var validation = validateParameters(args, CREATE_TEXT_LAYER_SCHEMA);
    if (!validation.isValid) {
        return createStandardResponse("error", "Parameter validation failed", {
            errors: validation.errors,
            schema: CREATE_TEXT_LAYER_SCHEMA
        });
    }
    
    var params = validation.normalizedArgs;
    
    // 使用统一的图层创建函数
    return createLayer("text", params.compName, params, "Create Text Layer");
}

// ========== 测试函数 ==========
function testCreateTextLayer() {
    try {
        logAlert("开始测试 createTextLayer 函数...");
        
        // 测试用例1: 创建基础文本
        var testArgs1 = {
            compName: "",  // 使用当前活动合成
            text: "Hello World",
            fontSize: 72,
            fillColor: [1, 0, 0],  // 红色
            name: "Test Basic Text"
        };
        
        logAlert("测试基础文本创建...");
        var result1 = createTextLayer(testArgs1);
        logAlert("基础文本测试结果:\n" + result1);
        
        // 测试用例2: 创建自定义字体文本
        var testArgs2 = {
            compName: "",
            text: "Custom Font Text",
            position: [500, 300],
            fontSize: 48,
            fontFamily: "Arial Bold",
            fillColor: [0, 1, 0],  // 绿色
            name: "Custom Font Text"
        };
        
        logAlert("测试自定义字体文本...");
        var result2 = createTextLayer(testArgs2);
        logAlert("自定义字体测试结果:\n" + result2);
        
        // 测试用例3: 创建大尺寸文本
        var testArgs3 = {
            compName: "",
            text: "BIG TEXT",
            fontSize: 120,
            fillColor: [0, 0, 1],  // 蓝色
            position: [960, 200],
            startTime: 2,
            duration: 8,
            name: "Big Text Layer"
        };
        
        logAlert("测试大尺寸文本...");
        var result3 = createTextLayer(testArgs3);
        logAlert("大尺寸文本测试结果:\n" + result3);
        
        // 测试用例4: 创建多行文本
        var testArgs4 = {
            compName: "",
            text: "Line 1\nLine 2\nLine 3",
            fontSize: 36,
            fillColor: [1, 1, 0],  // 黄色
            position: [960, 600],
            name: "Multi Line Text"
        };
        
        logAlert("测试多行文本...");
        var result4 = createTextLayer(testArgs4);
        logAlert("多行文本测试结果:\n" + result4);
        
        logAlert("createTextLayer 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testCreateTextLayer(); 