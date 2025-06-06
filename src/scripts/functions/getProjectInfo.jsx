// getProjectInfo.jsx
// Gets comprehensive information about the current project

//@include "utils.jsx"

// ========== 参数验证Schema ==========
var GET_PROJECT_INFO_SCHEMA = {
    name: "getProjectInfo",
    description: "获取After Effects项目的综合信息",
    category: "project",
    required: [],
    properties: {
        includeItems: {
            type: "boolean",
            description: "是否包含项目素材列表",
            example: true,
            "default": true
        },
        maxItems: {
            type: "integer",
            description: "返回的最大素材数量",
            example: 50,
            "default": 50,
            min: 1,
            max: 1000
        },
        includeCompositions: {
            type: "boolean",
            description: "是否包含合成列表",
            example: true,
            "default": true
        },
        maxCompositions: {
            type: "integer",
            description: "最大返回合成数量",
            example: 10,
            "default": 50,
            min: 1,
            max: 1000
        },
        includeFootage: {
            type: "boolean",
            description: "是否包含素材列表",
            example: false,
            "default": false
        },
        includeMetadata: {
            type: "boolean",
            description: "是否包含项目元数据",
            example: false,
            "default": false
        },
        includeSystemInfo: {
            type: "boolean",
            description: "是否包含系统和应用信息",
            example: false,
            "default": false
        }
    },
    examples: [
        {
            name: "获取基本项目信息",
            args: {
                includeItems: false
            }
        },
        {
            name: "获取完整项目信息",
            args: {
                includeItems: true,
                includeCompositions: true,
                maxItems: 100
            }
        },
        {
            name: "获取项目信息和系统信息",
            args: {
                includeItems: true,
                includeSystemInfo: true,
                maxItems: 25
            }
        }
    ]
};

function getProjectInfo(args) {
    try {
        // 参数验证
        args = args || {};
        var validation = validateParameters(args, GET_PROJECT_INFO_SCHEMA);
        if (!validation.isValid) {
            return JSON.stringify({
                status: "error",
                message: "Parameter validation failed",
                errors: validation.errors,
                schema: GET_PROJECT_INFO_SCHEMA
            }, null, 2);
        }
        
        // 使用验证后的参数
        var params = validation.normalizedArgs;
        
        var project = app.project;
        var result = {
            status: "success",
            project: {
                name: project.file ? project.file.name : "Untitled Project",
                path: project.file ? project.file.fsName : "",
                saved: project.file !== null,
                dirty: project.dirty,
                numItems: project.numItems,
                bitsPerChannel: project.bitsPerChannel,
                linearBlending: project.linearBlending,
                framesCountType: project.framesCountType,
                feetFramesFilmType: project.feetFramesFilmType,
                framesUseFeetFrames: project.framesUseFeetFrames,
                timeDisplayType: project.timeDisplayType
            }
        };
        
        // Add system and application info if requested
        if (params.includeSystemInfo) {
            result.system = {
                afterEffectsVersion: app.version,
                buildNumber: app.buildNumber,
                language: app.language,
                osName: system.osName,
                osVersion: system.osVersion,
                userName: system.userName,
                machineName: system.machineName,
                currentDate: new Date().toISOString()
            };
        }
        
        var countByType = {
            compositions: 0,
            footage: 0,
            folders: 0,
            solids: 0
        };
        
        var compositions = [];
        var items = [];
        
        var itemLimit = Math.min(project.numItems, params.maxItems);
        
        for (var i = 1; i <= itemLimit; i++) {
            var item = project.item(i);
            var itemType = "";
            var itemInfo = {
                id: item.id,
                name: item.name,
                index: i
            };
            
            if (item instanceof CompItem) {
                itemType = "Composition";
                countByType.compositions++;
                
                itemInfo.type = itemType;
                itemInfo.width = item.width;
                itemInfo.height = item.height;
                itemInfo.duration = item.duration;
                itemInfo.frameRate = item.frameRate;
                itemInfo.numLayers = item.numLayers;
                itemInfo.pixelAspect = item.pixelAspect;
                itemInfo.resolutionFactor = item.resolutionFactor;
                itemInfo.shutterAngle = item.shutterAngle;
                itemInfo.shutterPhase = item.shutterPhase;
                itemInfo.motionBlur = item.motionBlur;
                
                // Add composition to separate compositions array if requested
                if (params.includeCompositions) {
                    var compDetails = {
                        id: item.id,
                        name: item.name,
                        width: item.width,
                        height: item.height,
                        duration: item.duration,
                        frameRate: item.frameRate,
                        numLayers: item.numLayers,
                        pixelAspect: item.pixelAspect,
                        bgColor: item.bgColor,
                        layers: []
                    };
                    
                    // Add basic layer info for each composition
                    for (var j = 1; j <= Math.min(item.numLayers, 20); j++) {
                        var layer = item.layer(j);
                        compDetails.layers.push({
                            index: layer.index,
                            name: layer.name,
                            enabled: layer.enabled,
                            inPoint: layer.inPoint,
                            outPoint: layer.outPoint
                        });
                    }
                    
                    compositions.push(compDetails);
                }
                
            } else if (item instanceof FolderItem) {
                itemType = "Folder";
                countByType.folders++;
                itemInfo.type = itemType;
                itemInfo.numItems = item.numItems;
                
            } else if (item instanceof FootageItem) {
                if (item.mainSource instanceof SolidSource) {
                    itemType = "Solid";
                    countByType.solids++;
                    itemInfo.type = itemType;
                    itemInfo.width = item.width;
                    itemInfo.height = item.height;
                    itemInfo.color = item.mainSource.color;
                } else {
                    itemType = "Footage";
                    countByType.footage++;
                    itemInfo.type = itemType;
                    itemInfo.width = item.width || 0;
                    itemInfo.height = item.height || 0;
                    itemInfo.duration = item.duration || 0;
                    itemInfo.frameRate = item.frameRate || 0;
                    itemInfo.hasVideo = item.hasVideo;
                    itemInfo.hasAudio = item.hasAudio;
                    
                    // Add file source info
                    if (item.mainSource instanceof FileSource) {
                        itemInfo.file = {
                            path: item.mainSource.file.fsName,
                            name: item.mainSource.file.name,
                            exists: item.mainSource.file.exists
                        };
                    }
                }
            }
            
            if (params.includeItems) {
                items.push(itemInfo);
            }
        }
        
        result.project.itemCounts = countByType;
        
        // Add items list if requested
        if (params.includeItems) {
            result.items = items;
            result.itemsShown = itemLimit;
            result.totalItems = project.numItems;
        }
        
        // Add compositions details if requested
        if (params.includeCompositions && compositions.length > 0) {
            result.compositions = compositions;
        }
        
        return JSON.stringify(result, null, 2);
    } catch (error) {
        return JSON.stringify({
            status: "error",
            message: error.toString()
        }, null, 2);
    }
}

