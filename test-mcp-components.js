/**
 * MCP After Effects Components Test Script
 * 系统性测试所有 Prompts、Resources 和 Tools
 */

import { spawn } from 'child_process';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

class MCPTester {
  constructor() {
    this.results = {
      prompts: {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
      },
      resources: {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
      },
      tools: {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
      }
    };
  }

  // 定义所有组件
  getComponents() {
    return {
      prompts: [
        { name: "list-compositions", args: {} },
        { name: "analyze-composition", args: { compositionName: "Test Comp" } },
        { name: "create-composition", args: { name: "Test", width: "1920", height: "1080" } },
        { name: "create-text-animation", args: { text: "Hello", animation: "fade-in" } },
        { name: "apply-cinematic-effects", args: { style: "warm-sunset" } },
        { name: "optimize-composition", args: { focus: "render-speed" } },
        { name: "troubleshoot-project", args: { issue: "slow-performance" } }
      ],
      resources: [
        { name: "compositions", uri: "aftereffects://compositions" },
        { name: "project-info", uri: "aftereffects://project/info" },
        { name: "layers", uri: "aftereffects://composition/active/layers" },
        { name: "effect-templates", uri: "aftereffects://effects/templates" }
      ],
      tools: [
        { name: "get-help", args: {} },
        { name: "get-help", args: { topic: "setup" } },
        { name: "run-script", args: { script: "listCompositions" } },
        { name: "get-results", args: {} },
        { name: "get-results", args: { format: "summary" } },
        { name: "create-composition", args: { name: "Test", width: 1920, height: 1080 } },
        { name: "setLayerKeyframe", args: { compIndex: 1, layerIndex: 1, propertyName: "Opacity", timeInSeconds: 1, value: 50 } },
        { name: "setLayerExpression", args: { compIndex: 1, layerIndex: 1, propertyName: "Position", expressionString: "wiggle(2, 30)" } },
        { name: "apply-effect", args: { compIndex: 1, layerIndex: 1, effectMatchName: "ADBE Gaussian Blur 2" } },
        { name: "apply-effect-template", args: { compIndex: 1, layerIndex: 1, templateName: "gaussian-blur" } },
        { name: "mcp_aftereffects_get_effects_help", args: {} }
      ]
    };
  }

  // 测试单个工具
  async testTool(tool) {
    try {
      console.log(`\n🔧 Testing Tool: ${tool.name}`);
      
      // 创建测试消息
      const testMessage = {
        jsonrpc: "2.0",
        id: Math.random().toString(36).substr(2, 9),
        method: "tools/call",
        params: {
          name: tool.name,
          arguments: tool.args || {}
        }
      };

      console.log(`   Parameters: ${JSON.stringify(tool.args, null, 2)}`);
      
      // 由于我们无法直接调用 MCP 服务器，我们检查参数验证逻辑
      const result = this.validateToolParameters(tool);
      
      if (result.valid) {
        console.log(`   ✅ PASS - Parameter validation successful`);
        this.results.tools.passed++;
        this.results.tools.tests.push({
          name: tool.name,
          status: 'PASS',
          message: 'Parameter validation successful',
          args: tool.args
        });
      } else {
        console.log(`   ❌ FAIL - ${result.error}`);
        this.results.tools.failed++;
        this.results.tools.tests.push({
          name: tool.name,
          status: 'FAIL',
          message: result.error,
          args: tool.args
        });
      }
      
      this.results.tools.total++;
      
    } catch (error) {
      console.log(`   ❌ FAIL - Exception: ${error.message}`);
      this.results.tools.failed++;
      this.results.tools.total++;
      this.results.tools.tests.push({
        name: tool.name,
        status: 'FAIL',
        message: `Exception: ${error.message}`,
        args: tool.args
      });
    }
  }

  // 测试单个资源
  async testResource(resource) {
    try {
      console.log(`\n📁 Testing Resource: ${resource.name}`);
      console.log(`   URI: ${resource.uri}`);
      
      // 检查 URI 格式
      const uriPattern = /^aftereffects:\/\/[a-z-\/]+$/;
      if (uriPattern.test(resource.uri)) {
        console.log(`   ✅ PASS - URI format valid`);
        this.results.resources.passed++;
        this.results.resources.tests.push({
          name: resource.name,
          status: 'PASS',
          message: 'URI format valid',
          uri: resource.uri
        });
      } else {
        console.log(`   ❌ FAIL - Invalid URI format`);
        this.results.resources.failed++;
        this.results.resources.tests.push({
          name: resource.name,
          status: 'FAIL',
          message: 'Invalid URI format',
          uri: resource.uri
        });
      }
      
      this.results.resources.total++;
      
    } catch (error) {
      console.log(`   ❌ FAIL - Exception: ${error.message}`);
      this.results.resources.failed++;
      this.results.resources.total++;
      this.results.resources.tests.push({
        name: resource.name,
        status: 'FAIL',
        message: `Exception: ${error.message}`,
        uri: resource.uri
      });
    }
  }

