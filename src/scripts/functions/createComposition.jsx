// createComposition.jsx
// Creates a new composition with the specified settings

//@include "utils.jsx"

// ========== 参数验证Schema ==========
var CREATE_COMPOSITION_SCHEMA = {
    name: "createComposition",
    description: "创建新的After Effects合成",
    category: "creation",
    required: ["name"],
    properties: {
        name: {
            type: "string",
            description: "合成名称",
            example: "My Composition",
            minLength: 1,
            maxLength: 255
        },
        width: {
            type: "integer",
            description: "合成宽度（像素）",
            example: 1920,
            "default": 1920,
            min: 1,
            max: 8192
        },
        height: {
            type: "integer", 
            description: "合成高度（像素）",
            example: 1080,
            "default": 1080,
            min: 1,
            max: 8192
        },
        pixelAspect: {
            type: "number",
            description: "像素宽高比",
            example: 1.0,
            "default": 1.0,
            min: 0.1,
            max: 10.0
        },
        duration: {
            type: "number",
            description: "合成持续时间（秒）",
            example: 10.0,
            "default": 10.0,
            min: 0.1,
            max: 3600.0
        },
        frameRate: {
            type: "number",
            description: "帧率（fps）",
            example: 30.0,
            "default": 30.0,
            min: 1.0,
            max: 120.0
        },
        backgroundColor: {
            type: "object",
            description: "背景颜色（RGB值0-255）",
            example: { "r": 255, "g": 255, "b": 255 },
            properties: {
                r: { type: "integer", min: 0, max: 255 },
                g: { type: "integer", min: 0, max: 255 },
                b: { type: "integer", min: 0, max: 255 }
            }
        }
    },
    examples: [
        {
            name: "HD合成",
            args: {
                name: "HD_Composition",
                width: 1920,
                height: 1080,
                duration: 30.0,
                frameRate: 30.0
            }
        },
        {
            name: "4K合成带背景色",
            args: {
                name: "4K_Composition",
                width: 3840,
                height: 2160,
                duration: 60.0,
                frameRate: 24.0,
                backgroundColor: { r: 255, g: 255, b: 255 }
            }
        }
    ]
};

function createComposition(args) {
    try {
        // 参数验证
        var validation = validateParameters(args, CREATE_COMPOSITION_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: CREATE_COMPOSITION_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        // Extract parameters from validated args
        var name = params.name;
        var width = params.width;
        var height = params.height;
        var pixelAspect = params.pixelAspect;
        var duration = params.duration;
        var frameRate = params.frameRate;
        var bgColor = params.backgroundColor ? [params.backgroundColor.r/255, params.backgroundColor.g/255, params.backgroundColor.b/255] : [0, 0, 0];
        
        // Create the composition
        var newComp = app.project.items.addComp(name, width, height, pixelAspect, duration, frameRate);
        
        // Set background color if provided
        if (params.backgroundColor) {
            newComp.bgColor = bgColor;
        }
        
        // Return success with composition details
        return JSON.stringify({
            status: "success",
            message: "Composition created successfully",
            composition: {
                name: newComp.name,
                id: newComp.id,
                width: newComp.width,
                height: newComp.height,
                pixelAspect: newComp.pixelAspect,
                duration: newComp.duration,
                frameRate: newComp.frameRate,
                bgColor: newComp.bgColor
            }
        }, null, 2);
    } catch (error) {
        // Return error message
        return JSON.stringify({
            status: "error",
            message: error.toString()
        }, null, 2);
    }
}

// ========== 测试函数 ==========
function testCreateComposition() {
    try {
        logAlert("开始测试 createComposition 函数...");
        
        // 测试用例1: 创建HD合成
        var testArgs1 = {
            name: "Test_HD_Composition",
            width: 1920,
            height: 1080,
            duration: 10.0,
            frameRate: 30.0
        };
        
        logAlert("测试HD合成创建...");
        var result1 = createComposition(testArgs1);
        logAlert("HD合成测试结果:\n" + result1);
        
        // // 测试用例2: 创建4K合成带背景色
        // var testArgs2 = {
        //     name: "Test_4K_Composition",
        //     width: 3840,
        //     height: 2160,
        //     duration: 15.0,
        //     frameRate: 24.0,
        //     backgroundColor: { r: 255, g: 255, b: 255 }  // 白色背景
        // };
        
        // logAlert("测试4K合成创建...");
        // var result2 = createComposition(testArgs2);
        // logAlert("4K合成测试结果:\n" + result2);
        
        // // 测试用例3: 创建方形合成
        // var testArgs3 = {
        //     name: "Test_Square_Composition",
        //     width: 1080,
        //     height: 1080,
        //     duration: 5.0,
        //     frameRate: 60.0,
        //     backgroundColor: { r: 50, g: 50, b: 50 }  // 深灰色背景
        // };
        
        // logAlert("测试方形合成创建...");
        // var result3 = createComposition(testArgs3);
        // logAlert("方形合成测试结果:\n" + result3);
        
        // // 测试用例4: 创建竖屏合成
        // var testArgs4 = {
        //     name: "Test_Portrait_Composition",
        //     width: 1080,
        //     height: 1920,
        //     duration: 30.0,
        //     frameRate: 25.0,
        //     pixelAspect: 1.0
        // };
        
        // logAlert("测试竖屏合成创建...");
        // var result4 = createComposition(testArgs4);
        // logAlert("竖屏合成测试结果:\n" + result4);
        
        logAlert("createComposition 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testCreateComposition(); 