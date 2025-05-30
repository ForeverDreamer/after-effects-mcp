// ========================================
// MCP网络动画素材创建脚本 - After Effects MCP优化版
// ========================================

// === 配置参数 ===
const projectConfig = {
    composition: {
      name: "MCP网络拓扑动画",
      width: 1920,
      height: 1080,
      duration: 15.0,
      frameRate: 30.0,
      preset: "HD_1080"
    },
    
    // API节点配置
    apiNodes: [
      {name: "支付API", service: "Payment", color: {r: 204, g: 76, b: 76}},
      {name: "地图API", service: "Maps", color: {r: 76, g: 204, b: 76}},
      {name: "用户认证", service: "Auth", color: {r: 76, g: 76, b: 204}},
      {name: "数据分析", service: "Analytics", color: {r: 204, g: 153, b: 51}},
      {name: "云存储", service: "Storage", color: {r: 153, g: 51, b: 204}},
      {name: "通知服务", service: "Notification", color: {r: 204, g: 204, b: 51}},
      {name: "搜索引擎", service: "Search", color: {r: 51, g: 204, b: 204}},
      {name: "社交登录", service: "Social", color: {r: 204, g: 51, b: 153}},
      {name: "邮件服务", service: "Email", color: {r: 127, g: 204, b: 76}},
      {name: "短信API", service: "SMS", color: {r: 204, g: 127, b: 76}},
      {name: "图像识别", service: "Vision", color: {r: 76, g: 127, b: 204}},
      {name: "语音转换", service: "Speech", color: {r: 178, g: 76, b: 178}}
    ],
    
    // 布局参数
    layout: {
      centerX: 960,
      centerY: 540,
      nodeRadius: 300,
      nodeSize: 60,
      mcpSize: 120
    }
  };
  
  // === 工具调用函数集 ===
  
  // 1. 创建合成
  async function createMainComposition() {
    console.log("🎬 步骤1: 创建主合成...");
    
    const createCompCommand = {
      tool: "create-composition",
      parameters: {
        name: projectConfig.composition.name,
        preset: projectConfig.composition.preset,
        duration: projectConfig.composition.duration,
        frameRate: projectConfig.composition.frameRate,
        backgroundColor: {r: 20, g: 20, b: 30}
      }
    };
    
    console.log("💡 请执行:", JSON.stringify(createCompCommand, null, 2));
    return createCompCommand;
  }
  
  // 2. 计算节点位置
  function calculateNodePositions() {
    const positions = [];
    const {centerX, centerY, nodeRadius} = projectConfig.layout;
    
    projectConfig.apiNodes.forEach((node, index) => {
      const angle = (index / projectConfig.apiNodes.length) * 2 * Math.PI;
      positions.push({
        x: centerX + nodeRadius * Math.cos(angle),
        y: centerY + nodeRadius * Math.sin(angle),
        node: node
      });
    });
    
    return positions;
  }
  
  // 3. 批量创建API节点
  async function createAPINodes() {
    console.log("🔴 步骤2: 创建API节点...");
    
    const positions = calculateNodePositions();
    const commands = [];
    
    positions.forEach((pos, index) => {
      // 创建圆形固体层作为节点
      const createSolidCommand = {
        tool: "create-solid-layer",
        parameters: {
          compIndex: 1,
          width: projectConfig.layout.nodeSize,
          height: projectConfig.layout.nodeSize,
          color: pos.node.color,
          name: `节点_${pos.node.service}`,
          position: [pos.x, pos.y]
        }
      };
      
      commands.push(createSolidCommand);
      
      // 为每个节点添加发光效果
      const glowEffectCommand = {
        tool: "apply-effect-template",
        parameters: {
          compIndex: 1,
          layerIndex: index + 1,
          templateName: "glow",
          customSettings: {
            glowColor: pos.node.color,
            glowRadius: 15,
            glowIntensity: 0.8
          }
        }
      };
      
      commands.push(glowEffectCommand);
    });
    
    commands.forEach((cmd, idx) => {
      console.log(`💡 命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
    });
    
    return commands;
  }
  
  // 4. 创建节点标签
  async function createNodeLabels() {
    console.log("🏷️ 步骤3: 创建节点标签...");
    
    const positions = calculateNodePositions();
    const commands = [];
    
    positions.forEach((pos, index) => {
      // 计算标签位置（稍微远离节点中心）
      const labelRadius = projectConfig.layout.nodeRadius + 60;
      const angle = (index / projectConfig.apiNodes.length) * 2 * Math.PI;
      const labelX = projectConfig.layout.centerX + labelRadius * Math.cos(angle);
      const labelY = projectConfig.layout.centerY + labelRadius * Math.sin(angle);
      
      const createTextCommand = {
        tool: "create-text-layer",
        parameters: {
          compIndex: 1,
          text: pos.node.name,
          fontSize: 16,
          color: {r: 220, g: 220, b: 220},
          position: [labelX, labelY],
          name: `标签_${pos.node.service}`
        }
      };
      
      commands.push(createTextCommand);
    });
    
    commands.forEach((cmd, idx) => {
      console.log(`💡 命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
    });
    
    return commands;
  }
  
  // 5. 创建MCP中央节点
  async function createMCPCenterNode() {
    console.log("⭐ 步骤4: 创建MCP中央节点...");
    
    const commands = [];
    
    // 创建MCP中央节点
    const createMCPCommand = {
      tool: "create-solid-layer",
      parameters: {
        compIndex: 1,
        width: projectConfig.layout.mcpSize,
        height: projectConfig.layout.mcpSize,
        color: {r: 255, g: 204, b: 51}, // 金色
        name: "MCP_中央节点",
        position: [projectConfig.layout.centerX, projectConfig.layout.centerY]
      }
    };
    
    commands.push(createMCPCommand);
    
    // 添加强烈的发光效果
    const mcpGlowCommand = {
      tool: "apply-effect-template",
      parameters: {
        compIndex: 1,
        layerIndex: 1, // 假设MCP节点是第一个创建的
        templateName: "glow",
        customSettings: {
          glowColor: {r: 255, g: 204, b: 51},
          glowRadius: 40,
          glowIntensity: 2.0
        }
      }
    };
    
    commands.push(mcpGlowCommand);
    
    // 添加MCP标签
    const mcpLabelCommand = {
      tool: "create-text-layer",
      parameters: {
        compIndex: 1,
        text: "MCP统一管理中心",
        fontSize: 20,
        color: {r: 255, g: 255, b: 255},
        position: [projectConfig.layout.centerX, projectConfig.layout.centerY + 80],
        name: "MCP_标签"
      }
    };
    
    commands.push(mcpLabelCommand);
    
    commands.forEach((cmd, idx) => {
      console.log(`💡 命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
    });
    
    return commands;
  }
  
  // 6. 添加动画关键帧
  async function addAnimationKeyframes() {
    console.log("🎭 步骤5: 添加动画关键帧...");
    
    const commands = [];
    
    // MCP节点入场动画
    const mcpScaleInCommand = {
      tool: "set-layer-keyframe",
      parameters: {
        compIndex: 1,
        layerIndex: 1, // MCP节点
        propertyName: "Scale",
        timeInSeconds: 0,
        value: [0, 0],
        easing: "ease-out"
      }
    };
    
    const mcpScaleFullCommand = {
      tool: "set-layer-keyframe",
      parameters: {
        compIndex: 1,
        layerIndex: 1,
        propertyName: "Scale",
        timeInSeconds: 1.0,
        value: [100, 100],
        easing: "ease-out"
      }
    };
    
    commands.push(mcpScaleInCommand, mcpScaleFullCommand);
    
    // API节点依次出现动画
    for(let i = 0; i < projectConfig.apiNodes.length; i++) {
      const startTime = 1.5 + (i * 0.2); // 错开0.2秒
      
      const nodeScaleInCommand = {
        tool: "set-layer-keyframe",
        parameters: {
          compIndex: 1,
          layerIndex: i + 2, // API节点从第2层开始
          propertyName: "Scale",
          timeInSeconds: startTime,
          value: [0, 0]
        }
      };
      
      const nodeScaleFullCommand = {
        tool: "set-layer-keyframe",
        parameters: {
          compIndex: 1,
          layerIndex: i + 2,
          propertyName: "Scale",
          timeInSeconds: startTime + 0.5,
          value: [100, 100],
          easing: "ease-out"
        }
      };
      
      commands.push(nodeScaleInCommand, nodeScaleFullCommand);
    }
    
    commands.forEach((cmd, idx) => {
      console.log(`💡 命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
    });
    
    return commands;
  }
  
  // 7. 添加旋转表达式
  async function addRotationExpressions() {
    console.log("🔄 步骤6: 添加旋转表达式...");
    
    const commands = [];
    
    // MCP节点缓慢旋转
    const mcpRotationExpression = {
      tool: "set-layer-expression",
      parameters: {
        compIndex: 1,
        layerIndex: 1,
        propertyName: "Rotation",
        expressionString: "time * 10" // 每秒10度
      }
    };
    
    commands.push(mcpRotationExpression);
    
    // API节点轻微摆动
    for(let i = 0; i < projectConfig.apiNodes.length; i++) {
      const oscillationExpression = {
        tool: "set-layer-expression",
        parameters: {
          compIndex: 1,
          layerIndex: i + 2,
          propertyName: "Rotation",
          expressionString: `Math.sin(time * 2 + ${i}) * 5` // 每个节点不同相位的摆动
        }
      };
      
      commands.push(oscillationExpression);
    }
    
    commands.forEach((cmd, idx) => {
      console.log(`💡 命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
    });
    
    return commands;
  }
  
  // === 执行序列控制 ===
  
  async function executeCreationSequence() {
    console.log("🚀 开始执行MCP网络动画创建序列...\n");
    
    try {
      // 步骤1: 创建合成
      await createMainComposition();
      console.log("✅ 合成创建命令已生成\n");
      
      // 步骤2: 创建API节点
      await createAPINodes();
      console.log("✅ API节点创建命令已生成\n");
      
      // 步骤3: 创建标签
      await createNodeLabels();
      console.log("✅ 标签创建命令已生成\n");
      
      // 步骤4: 创建MCP中央节点
      await createMCPCenterNode();
      console.log("✅ MCP中央节点创建命令已生成\n");
      
      // 步骤5: 添加动画
      await addAnimationKeyframes();
      console.log("✅ 动画关键帧命令已生成\n");
      
      // 步骤6: 添加表达式
      await addRotationExpressions();
      console.log("✅ 旋转表达式命令已生成\n");
      
      console.log("🎉 所有命令已生成完成！");
      console.log("📋 请按顺序在Claude中执行上述工具调用命令");
      
    } catch (error) {
      console.error("❌ 执行过程中出现错误:", error);
    }
  }
  
  // === 质量检查和验证 ===
  
  const qualityChecklist = {
    preExecution: [
      "After Effects 已启动",
      "MCP Bridge Auto 面板已打开",
      "项目工作区已清理"
    ],
    
    postExecution: [
      "合成已创建且命名正确",
      "12个API节点位置分布均匀",
      "节点颜色区分明显",
      "MCP中央节点居中显示",
      "标签文字清晰可读",
      "发光效果应用正确",
      "动画时序合理流畅",
      "表达式运行无错误"
    ]
  };
  
  // === 使用说明 ===
  
  console.log(`
  === MCP网络动画创建指南 ===
  
  📋 执行前检查:
  ${qualityChecklist.preExecution.map((item, i) => `${i + 1}. [ ] ${item}`).join('\n')}
  
  🔧 执行方式:
  1. 运行 executeCreationSequence() 查看所有命令
  2. 复制每个 JSON 命令到 Claude 中执行
  3. 在每个步骤后检查 After Effects 中的结果
  4. 如有错误，使用 get-results 工具查看详细信息
  
  ✅ 执行后验证:
  ${qualityChecklist.postExecution.map((item, i) => `${i + 1}. [ ] ${item}`).join('\n')}
  
  ⚠️ 注意事项:
  - 确保按顺序执行命令
  - 每次执行后等待 AE 完成处理
  - 如遇错误，检查图层索引是否正确
  - 可根据需要调整颜色和位置参数
  
  🎯 扩展功能:
  - 可添加连接线动画
  - 可增加数据流效果
  - 可加入声音同步
  - 可导出为视频模板
  `);
  
  // 启动执行序列
  executeCreationSequence();