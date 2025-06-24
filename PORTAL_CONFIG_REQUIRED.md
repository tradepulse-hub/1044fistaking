# 🚨 CONFIGURAÇÃO ADICIONAL NECESSÁRIA NO WORLD DEVELOPER PORTAL

## ❌ **PROBLEMA IDENTIFICADO:**

O erro `disallowed_operation` indica que o **contrato do token TPF** não está configurado no portal para permitir a função `approve`.

## ✅ **SOLUÇÃO:**

### 1. **Adicionar Token Contract aos Contract Entrypoints**

No World Developer Portal, vá para:
**Configuration → Advanced → Contract Entrypoints**

**ADICIONE ESTE ENDEREÇO:**
\`\`\`
0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45
\`\`\`

### 2. **Configuração Atual vs Necessária:**

**✅ JÁ CONFIGURADO:**
- `0x51bd987FA376C92c5293cff5E62963D7Ea3e51Bf` (Staking Contract)
- `0xE4501fC658bea09D44512494C950c2b2748b176A` (Reward Token)
- `0x000000000022D473030F116dDEE9F6B43aC78BA3` (Permit2)

**❌ FALTANDO:**
- `0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45` (TPF Token - para approve)

### 3. **Lista Completa para Contract Entrypoints:**

\`\`\`
0x51bd987FA376C92c5293cff5E62963D7Ea3e51Bf
0xE4501fC658bea09D44512494C950c2b2748b176A
0x834a73c0a83F3BCe349A116FFB2A4c2d1C651E45
0x000000000022D473030F116dDEE9F6B43aC78BA3
\`\`\`

## 🎯 **MÉTODOS DISPONÍVEIS:**

### 1. **Direct Stake** (Recomendado)
- ✅ Funciona sem approve
- ✅ Mais simples
- ✅ Menos transações

### 2. **Approve + Stake**
- ❌ Requer token contract no portal
- ⚠️ Duas transações
- 💰 Mais gas

### 3. **Permit2**
- ❌ Falha na simulação
- ⚠️ Complexo
- 🔧 Requer configuração avançada

## 🚀 **RECOMENDAÇÃO:**

**Use o método "Direct Stake"** que deve funcionar sem configuração adicional, assumindo que o contrato de staking já tem permissão para transferir tokens ou usa um mecanismo interno.
