# 🔧 Correções Técnicas - Métricas Dashboard Yamuna

## 🚨 PROBLEMAS CRÍTICOS ENCONTRADOS

### 1. Clientes Adquiridos (CRÍTICO)

**Arquivo:** `src/app/actions.ts` (linha 201)

```typescript
// ❌ ATUAL - INCORRETO
const acquiredCustomers = googleData?.purchasers || 0;
// PROBLEMA: purchasers = totalUsers do GA4, não clientes que compraram!
```

**Correção Necessária:**
```typescript
// ✅ CORRETO - Contar primeiras compras do período
async function countFirstTimeBuyers(
  tinyOrders: any[], 
  wakeOrders: any[], 
  startDate: string, 
  endDate: string
): Promise<number> {
  // Combinar pedidos de ambas as fontes
  const allOrders = [...tinyOrders, ...wakeOrders];
  
  // Agrupar por cliente e encontrar data da primeira compra
  const customerFirstPurchase = new Map<string, Date>();
  
  allOrders.forEach(order => {
    const customerId = order.cliente_id || order.customer_id || order.email;
    const orderDate = parseOrderDate(order);
    
    if (!customerFirstPurchase.has(customerId) || 
        orderDate < customerFirstPurchase.get(customerId)!) {
      customerFirstPurchase.set(customerId, orderDate);
    }
  });
  
  // Contar clientes cuja primeira compra está no período
  const start = parseISO(startDate);
  const end = parseISO(endDate);
  
  return Array.from(customerFirstPurchase.values())
    .filter(date => date >= start && date <= end)
    .length;
}
```

---

### 2. LTV 12 Meses (CRÍTICO)

**Arquivo:** `src/app/actions.ts` (linha 192-193)

```typescript
// ❌ ATUAL - INCORRETO
const uniqueCustomers12m = google12m?.purchasers || 0; // É totalUsers!
const ltv12m = uniqueCustomers12m > 0 ? revenue12m / uniqueCustomers12m : 0;
```

**Correção Necessária:**
```typescript
// ✅ CORRETO - Usar clientes únicos do Tiny/Wake
async function getUniqueCustomers12m(startDate: string, endDate: string): Promise<number> {
  const [tinyOrders, wakeOrders] = await Promise.all([
    getTinyOrders(startDate, endDate),
    getWakeOrders(startDate, endDate)
  ]);
  
  const uniqueCustomers = new Set<string>();
  
  [...tinyOrders, ...wakeOrders].forEach(order => {
    const customerId = order.cliente_id || order.customer_id || order.email;
    if (customerId) uniqueCustomers.add(customerId);
  });
  
  return uniqueCustomers.size;
}

const uniqueCustomers12m = await getUniqueCustomers12m(start12mStr, end12mStr);
const ltv12m = uniqueCustomers12m > 0 ? revenue12m / uniqueCustomers12m : 0;
```

---

### 3. Receita Nova vs Retenção (CRÍTICO)

**Arquivo:** `src/app/actions.ts` (linhas 147-165)

```typescript
// ❌ ATUAL - ESTIMATIVA IMPRECISA
const newCustomerRatio = totalPurchasers > 0 
  ? Math.min(newUsers / totalPurchasers, 1.0) 
  : 0.25;
const newRevenue = totalRevenue * newCustomerRatio;
const retentionRevenue = totalRevenue - newRevenue;
```

**Correção Necessária:**
```typescript
// ✅ CORRETO - Calcular baseado em dados reais de clientes
async function calculateRevenueSegmentation(
  orders: any[],
  startDate: string,
  endDate: string
): Promise<{ newRevenue: number; retentionRevenue: number; newCustomers: number }> {
  // Buscar histórico completo de clientes
  const historicalOrders = await getTinyOrders('2020-01-01', startDate);
  
  // Criar set de clientes que já compraram antes
  const existingCustomers = new Set<string>();
  historicalOrders.forEach(order => {
    const customerId = getCustomerId(order);
    if (customerId) existingCustomers.add(customerId);
  });
  
  let newRevenue = 0;
  let retentionRevenue = 0;
  let newCustomers = 0;
  const newCustomerIds = new Set<string>();
  
  orders.forEach(order => {
    const customerId = getCustomerId(order);
    const orderValue = order.total || 0;
    
    if (existingCustomers.has(customerId)) {
      // Cliente já existia
      retentionRevenue += orderValue;
    } else {
      // Novo cliente
      newRevenue += orderValue;
      if (!newCustomerIds.has(customerId)) {
        newCustomers++;
        newCustomerIds.add(customerId);
      }
    }
  });
  
  return { newRevenue, retentionRevenue, newCustomers };
}
```

