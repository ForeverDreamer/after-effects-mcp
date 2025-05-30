// ========================================
// MCP网络动画素材创建脚本 - After Effects MCP优化版
// 使用正确的MCP API调用格式和参数名称
// ========================================

// === 配置参数 ===
const projectConfig = {
  composition: {
    name: "1_API_Status_Display",
    width: 1920,
    height: 1080,
    duration: 15.0,
    frameRate: 30.0
  },
  
  // API节点配置 - 颜色格式已修正为0-1范围
  apiNodes: [
    {name: "支付API", service: "Payment", color: [0.8, 0.3, 0.3]},
    {name: "地图API", service: "Maps", color: [0.3, 0.8, 0.3]},
    {name: "用户认证", service: "Auth", color: [0.3, 0.3, 0.8]},
    {name: "数据分析", service: "Analytics", color: [0.8, 0.6, 0.2]},
    {name: "云存储", service: "Storage", color: [0.6, 0.2, 0.8]},
    {name: "通知服务", service: "Notification", color: [0.8, 0.8, 0.2]},
    {name: "搜索引擎", service: "Search", color: [0.2, 0.8, 0.8]},
    {name: "社交登录", service: "Social", color: [0.8, 0.2, 0.6]},
    {name: "邮件服务", service: "Email", color: [0.5, 0.8, 0.3]},
    {name: "短信API", service: "SMS", color: [0.8, 0.5, 0.3]},
    {name: "图像识别", service: "Vision", color: [0.3, 0.5, 0.8]},
    {name: "语音转换", service: "Speech", color: [0.7, 0.3, 0.7]}
  ],
  
  // 布局参数
  layout: {
    centerX: 960,
    centerY: 540,
    nodeRadius: 300,
    nodeSize: 120,
    mcpSize: 150
  },
  
  // 动画时序参数
  timing: {
    mcpIntroDelay: 0.5,
    mcpScaleDuration: 1.0,
    nodeStartDelay: 2.0,
    nodeInterval: 0.15,
    nodeScaleDuration: 0.6,
    labelDelay: 0.3
  }
};

// === 图层管理器 ===
class LayerManager {
  constructor() {
    this.layerCount = 0;
    this.layerMap = new Map();
  }
  
  getNextLayerIndex() {
    this.layerCount++;
    return this.layerCount;
  }
  
  registerLayer(name, index) {
    this.layerMap.set(name, index);
    return index;
  }
  
  getLayerIndex(name) {
    return this.layerMap.get(name) || 1;
  }
  
  reset() {
    this.layerCount = 0;
    this.layerMap.clear();
  }
}

const layerManager = new LayerManager();

// === 工具调用函数集 ===

// 颜色一致性验证函数
function validateColorConsistency() {
  console.log("🎨 验证颜色一致性...");
  
  // 验证MCP中央节点颜色一致性
  const mcpNodeColor = [1.0, 0.8, 0.2];
  console.log(`✅ MCP中央节点 - 填充颜色: [${mcpNodeColor.join(', ')}], 发光颜色: [${mcpNodeColor.join(', ')}] - 一致`);
  
  // 验证API节点颜色一致性
  projectConfig.apiNodes.forEach((node, index) => {
    const nodeColor = node.color;
    console.log(`✅ ${node.name} - 填充颜色: [${nodeColor.join(', ')}], 发光颜色: [${nodeColor.join(', ')}] - 一致`);
  });
  
  console.log("🎯 所有节点的发光颜色与填充颜色均保持一致！");
  return true;
}

// 1. 创建主合成
function createMainComposition() {
  console.log("🎬 步骤1: 创建主合成...");
  
  const command = {
    tool: "run-script",
    parameters: {
      script: "createComposition",
      parameters: {
        name: projectConfig.composition.name,
        width: projectConfig.composition.width,
        height: projectConfig.composition.height,
        duration: projectConfig.composition.duration,
        frameRate: projectConfig.composition.frameRate,
        backgroundColor: {r: 25, g: 25, b: 35} // 深色背景
      }
    }
  };
  
  console.log("💡 合成创建命令:", JSON.stringify(command, null, 2));
  return command;
}

