#!/bin/bash

set -e

echo "🚀 Starting Deep Insights NEET Production Deployment"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOCKER_REGISTRY=${DOCKER_REGISTRY:-"docker.io"}
IMAGE_NAME="deep-insights-neet"
NAMESPACE=${NAMESPACE:-"production"}
CLUSTER_NAME=${CLUSTER_NAME:-"neet-cluster"}

# Check prerequisites
echo -e "${YELLOW}📋 Checking prerequisites...${NC}"

for cmd in kubectl docker git; do
    if ! command -v $cmd &> /dev/null; then
        echo -e "${RED}❌ $cmd is not installed${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Prerequisites met${NC}"

# Create namespace if not exists
echo -e "${YELLOW}📦 Setting up Kubernetes namespace...${NC}"
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Create secrets
echo -e "${YELLOW}🔐 Creating secrets...${NC}"
kubectl create secret generic postgres-secret \
    --from-literal=password=$(openssl rand -base64 32) \
    -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

kubectl create secret generic grafana-secret \
    --from-literal=password=$(openssl rand -base64 32) \
    -n $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Build Docker image
echo -e "${YELLOW}🐳 Building Docker image...${NC}"
docker build -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest -t ${DOCKER_REGISTRY}/${IMAGE_NAME}:$(git rev-parse --short HEAD) .

# Push to registry
echo -e "${YELLOW}📤 Pushing Docker image to registry...${NC}"
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:latest
docker push ${DOCKER_REGISTRY}/${IMAGE_NAME}:$(git rev-parse --short HEAD)

# Deploy Kubernetes resources
echo -e "${YELLOW}⚙️  Deploying Kubernetes resources...${NC}"

for file in k8s/*.yaml; do
    echo "Applying $file..."
    kubectl apply -f "$file" -n $NAMESPACE
done

# Wait for deployments
echo -e "${YELLOW}⏳ Waiting for deployments to be ready...${NC}"
kubectl rollout status deployment/postgres -n $NAMESPACE --timeout=10m
kubectl rollout status deployment/redis -n $NAMESPACE --timeout=5m
kubectl rollout status deployment/neet-insights -n $NAMESPACE --timeout=10m

# Verify health
echo -e "${YELLOW}🏥 Verifying health checks...${NC}"
READY_PODS=$(kubectl get pods -n $NAMESPACE -l app=neet-insights -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o 'True' | wc -l)
TOTAL_PODS=$(kubectl get pods -n $NAMESPACE -l app=neet-insights --no-headers | wc -l)

if [ "$READY_PODS" -gt 0 ]; then
    echo -e "${GREEN}✓ $READY_PODS/$TOTAL_PODS pods ready${NC}"
else
    echo -e "${RED}❌ No pods are ready${NC}"
    kubectl logs -n $NAMESPACE -l app=neet-insights --tail=50
    exit 1
fi

# Get service endpoints
echo -e "${YELLOW}🌐 Getting service endpoints...${NC}"
echo ""
echo -e "${GREEN}API Service:${NC}"
kubectl get svc neet-insights-service -n $NAMESPACE
echo ""
echo -e "${GREEN}Grafana Dashboard:${NC}"
kubectl get svc grafana -n $NAMESPACE
echo ""

# Display next steps
echo -e "${GREEN}✅ Deployment completed successfully!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Wait for load balancer to be ready (may take 2-5 minutes)"
echo "2. Get the external IP: kubectl get svc neet-insights-service -n $NAMESPACE"
echo "3. Point your domain to the external IP"
echo "4. Access Grafana: kubectl port-forward -n $NAMESPACE svc/grafana 3001:3001"
echo "5. Run load tests: npm run test:load"
echo ""
echo -e "${YELLOW}Monitoring:${NC}"
echo "kubectl logs -n $NAMESPACE -l app=neet-insights -f"
echo "kubectl top pods -n $NAMESPACE"
echo ""
