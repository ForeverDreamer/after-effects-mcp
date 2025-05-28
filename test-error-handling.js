/**
 * MCP After Effects Error Handling Test Script
 * 测试边界情况和错误处理机制
 */

import { readFileSync, writeFileSync } from 'fs';

class ErrorHandlingTester {
  constructor() {
    this.results = {
      errorTests: {
        total: 0,
        passed: 0,
        failed: 0,
        tests: []
      }
    };
  }

  // 错误测试用例
  getErrorTestCases() {
    return {
      tools: [
        // get-help 工具的错误测试
        {
          name: "get-help",
          args: { topic: "invalid-topic" },
          expectedError: "Invalid topic parameter",
          description: "测试无效的主题参数"
        },
        
        // run-script 工具的错误测试
        {
          name: "run-script", 
          args: { script: "invalidScript" },
          expectedError: "Invalid script name",
          description: "测试无效的脚本名称"
        },
        
        // get-results 工具的错误测试
        {
          name: "get-results",
          args: { format: "invalid-format" },
          expectedError: "Invalid format parameter", 
          description: "测试无效的格式参数"
        },
        
        // create-composition 工具的错误测试
        {
          name: "create-composition",
          args: { width: 1920, height: 1080 }, // 缺少必需的 name
          expectedError: "Name is required and must be string",
          description: "测试缺少必需参数"
        },
        {
          name: "create-composition",
          args: { name: "Test", width: -100, height: 1080 },
          expectedError: "Width must be positive number",
          description: "测试负数宽度"
        },
        {
          name: "create-composition", 
          args: { name: "Test", width: 1920, height: 0 },
          expectedError: "Height must be positive number",
          description: "测试零高度"
        },
        
        // setLayerKeyframe 工具的错误测试
        {
          name: "setLayerKeyframe",
          args: { layerIndex: 1, propertyName: "Opacity", timeInSeconds: 1, value: 50 }, // 缺少 compIndex
          expectedError: "compIndex must be positive number",
          description: "测试缺少 compIndex"
        },
        {
          name: "setLayerKeyframe",
          args: { compIndex: -1, layerIndex: 1, propertyName: "Opacity", timeInSeconds: 1, value: 50 },
          expectedError: "compIndex must be positive number", 
          description: "测试负数 compIndex"
        },
        {
          name: "setLayerKeyframe",
          args: { compIndex: 1, layerIndex: 0, propertyName: "Opacity", timeInSeconds: 1, value: 50 },
          expectedError: "layerIndex must be positive number",
          description: "测试零 layerIndex"
        },
        {
          name: "setLayerKeyframe",
          args: { compIndex: 1, layerIndex: 1, propertyName: "InvalidProperty", timeInSeconds: 1, value: 50 },
          expectedError: "Invalid propertyName",
          description: "测试无效的属性名"
        },
        
        // setLayerExpression 工具的错误测试
        {
          name: "setLayerExpression",
          args: { compIndex: 1, layerIndex: 1, propertyName: "InvalidProperty", expressionString: "wiggle(2, 30)" },
          expectedError: "Invalid propertyName",
          description: "测试表达式工具的无效属性名"
        },
        
        // apply-effect 工具的错误测试
        {
          name: "apply-effect",
          args: { layerIndex: 1, effectMatchName: "ADBE Gaussian Blur 2" }, // 缺少 compIndex
          expectedError: "compIndex must be positive number",
          description: "测试特效工具缺少 compIndex"
        },
        {
          name: "apply-effect",
          args: { compIndex: 1, effectMatchName: "ADBE Gaussian Blur 2" }, // 缺少 layerIndex
          expectedError: "layerIndex must be positive number",
          description: "测试特效工具缺少 layerIndex"
        },
        
        // apply-effect-template 工具的错误测试
        {
          name: "apply-effect-template",
          args: { compIndex: 1, layerIndex: 1, templateName: "invalid-template" },
          expectedError: "Invalid templateName",
          description: "测试无效的模板名称"
        }
      ],
      
      prompts: [
        // analyze-composition 提示的错误测试
        {
          name: "analyze-composition",
          args: {}, // 缺少必需的 compositionName
          expectedError: "compositionName is required and must be string",
          description: "测试缺少必需的合成名称"
        },
        {
          name: "analyze-composition", 
          args: { compositionName: 123 }, // 错误的类型
          expectedError: "compositionName is required and must be string",
          description: "测试错误的合成名称类型"
        },
        
        // create-composition 提示的错误测试
        {
          name: "create-composition",
          args: { width: "1920", height: "1080" }, // 缺少 name
          expectedError: "name is required and must be string",
          description: "测试提示缺少名称"
        },
        
        // create-text-animation 提示的错误测试
        {
          name: "create-text-animation",
          args: { animation: "fade-in" }, // 缺少 text
          expectedError: "text is required and must be string",
          description: "测试缺少文本内容"
        },
        {
          name: "create-text-animation",
          args: { text: "Hello", animation: "invalid-animation" },
          expectedError: "Invalid animation type",
          description: "测试无效的动画类型"
        },
        
        // apply-cinematic-effects 提示的错误测试
        {
          name: "apply-cinematic-effects",
          args: { style: "invalid-style" },
          expectedError: "Invalid style",
          description: "测试无效的电影风格"
        },
        
        // troubleshoot-project 提示的错误测试
        {
          name: "troubleshoot-project",
          args: { issue: "non-existent-issue" },
          expectedError: "Invalid issue type",
          description: "测试无效的问题类型"
        }
      ],
      
      resources: [
        // 测试无效的 URI 格式
        {
          name: "invalid-uri-1",
          uri: "http://invalid-protocol/compositions",
          expectedError: "Invalid URI format",
          description: "测试错误的协议"
        },
        {
          name: "invalid-uri-2", 
          uri: "aftereffects://UPPER-CASE/path",
          expectedError: "Invalid URI format",
          description: "测试大写字母的 URI"
        },
        {
          name: "invalid-uri-3",
          uri: "aftereffects://path with spaces",
          expectedError: "Invalid URI format", 
          description: "测试包含空格的 URI"
        }
      ]
    };
  }

