// 按照最佳实践循环打印所有items的信息
function printAllProjectItems() {
    try {
        var project = app.project;
        
        // 检查项目是否存在
        if (!project) {
            $.writeln("错误: 没有活动的项目");
            return;
        }
        
        var totalItems = project.numItems;
        $.writeln("=== 项目信息概览 ===");
        $.writeln("项目名称: " + (project.file ? project.file.name : "未保存的项目"));
        $.writeln("总项目数: " + totalItems);
        $.writeln("========================");
        
        // 如果没有项目，退出
        if (totalItems === 0) {
            $.writeln("项目中没有任何项目");
            return;
        }
        
        // 循环遍历所有项目 (After Effects索引从1开始)
        for (var i = 1; i <= totalItems; i++) {
            var item = project.item(i);
            
            if (item) {
                $.writeln("\n--- 项目 " + i + " ---");
                $.writeln("名称: " + item.name);
                $.writeln("类型: " + item.typeName);
                
                // 根据不同类型输出特定信息
                if (item instanceof CompItem) {
                    // 合成项目
                    $.writeln("分辨率: " + item.width + " x " + item.height);
                    $.writeln("时长: " + item.duration + " 秒");
                    $.writeln("帧率: " + item.frameRate + " fps");
                    $.writeln("图层数: " + item.numLayers);
                    $.writeln("渲染队列: " + (item.renderQueueItem ? "已添加" : "未添加"));
                    
                } else if (item instanceof FootageItem) {
                    // 素材项目
                    $.writeln("文件路径: " + (item.file ? item.file.fsName : "缺失文件"));
                    
                    if (item.mainSource) {
                        $.writeln("分辨率: " + item.width + " x " + item.height);
                        if (item.duration > 0) {
                            $.writeln("时长: " + item.duration + " 秒");
                        }
                        $.writeln("帧率: " + item.frameRate + " fps");
                    }
                    
                    $.writeln("文件大小: " + (item.file && item.file.length ? 
                        (item.file.length / 1024 / 1024).toFixed(2) + " MB" : "未知"));
                    
                } else if (item instanceof FolderItem) {
                    // 文件夹项目
                    $.writeln("子项目数: " + item.numItems);
                    
                } else {
                    // 其他类型
                    $.writeln("ID: " + item.id);
                }
                
                // 通用属性
                $.writeln("使用次数: " + item.usedIn.length);
                $.writeln("注释: " + (item.comment || "无"));
                $.writeln("标签: " + item.label);
            } else {
                $.writeln("警告: 项目 " + i + " 无法访问");
            }
        }
        
        $.writeln("\n=== 循环完成 ===");
        
    } catch (error) {
        $.writeln("错误: " + error.toString());
        $.writeln("错误行号: " + (error.line || "未知"));
    }
}

// 执行函数
printAllProjectItems();