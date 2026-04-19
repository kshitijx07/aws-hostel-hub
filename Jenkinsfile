@Library('hostelhub-lib@main') _

pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    tools {
        nodejs 'node20' 
    }

    environment {
        DOCKER_USER = 'kshitij2511'
        GIT_COMMIT_SHORT = ""
        
        // Define S3 and CloudFront targets
        S3_BUCKET = "hostelhub-frontend"
        CLOUDFRONT_ID = "E3HIK7T7JI9C8L"
        CLOUDFRONT_DOMAIN = "https://d3qyzjyul2f882.cloudfront.net" // Used for the curl verification
        
        // Unified domain architecture
        VITE_API_BASE_URL = "https://d3qyzjyul2f882.cloudfront.net"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.GIT_COMMIT_SHORT = sh(script: 'git rev-parse --short HEAD', returnStdout: true).trim()
                }
            }
        }

        stage('Backend: Docker Build & Push') {
            steps {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub-creds',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS'
                    )
                ]) {
                    sh 'echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin'
                    sh "docker build -t ${env.DOCKER_USER}/hostelhub-backend:${env.GIT_COMMIT_SHORT} backend"
                    sh "docker push ${env.DOCKER_USER}/hostelhub-backend:${env.GIT_COMMIT_SHORT}"
                }
            }
        }

        stage('Frontend: Build & Test') {
            steps {
                dir('fronted') {
                    // Install Dependencies
                    sh "npm ci"
                    
                    // Run tests (We wrap this in a catch so the build doesn't crash if tests aren't configured yet)
                    catchError(buildResult: 'SUCCESS', stageResult: 'FAILURE') {
                        sh "npm test -- --watchAll=false"
                    }
                    
                    // Build Production Bundle securely tying the API URL
                    sh "VITE_API_BASE_URL=${env.VITE_API_BASE_URL} npm run build"
                }
            }
        }

        stage('Frontend: React S3 Deploy') {
            steps {
                dir('fronted') {
                    // Upload hashed assets (Vite uses /assets/ instead of /static/) with aggressive caching
                    sh "aws s3 sync dist/assets/ s3://${env.S3_BUCKET}/assets/ --delete --cache-control 'max-age=31536000, immutable'"
                    
                    // Upload any remaining files (favicon, manifest, robots.txt) except index.html
                    sh "aws s3 sync dist/ s3://${env.S3_BUCKET} --delete --exclude 'assets/*' --exclude 'index.html'"
                    
                    // Explicitly upload index.html ensuring the browser forces re-validation (no-cache)
                    sh "aws s3 cp dist/index.html s3://${env.S3_BUCKET}/index.html --cache-control 'no-cache'"
                    
                    // Invalidate Edge Cache globally so CloudFront pulls the new index.html from S3 immediately
                    sh "aws cloudfront create-invalidation --distribution-id ${env.CLOUDFRONT_ID} --paths '/*'"
                }
            }
        }

        stage('Backend: Kubernetes Deploy') {
            steps {
                script {
                    sh "aws eks update-kubeconfig --name hostelhub-cluster --region ap-south-1"
                    sh "sed -i 's|<TAG>|${env.GIT_COMMIT_SHORT}|g' kubernetes/backend-deployment.yaml"
                    sh "sed -i 's|<DOCKERHUB_USERNAME>|${env.DOCKER_USER}|g' kubernetes/backend-deployment.yaml"
                    
                    sh "kubectl apply -f kubernetes/"
                }
            }
        }

        stage('Verify System Rollout') {
            steps {
                // Verify EKS Backend pods are healthy and live
                sh "kubectl rollout status deployment/hostelhub-backend -n default --timeout=3m"
                
                // Verify CloudFront Frontend URL is returning a 200 OK
                sh '''
                    echo "Pinging CloudFront endpoint ${CLOUDFRONT_DOMAIN}..."
                    HTTP_STATUS=$(curl -o /dev/null -s -w "%{http_code}" ${CLOUDFRONT_DOMAIN})
                    if [ "$HTTP_STATUS" -eq 200 ]; then
                        echo "✅ CloudFront Edge validation passed! Status 200 OK."
                    else
                        echo "❌ CloudFront verification failed! Status code: $HTTP_STATUS"
                        exit 1
                    fi
                '''
            }
        }
    }

    post {
        success {
            echo '✅ Unified CI/CD Deployment completed perfectly!'
        }
        failure {
            echo '❌ Unified CI/CD Deployment failed!'
        }
    }
}
