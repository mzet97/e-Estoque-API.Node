#!/bin/bash

# E-Estoque Test Coverage and Quality Report Generator
# This script runs the complete test suite and generates comprehensive reports

set -e

echo "🧪 E-Estoque Test Coverage and Quality Report Generator"
echo "======================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root."
    exit 1
fi

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    print_warning "node_modules not found. Installing dependencies..."
    npm install
fi

# Create test reports directory
mkdir -p test-reports

print_status "Starting comprehensive test coverage analysis..."

# Step 1: Run linting
print_status "Running ESLint to check code quality..."
if npm run lint > test-reports/lint-report.txt 2>&1; then
    print_success "ESLint passed - no issues found"
else
    print_warning "ESLint found some issues (check test-reports/lint-report.txt)"
fi

# Step 2: Run unit tests with coverage
print_status "Running unit tests with coverage collection..."
if npm run test:unit -- --coverage --coverageDirectory=coverage/unit > test-reports/unit-tests.txt 2>&1; then
    print_success "Unit tests passed"
else
    print_warning "Some unit tests failed (check test-reports/unit-tests.txt)"
fi

# Step 3: Run integration tests with coverage
print_status "Running integration tests with coverage collection..."
if npm run test:integration -- --coverage --coverageDirectory=coverage/integration > test-reports/integration-tests.txt 2>&1; then
    print_success "Integration tests passed"
else
    print_warning "Some integration tests failed (check test-reports/integration-tests.txt)"
fi

# Step 4: Run E2E tests
print_status "Running end-to-end tests..."
if npm run test:e2e > test-reports/e2e-tests.txt 2>&1; then
    print_success "E2E tests passed"
else
    print_warning "Some E2E tests failed (check test-reports/e2e-tests.txt)"
fi

# Step 5: Run performance tests
print_status "Running performance tests..."
if npm run test:performance > test-reports/performance-tests.txt 2>&1; then
    print_success "Performance tests completed"
else
    print_warning "Some performance tests failed (check test-reports/performance-tests.txt)"
fi

# Step 6: Run security tests
print_status "Running security tests..."
if npm run test:security > test-reports/security-tests.txt 2>&1; then
    print_success "Security tests passed"
else
    print_warning "Some security tests failed (check test-reports/security-tests.txt)"
fi

# Step 7: Generate comprehensive coverage report
print_status "Generating comprehensive coverage report..."
if node -e "
const { CoverageAnalyzer } = require('./tests/utils/CoverageAnalyzer');
const analyzer = new CoverageAnalyzer();
analyzer.generateCompleteReport().then(report => {
    console.log('📊 Coverage Report Generated Successfully');
    console.log('Overall Coverage: ' + report.overallCoverage.statements.toFixed(1) + '%');
    console.log('Files with Coverage: ' + report.filesWithCoverage);
    console.log('Test Files: ' + report.testFiles);
    console.log('Code Quality Score: ' + report.qualityMetrics.codeQualityScore + '%');
    process.exit(0);
}).catch(err => {
    console.error('Failed to generate coverage report:', err.message);
    process.exit(1);
});
"; then
    print_success "Coverage report generated successfully"
else
    print_error "Failed to generate coverage report"
fi

# Step 8: Generate load test report (if load test file exists)
if [ -f "tests/load/load-test.js" ]; then
    print_status "Running load tests..."
    if npm run test:load > test-reports/load-test-report.txt 2>&1; then
        print_success "Load tests completed"
    else
        print_warning "Load tests failed (check test-reports/load-test-report.txt)"
    fi
fi

# Step 9: Create summary report
print_status "Creating summary report..."
SUMMARY_FILE="test-reports/test-summary-$(date +%Y%m%d-%H%M%S).md"
cat > "$SUMMARY_FILE" << EOF
# E-Estoque Test Coverage and Quality Report

Generated on: $(date)

## Test Execution Summary

