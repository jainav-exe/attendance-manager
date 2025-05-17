# Attendance Manager System

A scalable attendance management system with role-based access control, monitoring, and automated backups.

## Features

- Role-based access control (Admin, Teacher, Student)
- Real-time attendance tracking
- Automated absence marking
- Daily and period-specific messages
- Timetable management
- Monitoring and alerting
- Automated database backups
- HTTPS with secure headers

## Prerequisites

- Kubernetes cluster
- kubectl
- Helm
- AWS account (for backups)
- MongoDB

## Deployment

1. Clone the repository:
```bash
git clone <repository-url>
cd attendance-manager
```

2. Make the deployment script executable:
```bash
chmod +x deploy.sh
```

3. Update the configuration:
   - Edit `k8s/deployment.yaml` to set your domain name
   - Update `k8s/backup.yaml` with your AWS S3 bucket name
   - Modify secrets in `deploy.sh` with your secure values

4. Run the deployment script:
```bash
./deploy.sh
```

## Monitoring

The system includes:

- Prometheus for metrics collection
- Grafana for visualization
- Alert rules for:
  - High error rates
  - High latency
  - Service downtime
  - Database connection issues

Access the Grafana dashboard at `http://<grafana-url>:3000` (default credentials: admin/admin)

## Database Backups

Daily backups are automatically created and stored in AWS S3. To configure:

1. Create an AWS S3 bucket for backups
2. Create an IAM user with S3 access
3. Add AWS credentials to Kubernetes:
```bash
kubectl create secret generic aws-secret \
  --namespace attendance-manager \
  --from-literal=access-key=<your-access-key> \
  --from-literal=secret-key=<your-secret-key>
```

## Security Features

- HTTPS with Let's Encrypt certificates
- Secure headers (HSTS, CSP, etc.)
- Rate limiting
- Input sanitization
- JWT authentication
- Role-based access control

## Scaling

The system is designed to handle 8,000+ users with:

- Horizontal pod autoscaling
- Database connection pooling
- Efficient indexing
- Caching strategies
- Load balancing

## Development

For local development:

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB:
```bash
docker-compose up -d mongodb
```

3. Start the application:
```bash
npm run dev
```

## Testing

Run the test suite:
```bash
npm test
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License 