#!/bin/bash

# Health Check Script for Deep Insights NEET Production
# Monitors all components and provides detailed health status

set -e

NAMESPACE=${NAMESPACE:-"production"}
API_SERVICE=${API_SERVICE:-"neet-insights-service"}
TIMEOUT=30

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🏥 Deep Insights NEET - Production Health Check${NC}\n"
echo "Namespace: $NAMESPACE"
echo "Timestamp: $(date)"
echo "---"

# 1. Check Kubernetes Cluster
echo -e "\n${YELLOW}1. Kubernetes Cluster${NC}"
if kubectl cluster-info &> /dev/null; then
    echo -e "${GREEN}✓${NC} Cluster accessible"
    kubectl get nodes | tail -n +2 | while read -r line; do
        echo "  Node: $line"
    done
else
    echo -e "${RED}✗${NC} Cluster not accessible"
    exit 1
fi

# 2. Check Namespace
echo -e "\n${YELLOW}2. Namespace Status${NC}"
if kubectl get namespace $NAMESPACE &> /dev/null; then
    echo -e "${GREEN}✓${NC} Namespace exists"
else
    echo -e "${RED}✗${NC} Namespace does not exist"
    exit 1
fi

# 3. Check Pods
echo -e "\n${YELLOW}3. Pod Status${NC}"
TOTAL_PODS=$(kubectl get pods -n $NAMESPACE --no-headers | wc -l)
RUNNING_PODS=$(kubectl get pods -n $NAMESPACE --field-selector=status.phase=Running --no-headers | wc -l)
echo "Running: $RUNNING_PODS/$TOTAL_PODS pods"

if [ $RUNNING_PODS -lt 5 ]; then
    echo -e "${RED}✗${NC} Too few pods running"
else
    echo -e "${GREEN}✓${NC} Sufficient pods running"
fi

# 4. Check API Service
echo -e "\n${YELLOW}4. API Service${NC}"
if kubectl get service $API_SERVICE -n $NAMESPACE &> /dev/null; then
    echo -e "${GREEN}✓${NC} Service exists"
    LB_IP=$(kubectl get service $API_SERVICE -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
    if [ -z "$LB_IP" ]; then
        LB_IP="<pending>"
    fi
    echo "  External IP: $LB_IP"
else
    echo -e "${RED}✗${NC} Service not found"
fi

# 5. Check Database
echo -e "\n${YELLOW}5. Database Status${NC}"
DB_POD=$(kubectl get pod -n $NAMESPACE -l app=postgres -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -z "$DB_POD" ]; then
    echo -e "${RED}✗${NC} No database pod found"
else
    if kubectl exec -n $NAMESPACE $DB_POD -- pg_isready -U postgres &> /dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL is ready"
        
        # Check connections
        CONN_COUNT=$(kubectl exec -n $NAMESPACE $DB_POD -- psql -U postgres -t -c "SELECT count(*) FROM pg_stat_activity;" 2>/dev/null || echo "0")
        echo "  Active connections: $CONN_COUNT"
    else
        echo -e "${RED}✗${NC} PostgreSQL not responding"
    fi
fi

# 6. Check Redis
echo -e "\n${YELLOW}6. Cache Status${NC}"
REDIS_POD=$(kubectl get pod -n $NAMESPACE -l app=redis -o jsonpath='{.items[0].metadata.name}' 2>/dev/null || echo "")
if [ -z "$REDIS_POD" ]; then
    echo -e "${RED}✗${NC} No Redis pod found"
else
    if kubectl exec -n $NAMESPACE $REDIS_POD -- redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓${NC} Redis is responding"
        
        # Check memory
        MEM=$(kubectl exec -n $NAMESPACE $REDIS_POD -- redis-cli info memory 2>/dev/null | grep used_memory_human | cut -d: -f2 | tr -d '\r')
        echo "  Memory usage: $MEM"
    else
        echo -e "${RED}✗${NC} Redis not responding"
    fi
fi

# 7. Check Resource Usage
echo -e "\n${YELLOW}7. Resource Usage${NC}"
TOTAL_CPU=$(kubectl top nodes --no-headers 2>/dev/null | awk '{sum+=$2} END {print sum"m"}' || echo "N/A")
TOTAL_MEM=$(kubectl top nodes --no-headers 2>/dev/null | awk '{sum+=$4} END {print sum"Mi"}' || echo "N/A")
echo "Cluster CPU: $TOTAL_CPU"
echo "Cluster Memory: $TOTAL_MEM"

# 8. Check API Endpoint
echo -e "\n${YELLOW}8. API Health Check${NC}"
if [ ! -z "$LB_IP" ] && [ "$LB_IP" != "<pending>" ]; then
    RESPONSE=$(curl -s -w "\n%{http_code}" http://$LB_IP/health --connect-timeout 5 || echo "000")
    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    
    if [ "$HTTP_CODE" == "200" ]; then
        echo -e "${GREEN}✓${NC} API is responding (HTTP $HTTP_CODE)"
    else
        echo -e "${RED}✗${NC} API returned HTTP $HTTP_CODE"
    fi
else
    echo -e "${YELLOW}⏳${NC} Load Balancer IP not yet assigned"
fi

# 9. Check Error Logs
echo -e "\n${YELLOW}9. Recent Errors${NC}"
ERROR_COUNT=$(kubectl logs -n $NAMESPACE -l app=neet-insights --tail=100 2>/dev/null | grep -i "error" | wc -l || echo "0")
if [ $ERROR_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓${NC} No errors in recent logs"
else
    echo -e "${YELLOW}⚠${NC}  Found $ERROR_COUNT errors in recent logs"
    kubectl logs -n $NAMESPACE -l app=neet-insights --tail=10 2>/dev/null | grep -i "error" | head -3
fi

# 10. Final Status
echo -e "\n${YELLOW}10. Overall Status${NC}"
if [ $RUNNING_PODS -lt 5 ]; then
    echo -e "${RED}✗${NC} System is NOT healthy - insufficient pods"
    exit 1
elif [ ! -z "$DB_POD" ] && [ ! -z "$REDIS_POD" ]; then
    echo -e "${GREEN}✓${NC} System is HEALTHY and ready for production"
    exit 0
else
    echo -e "${YELLOW}⚠${NC}  System is partially healthy - check components"
    exit 0
fi
