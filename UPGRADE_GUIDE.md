# Guia de Atualização para Versões LTS

Este documento descreve as atualizações realizadas no projeto para usar as versões LTS mais recentes das dependências.

## 🚀 Principais Atualizações

### Node.js
- **Versão recomendada**: Node.js 22.11.0 LTS ("Jod")
- **Suporte mínimo**: Node.js >=22.11.0
- **Benefícios**: Melhor performance, segurança aprimorada, WebSocket nativo, Watch Mode estável

### Dependências Principais Atualizadas

#### Express.js
- **De**: `^4.21.1` → **Para**: `^5.0.1`
- **Mudanças importantes**:
  - Suporte mínimo para Node.js 18+
  - Melhorias de segurança
  - Atualizações no path-to-regexp
  - Remoção de suporte para regex sub-expressions

#### TypeORM
- **De**: `^0.3.20` → **Para**: `^0.3.24`
- **Melhorias**: Bug fixes, melhor compatibilidade com TypeScript moderno

#### TypeScript
- **De**: `^5.6.3` → **Para**: `^5.7.2`
- **Benefícios**: Últimas funcionalidades e correções de bugs

#### Outras Atualizações
- `@types/node`: `^22.8.1` → `^22.11.0`
- `@typescript-eslint/eslint-plugin`: `^8.11.0` → `^8.15.0`
- `@typescript-eslint/parser`: `^8.11.0` → `^8.15.0`
- `eslint`: `^9.13.0` → `^9.15.0`

## 📋 Passos para Atualização

### 1. Atualizar Node.js
```bash
# Verificar versão atual
node --version

# Instalar Node.js 22.11.0 LTS
# Visite: https://nodejs.org/en/download/
```

### 2. Limpar e Reinstalar Dependências
```bash
# Remover node_modules e lock files
rm -rf node_modules
rm pnpm-lock.yaml

# Reinstalar dependências
pnpm install
```

### 3. Verificar Compatibilidade
```bash
# Executar testes
pnpm test

# Verificar build
pnpm build

# Executar em modo desenvolvimento
pnpm dev
```

## ⚠️ Possíveis Breaking Changes

### Express.js v5
1. **Regex Patterns**: Não suporta mais sub-expressões regex como `/:foo(\\d+)`
   - **Solução**: Use bibliotecas de validação como Joi, Zod ou celebrate

2. **Path Matching**: Mudanças no comportamento do path-to-regexp
   - **Verificar**: Rotas que usam patterns complexos

3. **Node.js Support**: Requer Node.js 18+

### Recomendações de Migração

#### Para Validação de Rotas
```typescript
// ❌ Antes (não suportado no Express v5)
app.get('/users/:id(\\d+)', handler);

// ✅ Depois (usando celebrate/Joi)
import { celebrate, Joi, Segments } from 'celebrate';

app.get('/users/:id', 
  celebrate({
    [Segments.PARAMS]: Joi.object().keys({
      id: Joi.number().integer().positive().required()
    })
  }),
  handler
);
```

## 🔧 Configurações Adicionais

### Engines no package.json
Adicionado especificação de versões mínimas:
```json
{
  "engines": {
    "node": ">=22.11.0",
    "pnpm": ">=10.0.0"
  }
}
```

## 📚 Recursos Úteis

- [Node.js 22 LTS Release Notes](https://nodejs.org/en/blog/release/v22.11.0)
- [Express v5 Migration Guide](https://expressjs.com/en/guide/migrating-5.html)
- [TypeORM 0.3.24 Changelog](https://github.com/typeorm/typeorm/releases/tag/0.3.24)
- [TypeScript 5.7 Release Notes](https://devblogs.microsoft.com/typescript/announcing-typescript-5-7/)

## 🐛 Solução de Problemas

### Erro de Compatibilidade de Node.js
```bash
# Verificar versão do Node.js
node --version

# Se menor que 22.11.0, atualize o Node.js
```

### Problemas com Express v5
```bash
# Se houver problemas, temporariamente volte para v4
pnpm add express@^4.21.1

# E ajuste as rotas conforme necessário
```

### Cache de Dependências
```bash
# Limpar cache do pnpm
pnpm store prune

# Reinstalar tudo
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## ✅ Checklist de Verificação

- [ ] Node.js 22.11.0+ instalado
- [ ] Dependências atualizadas com `pnpm install`
- [ ] Aplicação inicia sem erros
- [ ] Testes passando
- [ ] Rotas funcionando corretamente
- [ ] Validações de entrada funcionando
- [ ] Build de produção funcionando
- [ ] Migrações do banco executando

---

**Data da atualização**: $(date)
**Versões LTS utilizadas**: Node.js 22.11.0, Express 5.0.1, TypeORM 0.3.24, TypeScript 5.7.2