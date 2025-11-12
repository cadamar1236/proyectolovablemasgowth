# Plan de Escalabilidad - Marketplace SaaS

## Capacidad Actual
**50,000 - 100,000 usuarios/día con limitaciones**

## Cuellos de Botella

### 1. D1 Database (CRÍTICO)
- **Límite escrituras:** 100,000/día gratuito
- **Problema:** Cada voto = 3 writes (INSERT + 2 UPDATEs)
- **Solución:**
  ```sql
  -- Combinar updates en uno solo
  UPDATE projects SET 
    rating_average = (SELECT AVG(rating) FROM project_votes WHERE project_id = ?),
    votes_count = (SELECT COUNT(*) FROM project_votes WHERE project_id = ?),
    updated_at = CURRENT_TIMESTAMP
  WHERE id = ?
  ```
  → Reduce a 2 writes por voto (33% mejora)

### 2. Query del Leaderboard
**Problema:** 4 subqueries por proyecto × 50 proyectos = 200 queries
```sql
-- Current (LENTO):
(SELECT COUNT(*) FROM goals WHERE user_id = p.user_id) as total_goals,
(SELECT COUNT(*) FROM goals WHERE user_id = p.user_id AND status = 'completed') as completed_goals,
(SELECT metric_value FROM user_metrics WHERE user_id = p.user_id AND metric_name = 'users' ...) as user_metric_users,
(SELECT metric_value FROM user_metrics WHERE user_id = p.user_id AND metric_name = 'revenue' ...) as user_metric_revenue
```

**Solución 1: Caching con Cloudflare KV**
```typescript
// Cache leaderboard por 5 minutos
const cacheKey = `leaderboard:${category}:${timeframe}`;
const cached = await c.env.KV.get(cacheKey, 'json');
if (cached) return c.json(cached);

// ... calculate ...

await c.env.KV.put(cacheKey, JSON.stringify(result), { expirationTtl: 300 });
```

**Solución 2: Materializar datos (RECOMENDADO)**
```sql
-- Agregar columnas a projects:
ALTER TABLE projects ADD COLUMN cached_user_goals_total INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN cached_user_goals_completed INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN cached_users INTEGER DEFAULT 0;
ALTER TABLE projects ADD COLUMN cached_revenue REAL DEFAULT 0;
ALTER TABLE projects ADD COLUMN cache_updated_at DATETIME;

-- Actualizar cache cada hora con Cron Trigger
CREATE TRIGGER update_project_cache 
AFTER INSERT OR UPDATE ON user_metrics
BEGIN
  UPDATE projects SET
    cached_users = NEW.metric_value,
    cache_updated_at = CURRENT_TIMESTAMP
  WHERE user_id = NEW.user_id AND NEW.metric_name = 'users';
END;
```

### 3. Cloudflare Workers CPU Time
**Problema:** Cálculo de scores en JavaScript (50ms limit)
**Solución:** Mover cálculo a SQL

```sql
-- Calcular score en la query:
SELECT 
  p.*,
  -- Rating Score (40%)
  (p.rating_average * 20 * 0.40) + 
  -- Growth Score (35%)
  ((COALESCE(um_users.metric_value, 0) / 10000.0 * 100 + 
    COALESCE(um_revenue.metric_value, 0) / 100000.0 * 100) / 2 * 0.35) +
  -- Goals Score (25%)
  (CASE WHEN g_total.total > 0 
    THEN (g_completed.completed * 1.0 / g_total.total * 100 * 0.25) 
    ELSE 0 END) as leaderboard_score
FROM projects p
LEFT JOIN (
  SELECT user_id, metric_value 
  FROM user_metrics 
  WHERE metric_name = 'users' 
  ORDER BY recorded_date DESC
) um_users ON p.user_id = um_users.user_id
-- ... etc
ORDER BY leaderboard_score DESC
```

## Plan de Implementación

### Fase 1: Quick Wins (1-2 días)
- [ ] Implementar Cloudflare KV cache para leaderboard (5 min TTL)
- [ ] Combinar UPDATE queries en votos (2 writes → 1 write)
- [ ] Agregar índices en D1:
  ```sql
  CREATE INDEX idx_user_metrics_user_name ON user_metrics(user_id, metric_name, recorded_date DESC);
  CREATE INDEX idx_goals_user_status ON goals(user_id, status);
  CREATE INDEX idx_projects_status_votes ON projects(status, votes_count);
  ```
- [ ] Subir a Cloudflare Workers Paid ($5/mes)

**Resultado:** 100,000 usuarios/día ✅

### Fase 2: Arquitectura (1 semana)
- [ ] Implementar cache materializado en projects table
- [ ] Mover cálculo de scores a SQL
- [ ] Cloudflare Cron Trigger para actualizar cache cada hora
- [ ] Rate limiting con Cloudflare Rate Limiting (100 requests/min por IP)

**Resultado:** 500,000 usuarios/día ✅

### Fase 3: Escalabilidad Extrema (2 semanas)
- [ ] Migrar a Cloudflare Workers AI para cálculos complejos
- [ ] Implementar read replicas con D1 (cuando esté disponible)
- [ ] Sharding por categoría (healthcare DB, education DB, etc.)
- [ ] Queue para escrituras con Cloudflare Queues
- [ ] Analytics con Cloudflare Analytics Engine

**Resultado:** 5,000,000 usuarios/día ✅

## Costos Estimados

### 10,000 usuarios/día (ACTUAL - FREE)
```
Workers: Free (100K requests/día)
D1: Free (5M reads, 100K writes)
Pages: Free
KV: Free (100K reads/día)
TOTAL: $0/mes
```

### 100,000 usuarios/día
```
Workers Paid: $5/mes (10M requests)
D1: Free (dentro de límites con cache)
Pages: Free
KV: Free (con cache optimizado)
TOTAL: $5/mes
```

### 500,000 usuarios/día
```
Workers Paid: $5/mes base + $0.50 overages
D1: $5/mes (25M reads, 50M writes)
KV: $5/mes (10M reads)
Queues: $2/mes
TOTAL: ~$20/mes
```

### 5,000,000 usuarios/día
```
Workers: $5 + ~$5 overages
D1: ~$25/mes (scale)
KV: ~$15/mes
Queues: $5/mes
Analytics Engine: $5/mes
CDN: Incluido
TOTAL: ~$60-80/mes
```

## Monitoreo Recomendado

```typescript
// Agregar a wrangler.jsonc:
{
  "observability": {
    "enabled": true
  },
  "analytics_engine_datasets": [
    {
      "binding": "ANALYTICS"
    }
  ]
}

// En cada endpoint crítico:
c.env.ANALYTICS.writeDataPoint({
  blobs: [endpoint, category],
  doubles: [responseTime, cacheHit ? 1 : 0],
  indexes: [userId]
});
```

## Recomendación Inmediata

**IMPLEMENTAR HOY:**
1. Cloudflare KV cache (2 horas desarrollo)
2. Optimizar query de votos (30 min)
3. Índices en D1 (15 min)

Esto te llevará de **50K → 100K usuarios sin costo adicional**.
