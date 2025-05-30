// === 核心素材需求清单 ===
const assetRequirements = {
  // 1. 网络节点素材（12个API服务 + 1个MCP中心）
  networkNodes: {
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
    mcpCenterNode: {
      name: "MCP统一管理中心",
      size: [120, 120],
      color: [1.0, 0.8, 0.2], // 金色
      glowEffect: true
    }
  },
  
  // 2. 连接线网络素材
  connectionNetworks: {
    chaoticConnections: {
      type: "point-to-point",
      style: "random-bezier",
      strokeWidth: 2,
      color: [0.5, 0.5, 0.5],
      opacity: 0.7
    },
    unifiedConnections: {
      type: "star-radial", 
      style: "straight-lines",
      strokeWidth: 3,
      color: [0.2, 0.6, 1.0],
      gradient: true
    }
  },
  
  // 3. 数据图表素材
  dataCharts: {
    developmentCostChart: {
      type: "bar-chart",
      data: [120, 80, 160, 200], // 小时数
      labels: ["新API接入", "错误排查", "版本升级", "性能优化"],
      colors: [0.8, 0.2, 0.2]
    },
    failureRateIndicator: {
      type: "real-time-counter",
      maxValues: [23, 4.5, 94.2],
      labels: ["月均故障", "修复时间", "可用率"]
    },
    comparisonChart: {
      type: "horizontal-comparison",
      metrics: ["开发时间", "维护成本", "故障率", "响应时间"],
      improvements: [70, 75, 85, 40] // 改善百分比
    }
  }
};

// === MCP批量创建脚本 ===

// 步骤1: 批量创建API节点
function createAPINodes() {
  const nodeCreationCommands = assetRequirements.networkNodes.apiNodes.map((node, index) => {
    // 计算圆形分布位置
    const angle = (index / 12) * 2 * Math.PI;
    const radius = 300;
    const centerX = 960, centerY = 540;
    
    return {
      command: "createShapeLayer",
      parameters: {
        compName: "2_API现状展示",
        shapeType: "ellipse",
        size: [60, 60],
        position: [
          centerX + radius * Math.cos(angle),
          centerY + radius * Math.sin(angle)
        ],
        fillColor: node.color,
        strokeColor: [1, 1, 1],
        strokeWidth: 2,
        name: `API节点_${node.service}_${index + 1}`
      }
    };
  });
  
  return nodeCreationCommands;
}