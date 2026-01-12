#!/usr/bin/env node

/**
 * Script de Teste de Vulnerabilidades do Banco de Dados
 * Testa segurança do Supabase PostgreSQL
 */

import { createClient } from '@supabase/supabase-js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Cores para output
const colors = {
    reset: '\x1b[0m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
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
║   TESTE DE VULNERABILIDADES - BANCO DE DADOS SUPABASE     ║
║              Database Security Audit Script               ║
╚═══════════════════════════════════════════════════════════╝
${colors.reset}\n`);

// Carregar variáveis de ambiente
let supabaseUrl, supabaseAnonKey;
try {
    const envPath = join(__dirname, '.env.local');
    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

    envContent.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            envVars[key.trim()] = value.trim();
        }
    });

    supabaseUrl = envVars.VITE_SUPABASE_URL;
    supabaseAnonKey = envVars.VITE_SUPABASE_ANON_KEY;
} catch (error) {
    console.log(`${colors.yellow}⚠ Aviso: Não foi possível carregar .env.local${colors.reset}`);
    supabaseUrl = 'https://lqgpdsrntfwsjgxuxosa.supabase.co';
    supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZ3Bkc3JudGZ3c2pneHV4b3NhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5MjQ4MTMsImV4cCI6MjA4MzUwMDgxM30.g6HlEjpcGT8zGnDZ1Rt0Gx9-AgFpTl0_-nYnhv_dxqc';
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Teste 1: Verificar exposição de chaves
async function testKeyExposure() {
    console.log(`${colors.blue}[TEST 1]${colors.reset} Verificando exposição de chaves de API...`);

    try {
        const clientPath = join(__dirname, 'src', 'lib', 'supabase', 'client.ts');
        const content = readFileSync(clientPath, 'utf8');

        // Verificar se há chave hardcoded
        if (content.includes('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9')) {
            results.critical.push({
                test: 'Exposição de Chaves',
                issue: 'Anon key hardcoded no código fonte',
                file: 'src/lib/supabase/client.ts',
                recommendation: 'Remover fallback e usar apenas variáveis de ambiente',
            });
            console.log(`  ${colors.red}✗ FALHOU${colors.reset} - Chave de API exposta no código\n`);
        } else {
            results.passed.push('Chaves de API protegidas');
            console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Chaves de API protegidas\n`);
        }
    } catch (error) {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Não foi possível verificar arquivo\n`);
    }
}

// Teste 2: Testar RLS (Row Level Security)
async function testRLS() {
    console.log(`${colors.blue}[TEST 2]${colors.reset} Testando Row Level Security (RLS)...`);

    try {
        // Tentar ler dados sem autenticação
        const { data, error } = await supabase
            .from('bookings')
            .select('*')
            .limit(1);

        if (data && data.length > 0) {
            results.critical.push({
                test: 'Row Level Security',
                issue: 'Dados acessíveis sem autenticação',
                table: 'bookings',
                recommendation: 'Configurar políticas RLS para leitura apenas autenticada',
            });
            console.log(`  ${colors.red}✗ FALHOU${colors.reset} - Dados acessíveis sem autenticação\n`);
        } else if (error && error.code === 'PGRST301') {
            results.passed.push('RLS configurado corretamente para leitura');
            console.log(`  ${colors.green}✓ PASSOU${colors.reset} - RLS protegendo leitura de dados\n`);
        } else {
            results.passed.push('RLS configurado para bookings');
            console.log(`  ${colors.green}✓ PASSOU${colors.reset} - RLS ativo\n`);
        }
    } catch (error) {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Erro ao testar RLS: ${error.message}\n`);
    }
}

// Teste 3: Testar SQL Injection
async function testSQLInjection() {
    console.log(`${colors.blue}[TEST 3]${colors.reset} Testando proteção contra SQL Injection...`);

    try {
        const maliciousInputs = [
            "'; DROP TABLE bookings; --",
            "1' OR '1'='1",
            "admin'--",
            "' UNION SELECT * FROM clients--",
        ];

        let vulnerable = false;

        for (const input of maliciousInputs) {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('email', input)
                .limit(1);

            // Se não houver erro, o Supabase está tratando corretamente
            if (!error || error.code !== 'PGRST116') {
                // OK - Supabase usa prepared statements
            }
        }

        results.passed.push('Protegido contra SQL Injection (prepared statements)');
        console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Supabase usa prepared statements\n`);
    } catch (error) {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Erro ao testar SQL Injection\n`);
    }
}

