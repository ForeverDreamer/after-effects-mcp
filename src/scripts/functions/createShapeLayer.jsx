// createShapeLayer.jsx
// Creates a new shape layer in the specified composition

//@include "utils.jsx"
//@include "layerOperations.jsx"

// ========== 参数验证Schema ==========
var CREATE_SHAPE_LAYER_SCHEMA = {
    name: "createShapeLayer",
    description: "在指定合成中创建形状图层",
    category: "creation",
    required: ["shapeType"],
    properties: {
        compName: {
            type: "string",
            description: "合成名称（空字符串使用活动合成）",
            example: "Main Comp",
            "default": ""
        },
        shapeType: {
            type: "string",
            description: "形状类型",
            example: "rectangle",
            "enum": ["rectangle", "ellipse", "polygon", "star"]
        },
        position: {
            type: "array",
            description: "形状位置 [x, y]",
            example: [960, 540],
            "default": [960, 540]
        },
        size: {
            type: "array",
            description: "形状大小 [width, height]",
            example: [200, 200],
            "default": [200, 200]
        },
        fillColor: {
            type: "array",
            description: "填充颜色 [r, g, b] (0-1范围)",
            example: [1, 0, 0],
            "default": [1, 0, 0]
        },
        strokeColor: {
            type: "array",
            description: "描边颜色 [r, g, b] (0-1范围)",
            example: [0, 0, 0],
            "default": [0, 0, 0]
        },
        strokeWidth: {
            type: "number",
            description: "描边宽度（像素）",
            example: 2,
            "default": 0,
            min: 0,
            max: 100
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
            example: "My Shape",
            "default": "Shape Layer",
            maxLength: 255
        },
        cornerRadius: {
            type: "number",
            description: "圆角半径（仅适用于矩形）",
            example: 10,
            "default": 5,
            min: 0,
            max: 1000
        },
        points: {
            type: "number",
            description: "点数（适用于多边形和星形）",
            example: 6,
            "default": 6,
            min: 3,
            max: 20
        }
    },
    examples: [
        {
            name: "创建矩形形状",
            args: {
                compName: "Main Comp",
                shapeType: "rectangle",
                size: [300, 200],
                fillColor: [0, 1, 0],
                name: "Green Rectangle"
            }
        },
        {
            name: "创建带描边的圆形",
            args: {
                compName: "Shape Comp",
                shapeType: "ellipse",
                size: [150, 150],
                fillColor: [1, 1, 0],
                strokeColor: [0, 0, 1],
                strokeWidth: 5
            }
        },
        {
            name: "创建六边形",
            args: {
                compName: "Polygon Comp",
                shapeType: "polygon",
                size: [180, 180],
                fillColor: [1, 0, 1],
                points: 6
            }
        }
    ]
};

function createShapeLayer(args) {
    // 参数验证
    var validation = validateParameters(args, CREATE_SHAPE_LAYER_SCHEMA);
    if (!validation.isValid) {
        return createStandardResponse("error", "Parameter validation failed", {
            errors: validation.errors,
            schema: CREATE_SHAPE_LAYER_SCHEMA
        });
    }
    
    // 使用验证后的参数
    var params = validation.normalizedArgs;
    
    // 使用统一的图层创建函数
    return createLayer("shape", params.compName, params, "Create Shape Layer");
}

// // ========== 测试函数 ==========
// function testCreateShapeLayer() {
//     try {
//         alert("开始测试 createShapeLayer 函数...");
        
//         // 测试用例1: 创建矩形
//         var testArgs1 = {
//             compName: "",  // 使用当前活动合成
//             shapeType: "rectangle",
//             size: [200, 100],
//             fillColor: [1, 0, 0],  // 红色
//             name: "Test Rectangle"
//         };
        
//         alert("测试矩形创建...");
//         var result1 = createShapeLayer(testArgs1);
//         alert("矩形测试结果:\n" + result1);
        
//         // 测试用例2: 创建圆形
//         var testArgs2 = {
//             compName: "",
//             shapeType: "ellipse", 
//             size: [150, 150],
//             fillColor: [0, 1, 0],  // 绿色
//             strokeColor: [0, 0, 1],  // 蓝色描边
//             strokeWidth: 3,
//             name: "Test Circle"
//         };
        
//         alert("测试圆形创建...");
//         var result2 = createShapeLayer(testArgs2);
//         alert("圆形测试结果:\n" + result2);
        
//         // 测试用例3: 创建多边形
//         var testArgs3 = {
//             compName: "",
//             shapeType: "polygon",
//             size: [180, 180],
//             fillColor: [0, 0, 1],  // 蓝色
//             points: 6,  // 六边形
//             name: "Test Hexagon"
//         };
        
//         alert("测试六边形创建...");
//         var result3 = createShapeLayer(testArgs3);
//         alert("六边形测试结果:\n" + result3);
        
//         // 测试用例4: 创建星形
//         var testArgs4 = {
//             compName: "",
//             shapeType: "star",
//             size: [160, 160],
//             fillColor: [1, 1, 0],  // 黄色
//             points: 5,  // 五角星
//             name: "Test Star"
//         };
        
//         alert("测试五角星创建...");
//         var result4 = createShapeLayer(testArgs4);
//         alert("五角星测试结果:\n" + result4);
        
//         alert("所有测试完成!");
        
//     } catch (error) {
//         alert("测试过程中发生错误: " + error.toString());
//     }
// }

// // 调用测试函数
// // 取消注释下面这行来运行测试
// testCreateShapeLayer(); 