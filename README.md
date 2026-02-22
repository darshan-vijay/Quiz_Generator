# Foundations of Software Team 1, Quiz Making API

Mohammed Raihan Ullah, Nikhil Bailey, Vinay Rajesh, Darshan Vijayaraghavan, Onkar Apte, Jyotirmoy Karmakar.

## About this Project

Our project scrapes and collects documents from the web to generate quizzes on demand. The application leverages the capabilities of LLMs to create quiz questions based on the scraped data and user prompts. It then uses the Google Forms API to publish the generated quizzes on Google Forms.

# Demo Link: [Loom](https://www.loom.com/share/2025fb5d8bea46679c4feb12bd315b54) <br/>

Application code is in the current repository and the Infrastructure code continuous deployment was moved as per discussion in this repo https://gitlab.com/cu-group/quiz-proj

## Architecture Overview

![Architecture Diagram](src/public/images/architecture.jpg)

## Cloud Architecture

<img src="src/public/images/Cloud_Architecture.png" width="250">

This project is deployed on a Google Kubernetes Engine (GKE) cluster, which is provisioned and managed using Terraform. The infrastructure setup includes the following components:

### Ingress and DNS

We use the NGINX Ingress Controller within the GKE cluster to:

- Handle external HTTP(S) traffic.
- Enable path-based routing to different services such as `/api`, `/frontend`, and `/analyze`.
- Integrate with Cloud DNS using Ingress annotations, providing readable and managed domain names.

### TLS Certificate Management

To support secure communication, particularly with external services like the Google Forms API, a TLS certificate is maintained within the cluster:

- TLS certificates are issued and renewed using cert-manager and a ClusterIssuer.
- The NGINX Ingress resource is configured to terminate HTTPS traffic using these certificates.

### GitOps with ArgoCD

ArgoCD is deployed as an agent inside the GKE cluster to manage application state via GitOps:

- It continuously monitors a Git repository (e.g., GitLab) that contains Kubernetes manifests.
- ArgoCD automatically syncs the desired configuration from Git to the live cluster.
- This ensures reproducible, version-controlled, and automated deployments across environments.

## Technology stack

This codebase is written [Typescript](https://www.typescriptlang.org/) and uses [Express](https://expressjs.com/).
The frontend UI is written in [React](https://react.dev/).
It stores data in [PostgreSQL](https://www.postgresql.org/), [GitHub Action](https://github.com/features/actions) for continuous integration and ArgoCD for continuous deployment.

## Componenent Explanation

The application consists of three main components communicating through a PostgreSQL database:

#### 1. Collector (Data Collector)

A background process that scrapes and collects documents from various web sources, including web pages and PDFs, storing the raw data with titles in the database.

#### 2. Analyzer (Data Analyzer)

Another background process that processes the collected data. It leverages LLMs to generate quiz questions based on scraped content and user prompts. It also validates quiz data before storing it.

#### 3. Server (Web Application)

The central component that handles user interactions. It allows users to request quizzes, retrieves generated quizzes from the database, and invokes the Google Forms API to publish quizzes on Google Forms.

All components communicate through the SQL database, where raw data, quiz requests, and generated quizzes are stored.

## CI/CD Explanation

<img src="src/public/images/CICD_pipeline.png" width="250">

The application is currently deployed on Cloud Run using a container image stored in Google Artifact Registry. The deployment process begins with authentication via the Google Cloud CLI, followed by building and pushing the Docker image of the main application to the designated Artifact Registry repository. This image is then used to deploy the service on Cloud Run. All related commands and steps are documented in the `Deployment Commands` file within the project repository.

## Team Coordination Process

Regarding our coordination process, we mainly kept ourselves updated with weekly meeting (online or in-person). We share all of our progresses and also discuss if any problem if someone encountered. We tried to fix it as soon as possible either on a meet or by meeting in person. This mix of schedule meetings and flexible communication helped us to stay organised, resolve problems and blockers quickly, and keep the workflow smooth.

## Work Distribution Method

We divided tasks based on each team member's strengths and interests. Raihan focused on the app flow, refining the idea, and integrating the Google Forms API. Myself and Darshan handled cloud architecture, CI/CD, and deployment to GCP. Nikhil worked on authentication and frontend development, while Onkar and Vinay were responsible for scraping websites, parsing, and storing the data. This clear division of work allowed us to work efficiently in parallel.

## Testing

We implemented both automatic and user acceptance testing. Automatic testing is done through the following files:

[Analyzer Test Support](src/testSupport/analyzerTestSupport.test.ts)

[Collector Test Support](collector/src/collectorTestSupport.test.ts)

[Server Test Support](src/testSupport/apiRoutesTestSupport.test.ts)

These can be executed by running `npm test` once in **both the main directory and the collector subdirectory** (which has it's own package.json file).

Transcripts of both of our user acceptance tests can be found in this file:

[User Acceptance Transcripts](userAcceptanceTranscripts.txt)

### Running the Application for Local Development

This guide will walk you through setting up the Capstone Starter project using Docker Compose.

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd <your-project-folder>
```

---

## 2. Set Up Environment Variables

Copy the example `.env` file and update any necessary credentials.

```bash
cp .env.example .env
```

---

## 3. Install Node.js Dependencies & Run Tests

Do this for each application server, analyzer and frontend

```bash
npm install
```

---

## 4. Start All Containers with Docker Compose

Build and start all services (frontend, server, analyzer):

```bash
docker-compose up --build
```

The production server will:

- Serve the server runs on http://localhost:3001
- Serve the react server runs on http://localhost:3000
- Serve the analyser runs on http://localhost:3002
- Its better not to run the collector since it updates items on the database, there is a collector application always running on the cloud

Note: Make sure all environment variables are properly set in your environment.

### Running Tests

The project uses Vitest for testing. Here are the available test commands:

#### Running All Tests

```bash
# Run all tests once
npm run test

# Run tests in watch mode (automatically re-runs when files change)
npm run test:watch

# Run tests with coverage report
npm run test:coverage
```

#### Running Specific Tests

```bash
# Run only server tests
npm run test:server

# Run server tests in watch mode
npm run test:server:watch

# Run a specific test file
npm run test src/services/server/__tests__/googleFormService.test.ts
```

#### Test Coverage

To generate and view test coverage:

```bash
# Generate coverage report
npm run test:coverage

# The coverage report will be available in the directory
```

Note: Make sure all dependencies are installed before running tests:

```bash
npm install
```