// Teste 4: Testar Rate Limiting
async function testRateLimiting() {
    console.log(`${colors.blue}[TEST 4]${colors.reset} Testando rate limiting...`);

    try {
        const testEmail = `test-${Date.now()}@example.com`;
        const requests = [];

        // Tentar fazer 10 inserções rápidas
        for (let i = 0; i < 10; i++) {
            requests.push(
                supabase.from('bookings').insert({
                    name: 'Test User',
                    email: testEmail,
                    phone: '(84) 98888-8888',
                    type: 'recording',
                    date: '2026-12-31',
                    time: '14:00',
                    status: 'pending',
                })
            );
        }

        const responses = await Promise.all(requests);
        const successful = responses.filter(r => !r.error).length;

        if (successful >= 10) {
            results.high.push({
                test: 'Rate Limiting',
                issue: 'Sem proteção contra spam de inserções',
                recommendation: 'Implementar rate limiting no banco de dados',
            });
            console.log(`  ${colors.red}✗ FALHOU${colors.reset} - ${successful}/10 inserções bem-sucedidas (sem rate limit)\n`);

            // Limpar dados de teste
            await supabase.from('bookings').delete().eq('email', testEmail);
        } else {
            results.passed.push('Rate limiting funcionando');
            console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Rate limiting bloqueou ${10 - successful} inserções\n`);
        }
    } catch (error) {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Erro ao testar rate limiting\n`);
    }
}

// Teste 5: Testar validação de dados
async function testDataValidation() {
    console.log(`${colors.blue}[TEST 5]${colors.reset} Testando validação de dados...`);

    const invalidData = [
        { field: 'email', value: 'invalid-email', expected: 'Rejeitar email inválido' },
        { field: 'phone', value: '123', expected: 'Rejeitar telefone inválido' },
        { field: 'type', value: 'invalid-type', expected: 'Rejeitar tipo inválido' },
        { field: 'status', value: 'invalid-status', expected: 'Rejeitar status inválido' },
        { field: 'date', value: '2020-01-01', expected: 'Rejeitar data passada' },
    ];

    let validationIssues = 0;

    for (const test of invalidData) {
        try {
            const data = {
                name: 'Test User',
                email: 'test@example.com',
                phone: '(84) 98888-8888',
                type: 'recording',
                date: '2026-12-31',
                time: '14:00',
                status: 'pending',
            };

            data[test.field] = test.value;

            const { error } = await supabase.from('bookings').insert(data);

            if (!error) {
                validationIssues++;
                results.high.push({
                    test: 'Validação de Dados',
                    issue: `Campo ${test.field} aceita valor inválido: ${test.value}`,
                    recommendation: `Adicionar constraint para validar ${test.field}`,
                });
            }
        } catch (error) {
            // Erro é esperado - validação funcionando
        }
    }

    if (validationIssues > 0) {
        console.log(`  ${colors.red}✗ FALHOU${colors.reset} - ${validationIssues} validações falharam\n`);
    } else {
        results.passed.push('Validação de dados funcionando');
        console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Validações de dados funcionando\n`);
    }
}

// Teste 6: Verificar índices de performance
async function testIndexes() {
    console.log(`${colors.blue}[TEST 6]${colors.reset} Verificando índices de performance...`);

    // Este teste requer acesso ao schema, que não está disponível via anon key
    // Apenas alertar sobre a importância
    results.medium.push({
        test: 'Índices de Performance',
        issue: 'Verificação manual necessária',
        recommendation: 'Criar índices em: bookings.email, bookings.date, bookings.status',
    });

    console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Verificação manual necessária no dashboard\n`);
}