  // 验证工具参数 (复制自主测试脚本)
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
    return { valid: true };
  }

  // 验证提示参数 (复制自主测试脚本)
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
    return { valid: true };
  }

  // 测试错误工具
  async testErrorTool(testCase) {
    try {
      console.log(`\n🔧❌ Testing Error Case: ${testCase.name}`);
      console.log(`   Description: ${testCase.description}`);
      console.log(`   Parameters: ${JSON.stringify(testCase.args, null, 2)}`);
      
      const result = this.validateToolParameters(testCase);
      
      if (!result.valid && result.error === testCase.expectedError) {
        console.log(`   ✅ PASS - Error correctly caught: ${result.error}`);
        this.results.errorTests.passed++;
        this.results.errorTests.tests.push({
          type: 'tool',
          name: testCase.name,
          status: 'PASS',
          message: `Error correctly caught: ${result.error}`,
          args: testCase.args,
          description: testCase.description
        });
      } else if (result.valid) {
        console.log(`   ❌ FAIL - Expected error but validation passed`);
        this.results.errorTests.failed++;
        this.results.errorTests.tests.push({
          type: 'tool',
          name: testCase.name,
          status: 'FAIL',
          message: 'Expected error but validation passed',
          args: testCase.args,
          description: testCase.description
        });
      } else {
        console.log(`   ❌ FAIL - Wrong error: got "${result.error}", expected "${testCase.expectedError}"`);
        this.results.errorTests.failed++;
        this.results.errorTests.tests.push({
          type: 'tool',
          name: testCase.name,
          status: 'FAIL',
          message: `Wrong error: got "${result.error}", expected "${testCase.expectedError}"`,
          args: testCase.args,
          description: testCase.description
        });
      }
      
      this.results.errorTests.total++;
      
    } catch (error) {
      console.log(`   ❌ FAIL - Exception: ${error.message}`);
      this.results.errorTests.failed++;
      this.results.errorTests.total++;
      this.results.errorTests.tests.push({
        type: 'tool',
        name: testCase.name,
        status: 'FAIL',
        message: `Exception: ${error.message}`,
        args: testCase.args,
        description: testCase.description
      });
    }
  }

  // 测试错误提示
  async testErrorPrompt(testCase) {
    try {
      console.log(`\n💬❌ Testing Error Case: ${testCase.name}`);
      console.log(`   Description: ${testCase.description}`);
      console.log(`   Arguments: ${JSON.stringify(testCase.args, null, 2)}`);
      
      const result = this.validatePromptParameters(testCase);
      
      if (!result.valid && result.error === testCase.expectedError) {
        console.log(`   ✅ PASS - Error correctly caught: ${result.error}`);
        this.results.errorTests.passed++;
        this.results.errorTests.tests.push({
          type: 'prompt',
          name: testCase.name,
          status: 'PASS',
          message: `Error correctly caught: ${result.error}`,
          args: testCase.args,
          description: testCase.description
        });
      } else if (result.valid) {
        console.log(`   ❌ FAIL - Expected error but validation passed`);
        this.results.errorTests.failed++;
        this.results.errorTests.tests.push({
          type: 'prompt',
          name: testCase.name,
          status: 'FAIL',
          message: 'Expected error but validation passed',
          args: testCase.args,
          description: testCase.description
        });
      } else {
        console.log(`   ❌ FAIL - Wrong error: got "${result.error}", expected "${testCase.expectedError}"`);
        this.results.errorTests.failed++;
        this.results.errorTests.tests.push({
          type: 'prompt',
          name: testCase.name,
          status: 'FAIL',
          message: `Wrong error: got "${result.error}", expected "${testCase.expectedError}"`,
          args: testCase.args,
          description: testCase.description
        });
      }
      
      this.results.errorTests.total++;
      
    } catch (error) {
      console.log(`   ❌ FAIL - Exception: ${error.message}`);
      this.results.errorTests.failed++;
      this.results.errorTests.total++;
      this.results.errorTests.tests.push({
        type: 'prompt',
        name: testCase.name,
        status: 'FAIL',
        message: `Exception: ${error.message}`,
        args: testCase.args,
        description: testCase.description
      });
    }
  }

  // 测试错误资源
  async testErrorResource(testCase) {
    try {
      console.log(`\n📁❌ Testing Error Case: ${testCase.name}`);
      console.log(`   Description: ${testCase.description}`);
      console.log(`   URI: ${testCase.uri}`);
      
      // 检查 URI 格式
      const uriPattern = /^aftereffects:\/\/[a-z-\/]+$/;
      const isValid = uriPattern.test(testCase.uri);
      
      if (!isValid && testCase.expectedError === "Invalid URI format") {
        console.log(`   ✅ PASS - Error correctly caught: ${testCase.expectedError}`);
        this.results.errorTests.passed++;
        this.results.errorTests.tests.push({
          type: 'resource',
          name: testCase.name,
          status: 'PASS',
          message: `Error correctly caught: ${testCase.expectedError}`,
          uri: testCase.uri,
          description: testCase.description
        });
      } else if (isValid) {
        console.log(`   ❌ FAIL - Expected error but URI validation passed`);
        this.results.errorTests.failed++;
        this.results.errorTests.tests.push({
          type: 'resource',
          name: testCase.name,
          status: 'FAIL',
          message: 'Expected error but URI validation passed',
          uri: testCase.uri,
          description: testCase.description
        });
      } else {
        console.log(`   ❌ FAIL - Unexpected validation result`);
        this.results.errorTests.failed++;
        this.results.errorTests.tests.push({
          type: 'resource',
          name: testCase.name,
          status: 'FAIL',
          message: 'Unexpected validation result',
          uri: testCase.uri,
          description: testCase.description
        });
      }
      
      this.results.errorTests.total++;
      
    } catch (error) {
      console.log(`   ❌ FAIL - Exception: ${error.message}`);
      this.results.errorTests.failed++;
      this.results.errorTests.total++;
      this.results.errorTests.tests.push({
        type: 'resource',
        name: testCase.name,
        status: 'FAIL',
        message: `Exception: ${error.message}`,
        uri: testCase.uri,
        description: testCase.description
      });
    }
  }

  // 运行所有错误测试
  async runAllErrorTests() {
    console.log("🔥 Starting MCP After Effects Error Handling Test Suite\n");
    console.log("=" * 70);

    const testCases = this.getErrorTestCases();

    // 测试工具错误
    console.log("\n🔧❌ TESTING TOOL ERROR HANDLING");
    console.log("=" * 40);
    for (const testCase of testCases.tools) {
      await this.testErrorTool(testCase);
    }

    // 测试提示错误
    console.log("\n💬❌ TESTING PROMPT ERROR HANDLING");
    console.log("=" * 40);
    for (const testCase of testCases.prompts) {
      await this.testErrorPrompt(testCase);
    }

    // 测试资源错误
    console.log("\n📁❌ TESTING RESOURCE ERROR HANDLING");
    console.log("=" * 40);
    for (const testCase of testCases.resources) {
      await this.testErrorResource(testCase);
    }

    // 输出统计结果
    this.printErrorResults();
  }

  // 打印错误测试结果统计
  printErrorResults() {
    console.log("\n" + "=" * 70);
    console.log("🔥 ERROR HANDLING TEST RESULTS SUMMARY");
    console.log("=" * 70);

    console.log(`\n❌ ERROR TESTS:`);
    console.log(`   Total: ${this.results.errorTests.total}`);
    console.log(`   Passed: ${this.results.errorTests.passed} ✅`);
    console.log(`   Failed: ${this.results.errorTests.failed} ❌`);
    console.log(`   Success Rate: ${((this.results.errorTests.passed / this.results.errorTests.total) * 100).toFixed(1)}%`);

    // 按类型分类统计
    const byType = {
      tool: this.results.errorTests.tests.filter(t => t.type === 'tool'),
      prompt: this.results.errorTests.tests.filter(t => t.type === 'prompt'),
      resource: this.results.errorTests.tests.filter(t => t.type === 'resource')
    };

    console.log(`\n📊 BY TYPE:`);
    Object.entries(byType).forEach(([type, tests]) => {
      const passed = tests.filter(t => t.status === 'PASS').length;
      const total = tests.length;
      console.log(`   ${type.toUpperCase()}: ${passed}/${total} (${((passed/total)*100).toFixed(1)}%)`);
    });

    // 详细失败报告
    const failedTests = this.results.errorTests.tests.filter(test => test.status === 'FAIL');
    if (failedTests.length > 0) {
      console.log(`\n⚠️  FAILED ERROR TESTS DETAILS:`);
      console.log("=" * 40);
      
      failedTests.forEach(test => {
        console.log(`❌ ${test.type.toUpperCase()}: ${test.name}`);
        console.log(`   Issue: ${test.message}`);
        console.log(`   Description: ${test.description}`);
        console.log();
      });
    }

    // 保存结果到文件
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = `error-test-results-${timestamp}.json`;
    
    try {
      writeFileSync(reportFile, JSON.stringify(this.results, null, 2));
      console.log(`\n📝 Error test results saved to: ${reportFile}`);
    } catch (error) {
      console.log(`\n⚠️  Could not save results: ${error.message}`);
    }

    console.log("\n🏁 Error Handling Test Suite Completed!");
  }
}

// 运行错误测试
const errorTester = new ErrorHandlingTester();
errorTester.runAllErrorTests().catch(console.error); 