// createSolidLayer.jsx
// Creates a new solid color layer in the specified composition

//@include "utils.jsx"
//@include "layerOperations.jsx"

// ========== 参数验证Schema ==========
var CREATE_SOLID_LAYER_SCHEMA = {
    name: "createSolidLayer",
    description: "在指定合成中创建纯色图层",
    category: "creation",
    required: ["color"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        color: {
            type: "array",
            description: "纯色颜色 [r, g, b] (0-1范围)",
            example: [1, 0, 0]
        },
        width: {
            type: "number",
            description: "宽度（像素，0使用合成宽度）",
            example: 1920,
            "default": 0,
            min: 0,
            max: 8192
        },
        height: {
            type: "number",
            description: "高度（像素，0使用合成高度）",
            example: 1080,
            "default": 0,
            min: 0,
            max: 8192
        },
        pixelAspect: {
            type: "number",
            description: "像素长宽比",
            example: 1.0,
            "default": 1.0,
            min: 0.1,
            max: 10.0
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
            example: "My Solid",
            "default": "Solid Layer",
            maxLength: 255
        }
    },
    examples: [
        {
            name: "创建红色纯色",
            args: {
                compName: "Main Comp",
                color: [1, 0, 0],
                name: "Red Background"
            }
        },
        {
            name: "创建自定义尺寸纯色",
            args: {
                compName: "Solid Comp",
                color: [0, 1, 0],
                width: 500,
                height: 300,
                name: "Green Solid"
            }
        }
    ]
};

function createSolidLayer(args) {
    // 参数验证
    var validation = validateParameters(args, CREATE_SOLID_LAYER_SCHEMA);
    if (!validation.isValid) {
        return createStandardResponse("error", "Parameter validation failed", {
            errors: validation.errors,
            schema: CREATE_SOLID_LAYER_SCHEMA
        });
    }
    
    var params = validation.normalizedArgs;
    
    // 使用统一的图层创建函数
    return createLayer("solid", params.compName, params, "Create Solid Layer");
}

// ========== 测试函数 ==========
function testCreateSolidLayer() {
    try {
        logAlert("开始测试 createSolidLayer 函数...");
        
        // 测试用例1: 创建红色背景
        var testArgs1 = {
            compName: "",  // 使用当前活动合成
            color: [1, 0, 0],  // 红色
            name: "Red Background"
        };
        
        logAlert("测试红色背景创建...");
        var result1 = createSolidLayer(testArgs1);
        logAlert("红色背景测试结果:\n" + result1);
        
        // 测试用例2: 创建自定义尺寸绿色纯色
        var testArgs2 = {
            compName: "",
            color: [0, 1, 0],  // 绿色
            width: 500,
            height: 300,
            name: "Green Solid Custom Size"
        };
        
        logAlert("测试自定义尺寸绿色纯色...");
        var result2 = createSolidLayer(testArgs2);
        logAlert("绿色纯色测试结果:\n" + result2);
        
        // 测试用例3: 创建蓝色调整图层样式
        var testArgs3 = {
            compName: "",
            color: [0, 0, 1],  // 蓝色
            width: 800,
            height: 600,
            startTime: 1,
            duration: 10,
            name: "Blue Solid Timed"
        };
        
        logAlert("测试定时蓝色纯色...");
        var result3 = createSolidLayer(testArgs3);
        logAlert("定时蓝色纯色测试结果:\n" + result3);
        
        // 测试用例4: 创建半透明白色纯色
        var testArgs4 = {
            compName: "",
            color: [1, 1, 1],  // 白色
            name: "White Solid Background",
            pixelAspect: 1.0
        };
        
        logAlert("测试白色背景纯色...");
        var result4 = createSolidLayer(testArgs4);
        logAlert("白色背景测试结果:\n" + result4);
        
        logAlert("createSolidLayer 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testCreateSolidLayer(); 