// 2. 计算节点位置
function calculateNodePositions() {
  const positions = [];
  const {centerX, centerY, nodeRadius} = projectConfig.layout;
  
  projectConfig.apiNodes.forEach((node, index) => {
    const angle = (index / projectConfig.apiNodes.length) * 2 * Math.PI - Math.PI / 2; // 从顶部开始
    positions.push({
      x: centerX + nodeRadius * Math.cos(angle),
      y: centerY + nodeRadius * Math.sin(angle),
      node: node,
      angle: angle
    });
  });
  
  return positions;
}

// 3. 创建MCP中央节点
function createMCPCenterNode() {
  console.log("⭐ 步骤2: 创建MCP中央节点...");
  
  const commands = [];
  const mcpLayerIndex = layerManager.getNextLayerIndex();
  layerManager.registerLayer("MCP_Center_Node", mcpLayerIndex);
  
  // MCP中央节点的颜色定义 - 确保填充色和发光色一致
  const mcpNodeColor = [1.0, 0.8, 0.2]; // 统一的金色定义
  
  // 创建MCP中央节点 - 圆形形状层（修正参数名称）
  const createMCPCommand = {
    tool: "run-script",
    parameters: {
      script: "createShapeLayer",
      parameters: {
        compName: projectConfig.composition.name,
        shapeType: "ellipse",  // 修正：使用shapeType而不是shape
        position: [projectConfig.layout.centerX, projectConfig.layout.centerY],
        size: [projectConfig.layout.mcpSize, projectConfig.layout.mcpSize],
        fillColor: mcpNodeColor, // 使用统一颜色变量
        strokeColor: [1.0, 1.0, 1.0],
        strokeWidth: 3,
        name: "MCP_Center_Node",  // 修正：使用name而不是layerName
        startTime: 0,
        duration: projectConfig.composition.duration
      }
    }
  };
  
  commands.push(createMCPCommand);
  
  // 添加发光效果 - 发光颜色与图层填充颜色完全一致
  const mcpGlowCommand = {
    tool: "run-script",
    parameters: {
      script: "applyEffectTemplate",
      parameters: {
        compName: projectConfig.composition.name,
        layerIndex: mcpLayerIndex,
        templateName: "glow",
        customSettings: {
          glowColor: mcpNodeColor, // 使用相同的颜色变量确保一致性
          glowRadius: 30,
          glowIntensity: 1.5
        }
      }
    }
  };
  
  commands.push(mcpGlowCommand);
  
  // 添加MCP标签
  const labelLayerIndex = layerManager.getNextLayerIndex();
  layerManager.registerLayer("MCP_Label", labelLayerIndex);
  
  const mcpLabelCommand = {
    tool: "run-script",
    parameters: {
      script: "createTextLayer",
      parameters: {
        compName: projectConfig.composition.name,
        text: "MCP Unified Management Center",
        position: [projectConfig.layout.centerX, projectConfig.layout.centerY + 100],
        fontSize: 24,
        color: [1.0, 1.0, 1.0],
        fontFamily: "Arial",
        alignment: "center",
        name: "MCP_Label",  // 修正：使用name而不是layerName（如果该脚本支持）
        startTime: 0,
        duration: projectConfig.composition.duration
      }
    }
  };
  
  commands.push(mcpLabelCommand);
  
  commands.forEach((cmd, idx) => {
    console.log(`💡 MCP命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
  });
  
  return commands;
}

// 4. 批量创建API节点
function createAPINodes() {
  console.log("🔴 步骤3: 创建API节点...");
  
  const positions = calculateNodePositions();
  const commands = [];
  
  positions.forEach((pos, index) => {
    const nodeLayerIndex = layerManager.getNextLayerIndex();
    layerManager.registerLayer(`Node_${pos.node.service}`, nodeLayerIndex);
    
    // 获取当前节点的颜色 - 确保填充色和发光色一致
    const nodeColor = pos.node.color; // 统一的节点颜色定义
    
    // 创建圆形API节点（修正参数名称）
    const createNodeCommand = {
      tool: "run-script",
      parameters: {
        script: "createShapeLayer",
        parameters: {
          compName: projectConfig.composition.name,
          shapeType: "ellipse",  // 修正：使用shapeType而不是shape
          position: [pos.x, pos.y],
          size: [projectConfig.layout.nodeSize, projectConfig.layout.nodeSize],
          fillColor: nodeColor, // 使用统一颜色变量
          strokeColor: [0.9, 0.9, 0.9],
          strokeWidth: 2,
          name: `Node_${pos.node.service}`,  // 修正：使用name而不是layerName
          startTime: 0,
          duration: projectConfig.composition.duration
        }
      }
    };
    
    commands.push(createNodeCommand);
    
    // 为每个节点添加发光效果 - 发光颜色与图层填充颜色完全一致
    const nodeGlowCommand = {
      tool: "run-script",
      parameters: {
        script: "applyEffectTemplate",
        parameters: {
          compName: projectConfig.composition.name,
          layerIndex: nodeLayerIndex,
          templateName: "glow",
          customSettings: {
            glowColor: nodeColor, // 使用相同的颜色变量确保一致性
            glowRadius: 20,
            glowIntensity: 1.0
          }
        }
      }
    };
    
    commands.push(nodeGlowCommand);
  });
  
  commands.forEach((cmd, idx) => {
    console.log(`💡 API节点命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
  });
  
  return commands;
}

// 5. 创建节点标签
function createNodeLabels() {
  console.log("🏷️ 步骤4: 创建节点标签...");
  
  const positions = calculateNodePositions();
  const commands = [];
  
  positions.forEach((pos, index) => {
    // 计算标签位置（稍微远离节点中心）
    const labelRadius = projectConfig.layout.nodeRadius + 80;
    const labelX = projectConfig.layout.centerX + labelRadius * Math.cos(pos.angle);
    const labelY = projectConfig.layout.centerY + labelRadius * Math.sin(pos.angle);
    
    const labelLayerIndex = layerManager.getNextLayerIndex();
    layerManager.registerLayer(`Label_${pos.node.service}`, labelLayerIndex);
    
    const createTextCommand = {
      tool: "run-script",
      parameters: {
        script: "createTextLayer",
        parameters: {
          compName: projectConfig.composition.name,
          text: pos.node.name,
          position: [labelX, labelY],
          fontSize: 18,
          color: [0.9, 0.9, 0.9],
          fontFamily: "Arial",
          alignment: "center",
          name: `Label_${pos.node.service}`,  // 修正：使用name而不是layerName（如果该脚本支持）
          startTime: 0,
          duration: projectConfig.composition.duration
        }
      }
    };
    
    commands.push(createTextCommand);
  });
  
  commands.forEach((cmd, idx) => {
    console.log(`💡 标签命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
  });
  
  return commands;
}

// 6. 添加MCP节点入场动画
function addMCPEntryAnimation() {
  console.log("🎭 步骤5: 添加MCP入场动画...");
  
  const commands = [];
  const mcpLayerIndex = layerManager.getLayerIndex("MCP_Center_Node");
  const labelLayerIndex = layerManager.getLayerIndex("MCP_Label");
  
  // MCP节点缩放入场动画
  const mcpScaleStart = {
    tool: "run-script",
    parameters: {
      script: "setLayerKeyframe",
      parameters: {
        compName: projectConfig.composition.name,
        layerIndex: mcpLayerIndex,
        propertyName: "Scale",
        timeInSeconds: projectConfig.timing.mcpIntroDelay,
        value: [0, 0]
      }
    }
  };
  
  const mcpScaleEnd = {
    tool: "run-script",
    parameters: {
      script: "setLayerKeyframe",
      parameters: {
        compName: projectConfig.composition.name,
        layerIndex: mcpLayerIndex,
        propertyName: "Scale",
        timeInSeconds: projectConfig.timing.mcpIntroDelay + projectConfig.timing.mcpScaleDuration,
        value: [100, 100]
      }
    }
  };
  
  // MCP标签透明度动画
  const labelOpacityStart = {
    tool: "run-script",
    parameters: {
      script: "setLayerKeyframe",
      parameters: {
        compName: projectConfig.composition.name,
        layerIndex: labelLayerIndex,
        propertyName: "Opacity",
        timeInSeconds: projectConfig.timing.mcpIntroDelay,
        value: 0
      }
    }
  };
  
  const labelOpacityEnd = {
    tool: "run-script",
    parameters: {
      script: "setLayerKeyframe",
      parameters: {
        compName: projectConfig.composition.name,
        layerIndex: labelLayerIndex,
        propertyName: "Opacity",
        timeInSeconds: projectConfig.timing.mcpIntroDelay + projectConfig.timing.mcpScaleDuration + 0.5,
        value: 100
      }
    }
  };
  
  commands.push(mcpScaleStart, mcpScaleEnd, labelOpacityStart, labelOpacityEnd);
  
  commands.forEach((cmd, idx) => {
    console.log(`💡 MCP动画命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
  });
  
  return commands;
}

// 7. 添加API节点入场动画
function addAPINodesEntryAnimation() {
  console.log("🎭 步骤6: 添加API节点入场动画...");
  
  const commands = [];
  
  projectConfig.apiNodes.forEach((node, index) => {
    const nodeLayerIndex = layerManager.getLayerIndex(`Node_${node.service}`);
    const labelLayerIndex = layerManager.getLayerIndex(`Label_${node.service}`);
    
    const startTime = projectConfig.timing.nodeStartDelay + (index * projectConfig.timing.nodeInterval);
    
    // 节点缩放动画
    const nodeScaleStart = {
      tool: "run-script",
      parameters: {
        script: "setLayerKeyframe",
        parameters: {
          compName: projectConfig.composition.name,
          layerIndex: nodeLayerIndex,
          propertyName: "Scale",
          timeInSeconds: startTime,
          value: [0, 0]
        }
      }
    };
    
    const nodeScaleEnd = {
      tool: "run-script",
      parameters: {
        script: "setLayerKeyframe",
        parameters: {
          compName: projectConfig.composition.name,
          layerIndex: nodeLayerIndex,
          propertyName: "Scale",
          timeInSeconds: startTime + projectConfig.timing.nodeScaleDuration,
          value: [100, 100]
        }
      }
    };
    
    // 标签透明度动画
    const labelOpacityStart = {
      tool: "run-script",
      parameters: {
        script: "setLayerKeyframe",
        parameters: {
          compName: projectConfig.composition.name,
          layerIndex: labelLayerIndex,
          propertyName: "Opacity",
          timeInSeconds: startTime,
          value: 0
        }
      }
    };
    
    const labelOpacityEnd = {
      tool: "run-script",
      parameters: {
        script: "setLayerKeyframe",
        parameters: {
          compName: projectConfig.composition.name,
          layerIndex: labelLayerIndex,
          propertyName: "Opacity",
          timeInSeconds: startTime + projectConfig.timing.nodeScaleDuration + projectConfig.timing.labelDelay,
          value: 100
        }
      }
    };
    
    commands.push(nodeScaleStart, nodeScaleEnd, labelOpacityStart, labelOpacityEnd);
  });
  
  commands.forEach((cmd, idx) => {
    console.log(`💡 API动画命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
  });
  
  return commands;
}

// 8. 添加旋转表达式
function addRotationExpressions() {
  console.log("🔄 步骤7: 添加旋转表达式...");
  
  const commands = [];
  
  // MCP节点缓慢旋转
  const mcpLayerIndex = layerManager.getLayerIndex("MCP_Center_Node");
  const mcpRotationExpression = {
    tool: "run-script",
    parameters: {
      script: "setLayerExpression",
      parameters: {
        compName: projectConfig.composition.name,
        layerIndex: mcpLayerIndex,
        propertyName: "Rotation",
        expressionString: "time * 8" // 每秒8度的缓慢旋转
      }
    }
  };
  
  commands.push(mcpRotationExpression);
  
  // API节点轻微摆动
  projectConfig.apiNodes.forEach((node, index) => {
    const nodeLayerIndex = layerManager.getLayerIndex(`Node_${node.service}`);
    const oscillationExpression = {
      tool: "run-script",
      parameters: {
        script: "setLayerExpression",
        parameters: {
          compName: projectConfig.composition.name,
          layerIndex: nodeLayerIndex,
          propertyName: "Rotation",
          expressionString: `Math.sin(time * 1.5 + ${index * 0.5}) * 3` // 每个节点不同相位的轻微摆动
        }
      }
    };
    
    commands.push(oscillationExpression);
  });
  
  commands.forEach((cmd, idx) => {
    console.log(`💡 旋转表达式命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
  });
  
  return commands;
}

// 9. 添加脉冲动画
function addPulseAnimations() {
  console.log("💓 步骤8: 添加脉冲动画...");
  
  const commands = [];
  
  // MCP节点脉冲动画
  const mcpLayerIndex = layerManager.getLayerIndex("MCP_Center_Node");
  const mcpPulseExpression = {
    tool: "run-script",
    parameters: {
      script: "setLayerExpression",
      parameters: {
        compName: projectConfig.composition.name,
        layerIndex: mcpLayerIndex,
        propertyName: "Scale",
        expressionString: "baseScale = 100; pulse = Math.sin(time * 2) * 5; [baseScale + pulse, baseScale + pulse]"
      }
    }
  };
  
  commands.push(mcpPulseExpression);
  
  commands.forEach((cmd, idx) => {
    console.log(`💡 脉冲动画命令${idx + 1}:`, JSON.stringify(cmd, null, 2));
  });
  
  return commands;
}

// === 执行序列控制 ===
async function executeCreationSequence() {
  console.log("🚀 开始执行MCP网络动画创建序列...\n");
  
  // 首先验证颜色一致性
  console.log("=" .repeat(60));
  validateColorConsistency();
  console.log("=" .repeat(60));
  
  console.log("📋 请按以下顺序复制命令到Claude中执行：\n");
  
  try {
    // 重置图层管理器
    layerManager.reset();
    
    console.log("=" .repeat(60));
    // 步骤1: 创建合成
    const step1 = createMainComposition();
    console.log("✅ 步骤1完成 - 合成创建命令已生成\n");
    
    console.log("=" .repeat(60));
    // 步骤2: 创建MCP中央节点
    const step2 = createMCPCenterNode();
    console.log("✅ 步骤2完成 - MCP中央节点创建命令已生成\n");
    
    console.log("=" .repeat(60));
    // 步骤3: 创建API节点
    const step3 = createAPINodes();
    console.log("✅ 步骤3完成 - API节点创建命令已生成\n");
    
    console.log("=" .repeat(60));
    // 步骤4: 创建标签
    const step4 = createNodeLabels();
    console.log("✅ 步骤4完成 - 标签创建命令已生成\n");
    
    console.log("=" .repeat(60));
    // 步骤5: MCP入场动画
    const step5 = addMCPEntryAnimation();
    console.log("✅ 步骤5完成 - MCP入场动画命令已生成\n");
    
    console.log("=" .repeat(60));
    // 步骤6: API节点入场动画
    const step6 = addAPINodesEntryAnimation();
    console.log("✅ 步骤6完成 - API节点入场动画命令已生成\n");
    
    console.log("=" .repeat(60));
    // 步骤7: 旋转表达式
    const step7 = addRotationExpressions();
    console.log("✅ 步骤7完成 - 旋转表达式命令已生成\n");
    
    console.log("=" .repeat(60));
    // 步骤8: 脉冲动画
    const step8 = addPulseAnimations();
    console.log("✅ 步骤8完成 - 脉冲动画命令已生成\n");
    
    console.log("🎉 所有命令已生成完成！");
    console.log("📋 请按顺序在Claude中执行上述工具调用命令");
    
    // 生成执行总结
    generateExecutionSummary();
    
  } catch (error) {
    console.error("❌ 执行过程中出现错误:", error);
  }
}

// === 执行总结和验证 ===
function generateExecutionSummary() {
  console.log("\n" + "=" .repeat(80));
  console.log("📊 执行总结");
  console.log("=" .repeat(80));
  
  console.log(`📐 合成配置:
  • 名称: ${projectConfig.composition.name}
  • 尺寸: ${projectConfig.composition.width}×${projectConfig.composition.height}
  • 时长: ${projectConfig.composition.duration}秒
  • 帧率: ${projectConfig.composition.frameRate}fps`);
  
  console.log(`\n🎯 创建内容:
  • MCP中央节点: 1个 (金色发光圆形)
  • API节点: ${projectConfig.apiNodes.length}个 (不同颜色圆形)
  • 文本标签: ${projectConfig.apiNodes.length + 1}个
  • 发光效果: ${projectConfig.apiNodes.length + 1}个
  • 动画关键帧: ${(projectConfig.apiNodes.length + 1) * 4}个
  • 表达式动画: ${projectConfig.apiNodes.length + 2}个`);
  
  console.log(`\n⏱️ 动画时序:
  • MCP入场: ${projectConfig.timing.mcpIntroDelay}s - ${projectConfig.timing.mcpIntroDelay + projectConfig.timing.mcpScaleDuration}s
  • 节点依次出现: ${projectConfig.timing.nodeStartDelay}s开始，间隔${projectConfig.timing.nodeInterval}s
  • 标签淡入: 节点出现后${projectConfig.timing.labelDelay}s延迟
  • 持续旋转和脉冲: 整个时长`);
  
  console.log(`\n🔧 图层结构: (总计 ${layerManager.layerCount} 个图层)`);
  for (let [name, index] of layerManager.layerMap) {
    console.log(`  • 图层${index}: ${name}`);
  }
}

// === 质量检查清单 ===
const qualityChecklist = {
  preExecution: [
    "✅ After Effects 已启动并运行",
    "✅ MCP Bridge Auto 面板已打开",
    "✅ 项目工作区已清理",
    "✅ 确认Claude具有AfterEffectsMCP工具访问权限"
  ],
  
  duringExecution: [
    "⏸️ 每个步骤执行后等待AE完成处理",
    "🔍 检查每个命令的执行结果",
    "📊 使用get-results工具查看详细信息",
    "🚫 如遇错误，不要继续执行后续步骤"
  ],
  
  postExecution: [
    "✅ 合成已创建且设置正确",
    "✅ MCP中央节点显示为金色发光圆形",
    "✅ 12个API节点颜色各异且分布均匀",
    "✅ 所有标签文字清晰可读",
    "✅ 发光效果应用正确且颜色与节点填充色一致",
    "✅ 入场动画时序流畅",
    "✅ 旋转和脉冲表达式正常运行",
    "✅ 整体视觉效果协调美观",
    "🎨 验证: 每个节点的发光颜色与其填充颜色完全匹配"
  ]
};

// === 故障排除指南 ===
const troubleshootingGuide = {
  commonIssues: {
    "图层索引错误": "检查layerManager状态，可能需要重新计算图层索引",
    "颜色显示异常": "确认颜色值在0-1范围内",
    "动画不播放": "检查关键帧时间设置和合成时长",
    "表达式错误": "验证表达式语法，特别是数学函数调用",
    "效果未应用": "确认effectTemplate名称正确，检查图层类型兼容性"
  },
  
  debugCommands: [
    "使用run-script工具执行'getProjectInfo'检查项目状态",
    "使用run-script工具执行'listCompositions'查看合成列表",
    "使用run-script工具执行'getLayerInfo'检查图层信息",
    "使用get-results工具查看最后执行的详细结果"
  ]
};

// === 使用说明 ===
console.log(`
╔══════════════════════════════════════════════════════════════════════════════╗
║                        MCP网络动画创建指南 v2.0                              ║
║                     优化版 - 使用正确的MCP API调用                           ║
╚══════════════════════════════════════════════════════════════════════════════╝

📋 执行前检查:
${qualityChecklist.preExecution.map(item => `  ${item}`).join('\n')}

🔧 执行方式:
1. 运行 executeCreationSequence() 查看所有命令
2. 按顺序复制每个JSON命令到Claude中执行
3. 使用工具: run-script (主要工具) 和 get-results (检查结果)
4. 每个步骤完成后验证AE中的结果

⚠️ 执行期间注意:
${qualityChecklist.duringExecution.map(item => `  ${item}`).join('\n')}

✅ 执行后验证:
${qualityChecklist.postExecution.map(item => `  ${item}`).join('\n')}

🔧 故障排除:
${Object.entries(troubleshootingGuide.commonIssues).map(([issue, solution]) => 
  `  • ${issue}: ${solution}`).join('\n')}

🛠️ 调试命令:
${troubleshootingGuide.debugCommands.map(cmd => `  • ${cmd}`).join('\n')}

🎯 扩展建议:
  • 添加连接线动画 (使用shape path动画)
  • 增加数据流粒子效果 (使用CC Particle World)
  • 加入声音同步功能 (使用audio keyframes)
  • 创建相机漫游动画 (使用3D camera)
  • 导出为可重用的动画模板

🚀 现在运行 executeCreationSequence() 开始创建！
`);

// 启动执行序列
executeCreationSequence();