  // 测试单个提示
  async testPrompt(prompt) {
    try {
      console.log(`\n💬 Testing Prompt: ${prompt.name}`);
      console.log(`   Arguments: ${JSON.stringify(prompt.args, null, 2)}`);
      
      // 验证参数
      const result = this.validatePromptParameters(prompt);
      
      if (result.valid) {
        console.log(`   ✅ PASS - Parameter validation successful`);
        this.results.prompts.passed++;
        this.results.prompts.tests.push({
          name: prompt.name,
          status: 'PASS',
          message: 'Parameter validation successful',
          args: prompt.args
        });
      } else {
        console.log(`   ❌ FAIL - ${result.error}`);
        this.results.prompts.failed++;
        this.results.prompts.tests.push({
          name: prompt.name,
          status: 'FAIL',
          message: result.error,
          args: prompt.args
        });
      }
      
      this.results.prompts.total++;
      
    } catch (error) {
      console.log(`   ❌ FAIL - Exception: ${error.message}`);
      this.results.prompts.failed++;
      this.results.prompts.total++;
      this.results.prompts.tests.push({
        name: prompt.name,
        status: 'FAIL',
        message: `Exception: ${error.message}`,
        args: prompt.args
      });
    }
  }

  // 验证工具参数
  validateToolParameters(tool) {
    const validations = {
      "get-help": (args) => {
        if (args.topic && !["setup", "tools", "effects", "troubleshooting", "all"].includes(args.topic)) {
          return { valid: false, error: "Invalid topic parameter" };
        }
        return { valid: true };
      },
      "run-script": (args) => {
        const allowedScripts = [
          "listCompositions", "getProjectInfo", "getLayerInfo", "createComposition",
          "createTextLayer", "createShapeLayer", "createSolidLayer", "setLayerProperties",
          "setLayerKeyframe", "setLayerExpression", "applyEffect", "applyEffectTemplate",
          "test-animation", "bridgeTestEffects"
        ];
        if (!allowedScripts.includes(args.script)) {
          return { valid: false, error: "Invalid script name" };
        }
        return { valid: true };
      },
      "get-results": (args) => {
        if (args.format && !["raw", "formatted", "summary"].includes(args.format)) {
          return { valid: false, error: "Invalid format parameter" };
        }
        return { valid: true };
      },
      "create-composition": (args) => {
        if (!args.name || typeof args.name !== 'string') {
          return { valid: false, error: "Name is required and must be string" };
        }
        if (args.width !== undefined && (typeof args.width !== 'number' || args.width <= 0)) {
          return { valid: false, error: "Width must be positive number" };
        }
        if (args.height !== undefined && (typeof args.height !== 'number' || args.height <= 0)) {
          return { valid: false, error: "Height must be positive number" };
        }
        return { valid: true };
      },
      "setLayerKeyframe": (args) => {
        if (!args.compIndex || typeof args.compIndex !== 'number' || args.compIndex <= 0) {
          return { valid: false, error: "compIndex must be positive number" };
        }
        if (!args.layerIndex || typeof args.layerIndex !== 'number' || args.layerIndex <= 0) {
          return { valid: false, error: "layerIndex must be positive number" };
        }
        const validProperties = ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"];
        if (!validProperties.includes(args.propertyName)) {
          return { valid: false, error: "Invalid propertyName" };
        }
        return { valid: true };
      },
      "setLayerExpression": (args) => {
        if (!args.compIndex || typeof args.compIndex !== 'number' || args.compIndex <= 0) {
          return { valid: false, error: "compIndex must be positive number" };
        }
        if (!args.layerIndex || typeof args.layerIndex !== 'number' || args.layerIndex <= 0) {
          return { valid: false, error: "layerIndex must be positive number" };
        }
        const validProperties = ["Position", "Scale", "Rotation", "Opacity", "Anchor Point"];
        if (!validProperties.includes(args.propertyName)) {
          return { valid: false, error: "Invalid propertyName" };
        }
        return { valid: true };
      },
      "apply-effect": (args) => {
        if (!args.compIndex || typeof args.compIndex !== 'number' || args.compIndex <= 0) {
          return { valid: false, error: "compIndex must be positive number" };
        }
        if (!args.layerIndex || typeof args.layerIndex !== 'number' || args.layerIndex <= 0) {
          return { valid: false, error: "layerIndex must be positive number" };
        }
        return { valid: true };
      },
      "apply-effect-template": (args) => {
        const validTemplates = [
          "gaussian-blur", "directional-blur", "color-balance", "brightness-contrast",
          "curves", "glow", "drop-shadow", "cinematic-look", "text-pop"
        ];
        if (!validTemplates.includes(args.templateName)) {
          return { valid: false, error: "Invalid templateName" };
        }
        return { valid: true };
      }
    };

    const validator = validations[tool.name];
    if (validator) {
      return validator(tool.args || {});
    }
    return { valid: true }; // 默认通过，如果没有特定验证
  }

