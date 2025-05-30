# AE MCP环境配置检查脚本

echo "=== After Effects MCP环境配置检查 ==="

# 检查After Effects版本
echo "1. 检查After Effects版本..."
# 需要2024或更高版本支持MCP Server
if [ -d "/Applications/Adobe After Effects 2024" ]; then
    echo "✓ After Effects 2024 已安装"
else
    echo "✗ 请安装After Effects 2024或更高版本"
fi

# 检查Claude Desktop
echo "2. 检查Claude Desktop状态..."
if pgrep -f "Claude Desktop" > /dev/null; then
    echo "✓ Claude Desktop 正在运行"
else
    echo "✗ 请启动Claude Desktop"
fi

# 检查MCP Bridge面板
echo "3. 检查MCP Bridge Auto面板..."
echo "请手动确认AE中是否已安装MCP Bridge Auto面板"

# 检查系统性能
echo "4. 系统性能检查..."
RAM_GB=$(system_profiler SPHardwareDataType | grep "Memory:" | awk '{print $2}')
echo "可用内存: ${RAM_GB}GB"

if [ ${RAM_GB%.*} -ge 16 ]; then
    echo "✓ 内存充足"
else
    echo "⚠ 建议升级内存到16GB以上"
fi

# 检查存储空间
echo "5. 存储空间检查..."
DISK_AVAIL=$(df -h . | tail -1 | awk '{print $4}')
echo "可用存储: $DISK_AVAIL"

# 检查网络连接
echo "6. 网络连接检查..."
if ping -c 1 claude.ai > /dev/null 2>&1; then
    echo "✓ Claude服务连接正常"
else
    echo "✗ 网络连接异常，请检查网络设置"
fi

echo "=== 环境检查完成 ==="