---

### 4. Google Ads - Página Zerada (CRÍTICO)

**Arquivo:** `src/app/(dashboard)/google-ads/page.tsx`

```typescript
// ❌ ATUAL - DADOS HARDCODED
const metrics = {
  impressions: 0,
  clicks: 0,
  cpcAvg: 0,
  // ...todos zeros
};
const campaigns: any[] = [];
```

**Correção Necessária:**
Implementar serviço Google Ads similar ao Meta:

```typescript
// src/lib/services/google-ads.ts
import { google } from 'googleapis';

const GOOGLE_ADS_CUSTOMER_ID = process.env.GOOGLE_ADS_CUSTOMER_ID;
const GOOGLE_ADS_DEVELOPER_TOKEN = process.env.GOOGLE_ADS_DEVELOPER_TOKEN;

export async function getGoogleAdsCampaigns(startDate: string, endDate: string) {
  // Implementar usando Google Ads API
  // Requer: Developer Token, OAuth, Customer ID
}
```

---

### 5. Wake API Não Utilizada

**Arquivo:** `src/app/actions.ts` (linha 108)

```typescript
// ❌ ATUAL - Wake é buscado mas não usado
const [googleData, tinyOrdersRaw, metaData, wakeOrders] = await Promise.all([...]);
// wakeOrders nunca é processado!
```

**Correção Necessária:**
```typescript
// ✅ CORRETO - Consolidar Tiny + Wake
const tinyOrders = tinyOrdersRaw || [];
const wakeOrdersFiltered = (wakeOrders || []).map(normalizeWakeOrder);

// Merge sem duplicatas (por ID do pedido)
const allOrders = mergeOrders(tinyOrders, wakeOrdersFiltered);
const totalRevenue = allOrders.reduce((acc, order) => acc + order.total, 0);
```

---

## 📁 ARQUIVOS A CRIAR/MODIFICAR

### Novo: `src/lib/services/cache.ts`
```typescript
import { Redis } from '@upstash/redis';

const redis = process.env.UPSTASH_REDIS_REST_URL 
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
  : null;

export async function withCache<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = 300
): Promise<T> {
  if (!redis) return fetcher();
  
  const cached = await redis.get<T>(key);
  if (cached) return cached;
  
  const data = await fetcher();
  await redis.setex(key, ttl, data);
  return data;
}
```

### Novo: `src/lib/services/customers.ts`
```typescript
// Lógica de clientes novos vs recorrentes
export async function analyzeCustomers(orders: Order[], historicalOrders: Order[]) {
  // Implementar segmentação de clientes
}
```

### Modificar: `src/app/actions.ts`
- Adicionar cache
- Corrigir cálculo de acquiredCustomers
- Integrar Wake
- Separar métricas 12m

---

## 🔑 VARIÁVEIS DE AMBIENTE NECESSÁRIAS

```env
# Cache (Upstash)
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=

# Google Ads (para página Google Ads)
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_LOGIN_CUSTOMER_ID=

# Existentes (verificar se corretas)
TINY_API_TOKEN=
WAKE_API_URL=
WAKE_API_TOKEN=
GA4_PROPERTY_ID=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=
META_ADS_ACCESS_TOKEN=
META_ADS_ACCOUNT_ID=
```

---

## 📊 COMPARAÇÃO: ANTES vs DEPOIS

| Métrica | Fórmula Atual | Fórmula Correta (PDF) |
|---------|---------------|----------------------|
| Clientes Adquiridos | GA4 totalUsers | COUNT(first_purchase in period) |
| CAC | investment / GA4.users | investment / newCustomers |
| LTV 12m | revenue12m / GA4.users | revenue12m / uniqueCustomers12m |
| Retenção | revenue * (1 - newUserRatio) | SUM(revenue WHERE returning) |
| Receita Nova | revenue * newUserRatio | SUM(revenue WHERE first_purchase) |

---

## ⚠️ ORDEM DE IMPLEMENTAÇÃO

1. **Cache primeiro** - Reduz carga nas APIs
2. **Corrigir acquiredCustomers** - Métrica mais crítica
3. **Corrigir LTV** - Depende de customers corretos
4. **Implementar Retenção/Receita Nova** - Requer histórico
5. **Integrar Wake** - Dados complementares
6. **Google Ads API** - Página funcional