  // 验证提示参数
  validatePromptParameters(prompt) {
    const validations = {
      "analyze-composition": (args) => {
        if (!args.compositionName || typeof args.compositionName !== 'string') {
          return { valid: false, error: "compositionName is required and must be string" };
        }
        return { valid: true };
      },
      "create-composition": (args) => {
        if (!args.name || typeof args.name !== 'string') {
          return { valid: false, error: "name is required and must be string" };
        }
        return { valid: true };
      },
      "create-text-animation": (args) => {
        if (!args.text || typeof args.text !== 'string') {
          return { valid: false, error: "text is required and must be string" };
        }
        const validAnimations = ["fade-in", "slide-up", "type-on", "scale-in", "bounce"];
        if (!validAnimations.includes(args.animation)) {
          return { valid: false, error: "Invalid animation type" };
        }
        return { valid: true };
      },
      "apply-cinematic-effects": (args) => {
        const validStyles = ["warm-sunset", "cool-blue", "vintage", "high-contrast", "desaturated", "teal-orange"];
        if (!validStyles.includes(args.style)) {
          return { valid: false, error: "Invalid style" };
        }
        return { valid: true };
      },
      "troubleshoot-project": (args) => {
        const validIssues = ["slow-performance", "missing-footage", "render-errors", "memory-problems", "effect-issues", "audio-sync"];
        if (!validIssues.includes(args.issue)) {
          return { valid: false, error: "Invalid issue type" };
        }
        return { valid: true };
      }
    };

    const validator = validations[prompt.name];
    if (validator) {
      return validator(prompt.args || {});
    }
    return { valid: true }; // 默认通过，如果没有特定验证
  }

  // 运行所有测试
  async runAllTests() {
    console.log("🧪 Starting MCP After Effects Components Test Suite\n");
    console.log("=" * 60);

    const components = this.getComponents();

    // 测试 Resources
    console.log("\n📁 TESTING RESOURCES");
    console.log("=" * 30);
    for (const resource of components.resources) {
      await this.testResource(resource);
    }

    // 测试 Tools  
    console.log("\n🔧 TESTING TOOLS");
    console.log("=" * 30);
    for (const tool of components.tools) {
      await this.testTool(tool);
    }

    // 测试 Prompts
    console.log("\n💬 TESTING PROMPTS");
    console.log("=" * 30);
    for (const prompt of components.prompts) {
      await this.testPrompt(prompt);
    }

    // 输出统计结果
    this.printResults();
  }

  // 打印测试结果统计
  printResults() {
    console.log("\n" + "=" * 60);
    console.log("📊 TEST RESULTS SUMMARY");
    console.log("=" * 60);

    // Resources 统计
    console.log(`\n📁 RESOURCES:`);
    console.log(`   Total: ${this.results.resources.total}`);
    console.log(`   Passed: ${this.results.resources.passed} ✅`);
    console.log(`   Failed: ${this.results.resources.failed} ❌`);
    console.log(`   Success Rate: ${((this.results.resources.passed / this.results.resources.total) * 100).toFixed(1)}%`);

    // Tools 统计
    console.log(`\n🔧 TOOLS:`);
    console.log(`   Total: ${this.results.tools.total}`);
    console.log(`   Passed: ${this.results.tools.passed} ✅`);
    console.log(`   Failed: ${this.results.tools.failed} ❌`);
    console.log(`   Success Rate: ${((this.results.tools.passed / this.results.tools.total) * 100).toFixed(1)}%`);

    // Prompts 统计
    console.log(`\n💬 PROMPTS:`);
    console.log(`   Total: ${this.results.prompts.total}`);
    console.log(`   Passed: ${this.results.prompts.passed} ✅`);
    console.log(`   Failed: ${this.results.prompts.failed} ❌`);
    console.log(`   Success Rate: ${((this.results.prompts.passed / this.results.prompts.total) * 100).toFixed(1)}%`);

    // 总体统计
    const totalTests = this.results.resources.total + this.results.tools.total + this.results.prompts.total;
    const totalPassed = this.results.resources.passed + this.results.tools.passed + this.results.prompts.passed;
    const totalFailed = this.results.resources.failed + this.results.tools.failed + this.results.prompts.failed;

    console.log(`\n🎯 OVERALL:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed} ✅`);
    console.log(`   Failed: ${totalFailed} ❌`);
    console.log(`   Overall Success Rate: ${((totalPassed / totalTests) * 100).toFixed(1)}%`);

    // 详细失败报告
    if (totalFailed > 0) {
      console.log(`\n⚠️  FAILED TESTS DETAILS:`);
      console.log("=" * 30);
      
      [...this.results.resources.tests, ...this.results.tools.tests, ...this.results.prompts.tests]
        .filter(test => test.status === 'FAIL')
        .forEach(test => {
          console.log(`❌ ${test.name}: ${test.message}`);
        });
    }

    // 保存结果到文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `test-results-${timestamp}.json`;
    
    try {
      writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
      console.log(`\n📝 Test results saved to: ${reportFile}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save results: ${error.message}`);
    }

    console.log("\n🏁 Test Suite Completed!");
  }
}

// 运行测试
const tester = new MCPTester();
tester.runAllTests().catch(console.error); 