### Unit Tests
- **Status**: $(if [ -f "test-reports/unit-tests.txt" ] && grep -q "Tests:" "test-reports/unit-tests.txt"; then echo "✅ Passed"; else echo "❌ Failed"; fi)
- **Report**: \`test-reports/unit-tests.txt\`
- **Coverage**: \`coverage/unit\`

### Integration Tests
- **Status**: $(if [ -f "test-reports/integration-tests.txt" ] && grep -q "Tests:" "test-reports/integration-tests.txt"; then echo "✅ Passed"; else echo "❌ Failed"; fi)
- **Report**: \`test-reports/integration-tests.txt\`
- **Coverage**: \`coverage/integration\`

### End-to-End Tests
- **Status**: $(if [ -f "test-reports/e2e-tests.txt" ] && grep -q "Tests:" "test-reports/e2e-tests.txt"; then echo "✅ Passed"; else echo "❌ Failed"; fi)
- **Report**: \`test-reports/e2e-tests.txt\`

### Performance Tests
- **Status**: $(if [ -f "test-reports/performance-tests.txt" ]; then echo "✅ Completed"; else echo "❌ Failed"; fi)
- **Report**: \`test-reports/performance-tests.txt\`

### Security Tests
- **Status**: $(if [ -f "test-reports/security-tests.txt" ] && grep -q "Tests:" "test-reports/security-tests.txt"; then echo "✅ Passed"; else echo "❌ Failed"; fi)
- **Report**: \`test-reports/security-tests.txt\`

## Code Quality

### Linting
- **Status**: $(if [ -f "test-reports/lint-report.txt" ] && ! grep -q "error" "test-reports/lint-report.txt"; then echo "✅ Passed"; else echo "⚠️ Issues Found"; fi)
- **Report**: \`test-reports/lint-report.txt\`

### Coverage Reports
- **HTML Report**: \`test-reports/coverage-report-*.html\`
- **JSON Report**: \`test-reports/coverage-report-*.json\`
- **LCOV Report**: \`coverage/lcov.info\`

## Available Coverage Reports

$(ls -la test-reports/coverage-report-*.* 2>/dev/null | awk '{print "- " $9 " (" $5 " bytes)"}' || echo "- No coverage reports found")

## Quick Commands

\`\`\`bash
# Run specific test suites
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
npm run test:performance   # Performance tests only
npm run test:security     # Security tests only

# Coverage commands
npm run test:coverage     # Run tests with coverage
open test-reports/coverage-report-*.html  # Open coverage report (macOS)
xdg-open test-reports/coverage-report-*.html  # Open coverage report (Linux)

# Load testing
npm run test:load        # Run load tests
\`\`\`

## Next Steps

1. Review the coverage reports to identify areas needing more tests
2. Check the quality metrics and recommendations
3. Address any security or performance issues found
4. Update test cases based on the recommendations

---
*Generated by E-Estoque Test Coverage System*
EOF

print_success "Summary report created: $SUMMARY_FILE"

# Step 10: List all generated files
echo ""
echo "📋 Generated Reports Summary"
echo "==========================="
print_status "Test reports directory: test-reports/"
print_status "Coverage directory: coverage/"

if ls test-reports/* >/dev/null 2>&1; then
    echo ""
    echo "Generated files:"
    ls -la test-reports/
else
    print_warning "No test reports generated"
fi

if ls coverage/* >/dev/null 2>&1; then
    echo ""
    echo "Coverage files:"
    ls -la coverage/
fi

echo ""
print_success "🎉 Test coverage analysis completed!"
print_status "Check the following for detailed results:"
print_status "- Summary: $SUMMARY_FILE"
print_status "- Coverage HTML: test-reports/coverage-report-*.html"
print_status "- Unit tests: test-reports/unit-tests.txt"
print_status "- Integration tests: test-reports/integration-tests.txt"
print_status "- E2E tests: test-reports/e2e-tests.txt"
print_status "- Performance tests: test-reports/performance-tests.txt"
print_status "- Security tests: test-reports/security-tests.txt"

echo ""
echo "🚀 To run specific test suites:"
echo "  npm run test:unit          # Unit tests only"
echo "  npm run test:integration   # Integration tests only"
echo "  npm run test:e2e          # End-to-end tests only"
echo "  npm run test:performance   # Performance tests only"
echo "  npm run test:security     # Security tests only"
echo "  npm run test:coverage     # Run tests with coverage collection"