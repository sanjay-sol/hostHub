# HostHub

HostHub is a platform that allows users to deploy their React projects by providing a GitHub URL. It spins up a Docker container to generate build scripts and uploads files to AWS S3. Build logs are pub/sub to Redis with sockets for subscriptions, and a reverse proxy optimizes S3 object streaming.

## System Architecture


<img width="1316" alt="host-hub" src="https://github.com/sanjay-sol/hostHub/assets/114111046/2840096e-a3db-44a9-8104-9ccbff86a045">

## Tech Stack

- Docker
- Node.js
- AWS S3
- Redis
- Socket.io

# Local Setup

#  api-server

1. setup .env

```
AWS_ACCESSKEY_ID = 'AKIA....'
AWS_SECRET_ACCESS_KEY = 'mq++8uqQ.....'
AWS_REGION = "ap-south-1" // any...
AWS_CLUSTER = "arn:aws:ecs:ap-south-1:855...."
AWS_TASK = "arn:aws:ecs:ap-south-1:855829953...."
AWS_SUBNET1 = "zp---"
AWS_SUBNET2 = "zp---"
AWS_SUBNET3 = "zp---"

REDIS_URL = "rediss:/default:AVNS_uwUrvXtzo......"
DATABASE_URL="postgres://avnadmin:AVNS_gDGU......."

```

For redis and postgreSQL urls - setup locally OR get from here [aiven](https://aiven.io/)

2. setup prisma
```
npx prisma init --datasource-provider sqlite
npx prisma migrate dev --name init
```
3. run the file
```
npm start

```
4. view the DB - open localhost:5000
```
npx prisma studio
```

# s3-reverse-proxy

1. setup .env
```
BASE_PATH = "aws bucketpath ...."
```

2. Run the files
```
node index.js```
```
# server

1. setup .env
```
AWS_ACCESSKEY_ID='AKI...........'
AWS_SECRET_ACCESS_KEY = '4b0B0........./'
AWS_REGION = "ap-s..."
AWS_BUCKET_NAME = "bucket-name"
```
2. setup docker 
```
1. aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 8558....amazonaws.com
2. docker build -t build-server .
3. docker tag build-server:latest 8558......amazonaws.com/build-server:latest
4. docker push 855....1.amazonaws.com/build-server:latest
```

# web-sockets
1. setup .env
```
REDIS_URL = "aiven:23...." // setup locally or get from here [aiven] https://aiven.io/

```
2. run the files
```
node index.js
```