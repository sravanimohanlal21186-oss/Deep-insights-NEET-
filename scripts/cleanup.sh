#!/bin/bash

set -e

NAMESPACE=${NAMESPACE:-"production"}

echo "🧹 Cleaning up Deep Insights NEET deployment..."

# Scale down to 0
echo "Scaling deployment to 0..."
kubectl scale deployment neet-insights -n $NAMESPACE --replicas=0

# Wait for pods to terminate
echo "Waiting for pods to terminate..."
kubectl wait --for=delete pod -l app=neet-insights -n $NAMESPACE --timeout=30s || true

# Delete resources
echo "Deleting Kubernetes resources..."
kubectl delete all -l app=neet-insights -n $NAMESPACE --ignore-not-found=true

# Delete persistent volumes
echo "Deleting persistent volumes..."
kubectl delete pvc -l app=neet-insights -n $NAMESPACE --ignore-not-found=true

# Delete namespace
read -p "Delete namespace $NAMESPACE? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    kubectl delete namespace $NAMESPACE
    echo "✅ Namespace deleted"
else
    echo "⏭️  Skipped namespace deletion"
fi

echo "✅ Cleanup completed"
