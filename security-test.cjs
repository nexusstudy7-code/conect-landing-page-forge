#!/usr/bin/env node

/**
 * Script de Teste de Vulnerabilidades - Connect Landing Page
 * 
 * Este script realiza testes básicos de segurança no frontend
 * para identificar vulnerabilidades comuns.
 */

const fs = require('fs');
const path = require('path');

// Cores para output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m',
};

// Resultados dos testes
const results = {
    critical: [],
    high: [],
    medium: [],
    low: [],
    passed: [],
};

console.log(`${colors.cyan}
╔═══════════════════════════════════════════════════════════╗
║     TESTE DE VULNERABILIDADES - CONNECT LANDING PAGE      ║
║                  Security Audit Script                    ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// Função para ler arquivo
function readFile(filePath) {
    try {
        return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
        return null;
    }
}

// Função para buscar padrões perigosos
function searchPattern(content, pattern, description) {
    const regex = new RegExp(pattern, 'gi');
    const matches = content.match(regex);
    return matches ? matches.length : 0;
}

// Teste 1: Verificar credenciais hardcoded
function testHardcodedCredentials() {
    console.log(`${colors.blue}[TEST 1]${colors.reset} Verificando credenciais hardcoded...`);

    const patterns = [
        { pattern: 'password\\s*[=:]\\s*["\']\\w+["\']', desc: 'Senha hardcoded' },
        { pattern: 'username\\s*[=:]\\s*["\']admin["\']', desc: 'Username hardcoded' },
        { pattern: 'apiKey\\s*[=:]\\s*["\'][\\w-]+["\']', desc: 'API Key hardcoded' },
        { pattern: 'secret\\s*[=:]\\s*["\'][\\w-]+["\']', desc: 'Secret hardcoded' },
    ];

    const srcDir = path.join(__dirname, 'src');
    let foundIssues = false;

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                const content = readFile(filePath);
                if (!content) return;

                patterns.forEach(({ pattern, desc }) => {
                    const count = searchPattern(content, pattern, desc);
                    if (count > 0) {
                        foundIssues = true;
                        results.critical.push({
                            test: 'Credenciais Hardcoded',
                            file: filePath.replace(__dirname, ''),
                            issue: desc,
                            count,
                        });
                    }
                });
            }
        });
    }

    scanDirectory(srcDir);

    if (!foundIssues) {
        results.passed.push('Nenhuma credencial hardcoded encontrada');
        console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Nenhuma credencial hardcoded encontrada\n`);
    } else {
        console.log(`  ${colors.red}✗ FALHOU${colors.reset} - Credenciais hardcoded encontradas\n`);
    }
}

// Teste 2: Verificar localStorage inseguro
function testInsecureLocalStorage() {
    console.log(`${colors.blue}[TEST 2]${colors.reset} Verificando uso inseguro de localStorage...`);

    const srcDir = path.join(__dirname, 'src');
    let foundIssues = false;

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                const content = readFile(filePath);
                if (!content) return;

                // Verificar localStorage.setItem com tokens ou senhas
                const patterns = [
                    'localStorage.setItem.*password',
                    'localStorage.setItem.*token',
                    'localStorage.setItem.*secret',
                ];

                patterns.forEach(pattern => {
                    const count = searchPattern(content, pattern, 'localStorage inseguro');
                    if (count > 0) {
                        foundIssues = true;
                        results.high.push({
                            test: 'localStorage Inseguro',
                            file: filePath.replace(__dirname, ''),
                            issue: 'Dados sensíveis em localStorage',
                            count,
                        });
                    }
                });
            }
        });
    }

    scanDirectory(srcDir);

    if (!foundIssues) {
        results.passed.push('Uso seguro de localStorage');
        console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Uso seguro de localStorage\n`);
    } else {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Uso potencialmente inseguro de localStorage\n`);
    }
}

// Teste 3: Verificar console.log com dados sensíveis
function testConsoleLogging() {
    console.log(`${colors.blue}[TEST 3]${colors.reset} Verificando logs de dados sensíveis...`);

    const srcDir = path.join(__dirname, 'src');
    let foundIssues = false;

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                const content = readFile(filePath);
                if (!content) return;

                const patterns = [
                    'console\\.log.*password',
                    'console\\.log.*token',
                    'console\\.log.*secret',
                ];

                patterns.forEach(pattern => {
                    const count = searchPattern(content, pattern, 'Console log sensível');
                    if (count > 0) {
                        foundIssues = true;
                        results.medium.push({
                            test: 'Console Logging',
                            file: filePath.replace(__dirname, ''),
                            issue: 'Dados sensíveis em console.log',
                            count,
                        });
                    }
                });
            }
        });
    }

    scanDirectory(srcDir);

    if (!foundIssues) {
        results.passed.push('Nenhum log de dados sensíveis');
        console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Nenhum log de dados sensíveis\n`);
    } else {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Logs de dados sensíveis encontrados\n`);
    }
}