// ========== 测试函数 ==========
function testGetProjectInfo() {
    try {
        logAlert("开始测试 getProjectInfo 函数...");
        
        // 测试用例1: 获取基本项目信息
        var testArgs1 = {
            includeItems: false,
            includeCompositions: false
        };
        
        logAlert("测试基本项目信息获取...");
        var result1 = getProjectInfo(testArgs1);
        logAlert("基本信息测试结果:\n" + result1);
        
        // 测试用例2: 获取完整项目信息
        var testArgs2 = {
            includeItems: true,
            includeCompositions: true,
            maxItems: 50,
            maxCompositions: 10
        };
        
        logAlert("测试完整项目信息获取...");
        var result2 = getProjectInfo(testArgs2);
        logAlert("完整信息测试结果:\n" + result2);
        
        // 测试用例3: 获取项目信息和系统信息
        var testArgs3 = {
            includeItems: true,
            includeSystemInfo: true,
            maxItems: 25
        };
        
        logAlert("测试项目和系统信息获取...");
        var result3 = getProjectInfo(testArgs3);
        logAlert("系统信息测试结果:\n" + result3);
        
        // 测试用例4: 获取详细的元数据信息
        var testArgs4 = {
            includeItems: true,
            includeCompositions: true,
            includeFootage: true,
            includeMetadata: true,
            maxItems: 100
        };
        
        logAlert("测试详细元数据信息获取...");
        var result4 = getProjectInfo(testArgs4);
        logAlert("元数据测试结果:\n" + result4);
        
        logAlert("getProjectInfo 测试完成!");
        
    } catch (error) {
        logAlert("测试过程中发生错误: " + error.toString());
        return; // 停止执行后续代码
    }
}

// 调用测试函数
// 取消注释下面这行来运行测试
// testGetProjectInfo(); 
