#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting deployment process...${NC}"

# Check if kubectl is installed
if ! command -v kubectl &> /dev/null; then
    echo -e "${RED}kubectl is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if helm is installed
if ! command -v helm &> /dev/null; then
    echo -e "${RED}helm is not installed. Please install it first.${NC}"
    exit 1
fi

# Create namespace
echo -e "${GREEN}Creating namespace...${NC}"
kubectl create namespace attendance-manager

# Add required Helm repositories
echo -e "${GREEN}Adding Helm repositories...${NC}"
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

# Install Prometheus
echo -e "${GREEN}Installing Prometheus...${NC}"
helm install prometheus prometheus-community/kube-prometheus-stack \
    --namespace attendance-manager \
    --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false

# Install Grafana
echo -e "${GREEN}Installing Grafana...${NC}"
helm install grafana grafana/grafana \
    --namespace attendance-manager \
    --set persistence.enabled=true \
    --set service.type=LoadBalancer

# Create secrets
echo -e "${GREEN}Creating secrets...${NC}"
kubectl create secret generic mongodb-secret \
    --namespace attendance-manager \
    --from-literal=uri="mongodb://mongodb:27017/attendance-manager"

kubectl create secret generic jwt-secret \
    --namespace attendance-manager \
    --from-literal=secret="your-secure-jwt-secret"

# Apply Kubernetes configurations
echo -e "${GREEN}Applying Kubernetes configurations...${NC}"
kubectl apply -f k8s/deployment.yaml
kubectl apply -f k8s/monitoring.yaml
kubectl apply -f k8s/backup.yaml

# Wait for deployments to be ready
echo -e "${GREEN}Waiting for deployments to be ready...${NC}"
kubectl wait --for=condition=available --timeout=300s deployment/attendance-manager -n attendance-manager

# Get service URLs
echo -e "${GREEN}Getting service URLs...${NC}"
APP_URL=$(kubectl get service attendance-manager -n attendance-manager -o jsonpath='{.status.loadBalancer.ingress[0].ip}')
GRAFANA_URL=$(kubectl get service grafana -n attendance-manager -o jsonpath='{.status.loadBalancer.ingress[0].ip}')

echo -e "${GREEN}Deployment completed!${NC}"
echo -e "Application URL: http://${APP_URL}"
echo -e "Grafana Dashboard: http://${GRAFANA_URL}:3000"
echo -e "Default Grafana credentials: admin/admin"

# Print monitoring instructions
echo -e "\n${GREEN}Monitoring Setup:${NC}"
echo "1. Access Grafana at http://${GRAFANA_URL}:3000"
echo "2. Add Prometheus as a data source (URL: http://prometheus-server:9090)"
echo "3. Import the dashboard from the ConfigMap"
echo "4. Set up alert notifications in Grafana"

# Print backup instructions
echo -e "\n${GREEN}Backup Setup:${NC}"
echo "1. Configure AWS credentials in the aws-secret"
echo "2. Verify the backup CronJob is running: kubectl get cronjobs -n attendance-manager"
echo "3. Check backup logs: kubectl logs -n attendance-manager -l job-name=mongodb-backup"

echo -e "\n${GREEN}Deployment and monitoring setup completed!${NC}" 