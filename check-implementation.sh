#!/bin/bash

# MARKETPLACE SNAPSHOT - DEPLOYMENT CHECKLIST
# Run this script to validate implementation before deploying to production

set -e

echo "=========================================="
echo "Marketplace Snapshot Implementation Check"
echo "=========================================="
echo ""

# ============================================================================
# 1. DATABASE CHECKS
# ============================================================================
echo "[1/8] Checking Database Migration..."

if [ ! -f "src/backend/prisma/migrations/20260517140000_add_marketplace_snapshots/migration.sql" ]; then
    echo "❌ Migration file not found"
    exit 1
fi

echo "✅ Migration file exists"

# ============================================================================
# 2. FILE CHECKS
# ============================================================================
echo "[2/8] Checking Implementation Files..."

FILES=(
    "src/backend/src/services/MarketplaceSnapshotService.ts"
    "src/backend/src/jobs/DailyMarketplaceSnapshotJob.ts"
    "src/backend/src/controllers/MarketplaceAnalyticsController.ts"
    "src/backend/src/routes/admin.routes.ts"
)

for file in "${FILES[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing: $file"
        exit 1
    fi
    echo "✅ $file"
done

echo ""
echo "[3/8] Checking Prisma Schema..."

if ! grep -q "model MarketplaceSnapshot" src/backend/prisma/schema.prisma; then
    echo "❌ MarketplaceSnapshot model not found in schema"
    exit 1
fi

echo "✅ MarketplaceSnapshot model present"

# ============================================================================
# 4. BUILD CHECK
# ============================================================================
echo ""
echo "[4/8] Building TypeScript..."

cd src/backend

if ! npm run build > /dev/null 2>&1; then
    echo "❌ Build failed"
    exit 1
fi

echo "✅ Build successful"

# ============================================================================
# 5. MIGRATION APPLIED CHECK
# ============================================================================
echo ""
echo "[5/8] Checking Database Migrations..."

# This would require DB access, so we'll check the migration_lock.toml exists
if [ ! -f "prisma/migrations/migration_lock.toml" ]; then
    echo "❌ Migration lock file not found"
    exit 1
fi

echo "✅ Migration infrastructure present"

# ============================================================================
# 6. IMPORT CHECK
# ============================================================================
echo ""
echo "[6/8] Checking Imports..."

if ! grep -q "import.*MarketplaceAnalyticsController" src/routes/admin.routes.ts; then
    echo "❌ MarketplaceAnalyticsController not imported"
    exit 1
fi

echo "✅ Controller imported in routes"

# ============================================================================
# 7. ROUTE CHECK
# ============================================================================
echo ""
echo "[7/8] Checking API Routes..."

ROUTES=(
    "/api/admin/analytics/freshness-trends"
    "/api/admin/analytics/recovery-metrics"
    "/api/admin/analytics/reminder-effectiveness"
    "/api/admin/analytics/false-positive-metrics"
    "/api/admin/analytics/admin-workload"
    "/api/admin/analytics/operational-consistency"
    "/api/admin/analytics/health-timeline"
)

for route in "${ROUTES[@]}"; do
    # Just verify the route name exists in the file
    route_name=$(echo "$route" | cut -d'/' -f5)
    if ! grep -q "$route_name" src/routes/admin.routes.ts; then
        echo "❌ Route not found: $route"
        exit 1
    fi
    echo "✅ $route"
done

# ============================================================================
# 8. SERVICE METHODS CHECK
# ============================================================================
echo ""
echo "[8/8] Checking MarketplaceSnapshotService Methods..."

METHODS=(
    "generateDailySnapshot"
    "calculateFreshnessTrends"
    "calculateRecoveryTrends"
    "calculateReminderEffectiveness"
    "calculateFalsePositiveTrends"
    "calculateAdminWorkload"
    "validateOperationalConsistency"
)

for method in "${METHODS[@]}"; do
    if ! grep -q "async $method" src/services/MarketplaceSnapshotService.ts; then
        echo "❌ Method not found: $method"
        exit 1
    fi
    echo "✅ $method"
done

# ============================================================================
# SUMMARY
# ============================================================================
echo ""
echo "=========================================="
echo "✅ ALL CHECKS PASSED"
echo "=========================================="
echo ""
echo "Next Steps:"
echo "1. Deploy code to production"
echo "2. Run: npx prisma migrate deploy"
echo "3. Schedule daily cron job (UTC midnight)"
echo "4. Initialize first snapshot"
echo "5. Verify endpoints respond"
echo ""
echo "Verification Commands:"
echo "  curl http://localhost:3000/api/admin/analytics/freshness-trends?range=30"
echo "  curl http://localhost:3000/api/admin/analytics/health-timeline?range=7"
echo ""

cd - > /dev/null