// Teste 4: Verificar variáveis de ambiente expostas
function testEnvExposure() {
    console.log(`${colors.blue}[TEST 4]${colors.reset} Verificando exposição de variáveis de ambiente...`);

    const envFile = readFile(path.join(__dirname, '.env.local'));
    const gitignore = readFile(path.join(__dirname, '.gitignore'));

    if (!gitignore || !gitignore.includes('.env')) {
        results.critical.push({
            test: 'Exposição de .env',
            file: '.gitignore',
            issue: '.env não está no .gitignore',
        });
        console.log(`  ${colors.red}✗ FALHOU${colors.reset} - .env não está protegido no .gitignore\n`);
    } else {
        results.passed.push('.env protegido no .gitignore');
        console.log(`  ${colors.green}✓ PASSOU${colors.reset} - .env protegido no .gitignore\n`);
    }
}

// Teste 5: Verificar SQL Injection vulnerabilities
function testSQLInjection() {
    console.log(`${colors.blue}[TEST 5]${colors.reset} Verificando vulnerabilidades de SQL Injection...`);

    const srcDir = path.join(__dirname, 'src');
    let foundIssues = false;

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                const content = readFile(filePath);
                if (!content) return;

                // Verificar concatenação de strings em queries SQL
                const patterns = [
                    'SELECT.*\\+.*',
                    'INSERT.*\\+.*',
                    'UPDATE.*\\+.*',
                    'DELETE.*\\+.*',
                    '`SELECT.*\\$\\{',
                    '`INSERT.*\\$\\{',
                ];

                patterns.forEach(pattern => {
                    const count = searchPattern(content, pattern, 'SQL Injection potencial');
                    if (count > 0) {
                        foundIssues = true;
                        results.high.push({
                            test: 'SQL Injection',
                            file: filePath.replace(__dirname, ''),
                            issue: 'Possível vulnerabilidade de SQL Injection',
                            count,
                        });
                    }
                });
            }
        });
    }

    scanDirectory(srcDir);

    if (!foundIssues) {
        results.passed.push('Nenhuma vulnerabilidade de SQL Injection detectada');
        console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Nenhuma vulnerabilidade de SQL Injection detectada\n`);
    } else {
        console.log(`  ${colors.red}✗ FALHOU${colors.reset} - Possíveis vulnerabilidades de SQL Injection\n`);
    }
}

// Teste 6: Verificar XSS vulnerabilities
function testXSS() {
    console.log(`${colors.blue}[TEST 6]${colors.reset} Verificando vulnerabilidades de XSS...`);

    const srcDir = path.join(__dirname, 'src');
    let foundIssues = false;

    function scanDirectory(dir) {
        const files = fs.readdirSync(dir);

        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                scanDirectory(filePath);
            } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
                const content = readFile(filePath);
                if (!content) return;

                // Verificar dangerouslySetInnerHTML
                const count = searchPattern(content, 'dangerouslySetInnerHTML', 'XSS potencial');
                if (count > 0) {
                    foundIssues = true;
                    results.high.push({
                        test: 'XSS',
                        file: filePath.replace(__dirname, ''),
                        issue: 'Uso de dangerouslySetInnerHTML',
                        count,
                    });
                }
            }
        });
    }

    scanDirectory(srcDir);

    if (!foundIssues) {
        results.passed.push('Nenhuma vulnerabilidade de XSS detectada');
        console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Nenhuma vulnerabilidade de XSS detectada\n`);
    } else {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Uso de dangerouslySetInnerHTML detectado\n`);
    }
}

// Executar todos os testes
function runAllTests() {
    testHardcodedCredentials();
    testInsecureLocalStorage();
    testConsoleLogging();
    testEnvExposure();
    testSQLInjection();
    testXSS();
}

// Gerar relatório
function generateReport() {
    console.log(`\n${colors.cyan}╔═══════════════════════════════════════════════════════════╗`);
    console.log(`║                    RELATÓRIO FINAL                        ║`);
    console.log(`╚═══════════════════════════════════════════════════════════╝${colors.reset}\n`);

    const totalIssues =
        results.critical.length +
        results.high.length +
        results.medium.length +
        results.low.length;

    console.log(`${colors.red}🔴 CRÍTICO: ${results.critical.length}${colors.reset}`);
    results.critical.forEach(issue => {
        console.log(`   - ${issue.test}: ${issue.issue} (${issue.file})`);
    });

    console.log(`\n${colors.yellow}🟡 ALTO: ${results.high.length}${colors.reset}`);
    results.high.forEach(issue => {
        console.log(`   - ${issue.test}: ${issue.issue} (${issue.file})`);
    });

    console.log(`\n${colors.blue}🔵 MÉDIO: ${results.medium.length}${colors.reset}`);
    results.medium.forEach(issue => {
        console.log(`   - ${issue.test}: ${issue.issue} (${issue.file})`);
    });

    console.log(`\n${colors.green}✓ PASSOU: ${results.passed.length}${colors.reset}`);
    results.passed.forEach(test => {
        console.log(`   - ${test}`);
    });

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`Total de problemas encontrados: ${totalIssues}`);

    if (totalIssues === 0) {
        console.log(`${colors.green}✓ Todos os testes passaram!${colors.reset}\n`);
        process.exit(0);
    } else {
        console.log(`${colors.red}✗ Problemas de segurança detectados!${colors.reset}\n`);
        process.exit(1);
    }
}

// Executar
runAllTests();
generateReport();