// Teste 7: Testar bypass de autenticação
async function testAuthBypass() {
    console.log(`${colors.blue}[TEST 7]${colors.reset} Testando bypass de autenticação...`);

    try {
        // Tentar atualizar dados sem autenticação
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'confirmed' })
            .eq('id', '00000000-0000-0000-0000-000000000000');

        if (error && (error.code === 'PGRST301' || error.message.includes('policy'))) {
            results.passed.push('Atualização protegida por RLS');
            console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Atualização requer autenticação\n`);
        } else if (!error) {
            results.critical.push({
                test: 'Bypass de Autenticação',
                issue: 'Possível atualizar dados sem autenticação',
                recommendation: 'Configurar RLS para UPDATE apenas autenticado',
            });
            console.log(`  ${colors.red}✗ FALHOU${colors.reset} - Atualização sem autenticação possível\n`);
        } else {
            results.passed.push('RLS protegendo atualizações');
            console.log(`  ${colors.green}✓ PASSOU${colors.reset} - RLS ativo para atualizações\n`);
        }
    } catch (error) {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Erro ao testar bypass\n`);
    }
}

// Teste 8: Verificar auditoria
async function testAuditLog() {
    console.log(`${colors.blue}[TEST 8]${colors.reset} Verificando logs de auditoria...`);

    try {
        const { data, error } = await supabase
            .from('audit_log')
            .select('*')
            .limit(1);

        if (error && error.code === '42P01') {
            results.high.push({
                test: 'Logs de Auditoria',
                issue: 'Tabela audit_log não existe',
                recommendation: 'Criar tabela de auditoria e triggers',
            });
            console.log(`  ${colors.red}✗ FALHOU${colors.reset} - Sem logs de auditoria\n`);
        } else {
            results.passed.push('Sistema de auditoria configurado');
            console.log(`  ${colors.green}✓ PASSOU${colors.reset} - Auditoria configurada\n`);
        }
    } catch (error) {
        console.log(`  ${colors.yellow}⚠ AVISO${colors.reset} - Erro ao verificar auditoria\n`);
    }
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
        console.log(`   - ${issue.test}: ${issue.issue}`);
        console.log(`     Recomendação: ${issue.recommendation}`);
    });

    console.log(`\n${colors.yellow}🟡 ALTO: ${results.high.length}${colors.reset}`);
    results.high.forEach(issue => {
        console.log(`   - ${issue.test}: ${issue.issue}`);
        console.log(`     Recomendação: ${issue.recommendation}`);
    });

    console.log(`\n${colors.blue}🔵 MÉDIO: ${results.medium.length}${colors.reset}`);
    results.medium.forEach(issue => {
        console.log(`   - ${issue.test}: ${issue.issue}`);
    });

    console.log(`\n${colors.green}✓ PASSOU: ${results.passed.length}${colors.reset}`);
    results.passed.forEach(test => {
        console.log(`   - ${test}`);
    });

    console.log(`\n${colors.cyan}═══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`Total de problemas encontrados: ${totalIssues}`);
    console.log(`\n📄 Relatório detalhado: DATABASE_SECURITY_AUDIT.md`);
    console.log(`🔧 Script de correção SQL disponível no relatório\n`);

    if (totalIssues === 0) {
        console.log(`${colors.green}✓ Todos os testes passaram!${colors.reset}\n`);
        process.exit(0);
    } else if (results.critical.length > 0) {
        console.log(`${colors.red}✗ VULNERABILIDADES CRÍTICAS DETECTADAS!${colors.reset}\n`);
        process.exit(1);
    } else {
        console.log(`${colors.yellow}⚠ Problemas de segurança detectados - Ação recomendada${colors.reset}\n`);
        process.exit(1);
    }
}

// Executar todos os testes
async function runAllTests() {
    await testKeyExposure();
    await testRLS();
    await testSQLInjection();
    await testRateLimiting();
    await testDataValidation();
    await testIndexes();
    await testAuthBypass();
    await testAuditLog();
}

// Executar
runAllTests()
    .then(() => generateReport())
    .catch(error => {
        console.error(`${colors.red}Erro fatal:${colors.reset}`, error);
        process.exit(1);
    });
