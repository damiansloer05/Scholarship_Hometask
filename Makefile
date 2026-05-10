# =============================================================
#  Admissions Dashboard — Developer shortcuts
#  Usage: make <target>
# =============================================================

include .env
export

.PHONY: help setup dev dev-down db-migrate db-seed test test-api test-ui \
        build push deploy infra-init infra-plan infra-apply logs

help:           ## Show this help
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | \
	  awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-18s\033[0m %s\n", $$1, $$2}'

# ---------------------------------------------------------------------------
# Setup
# ---------------------------------------------------------------------------

setup:          ## Copy .env.example → .env and infra/terraform.tfvars
	@[ -f .env ] || cp .env.example .env && echo "Created .env — fill in real values."
	@envsubst < infra/terraform.tfvars.example > infra/terraform.tfvars
	@echo "Created infra/terraform.tfvars from .env values."

# ---------------------------------------------------------------------------
# Local development
# ---------------------------------------------------------------------------

dev:            ## Start full local stack (postgres + api + ui)
	docker compose up --build

dev-down:       ## Stop and remove local containers
	docker compose down

db-migrate:     ## Run database migrations (local)
	cd api && DATABASE_URL=$(LOCAL_DATABASE_URL) npm run db:migrate

db-seed:        ## Seed database with mock programs and requirements
	cd api && DATABASE_URL=$(LOCAL_DATABASE_URL) npm run db:seed

# ---------------------------------------------------------------------------
# Testing
# ---------------------------------------------------------------------------

test:           ## Run all tests (API unit + UI e2e)
	$(MAKE) test-api
	$(MAKE) test-ui

test-api:       ## Run API Vitest unit tests
	cd api && npm test

test-ui:        ## Run UI Playwright e2e tests
	cd ui && npm run test:e2e

# ---------------------------------------------------------------------------
# Docker build & push
# ---------------------------------------------------------------------------

REGISTRY=$(GCP_REGION)-docker.pkg.dev/$(GCP_PROJECT_ID)/$(ARTIFACT_REGISTRY_REPO)

build:          ## Build Docker images locally
	docker build -t $(REGISTRY)/$(API_IMAGE_NAME):latest ./api
	docker build -t $(REGISTRY)/$(UI_IMAGE_NAME):latest ./ui

push:           ## Push Docker images to Artifact Registry
	gcloud auth configure-docker $(GCP_REGION)-docker.pkg.dev --quiet
	docker push $(REGISTRY)/$(API_IMAGE_NAME):latest
	docker push $(REGISTRY)/$(UI_IMAGE_NAME):latest

# ---------------------------------------------------------------------------
# Deploy to Cloud Run (manual — CI/CD via Cloud Build handles this normally)
# ---------------------------------------------------------------------------

deploy:         ## Deploy both services to Cloud Run
	gcloud run deploy $(API_SERVICE_NAME) \
	  --image $(REGISTRY)/$(API_IMAGE_NAME):latest \
	  --region $(GCP_REGION) \
	  --project $(GCP_PROJECT_ID)
	gcloud run deploy $(UI_SERVICE_NAME) \
	  --image $(REGISTRY)/$(UI_IMAGE_NAME):latest \
	  --region $(GCP_REGION) \
	  --project $(GCP_PROJECT_ID)

# ---------------------------------------------------------------------------
# Terraform
# ---------------------------------------------------------------------------

infra-init:     ## Initialise Terraform (first time only)
	cd infra && terraform init

infra-plan:     ## Preview infrastructure changes
	cd infra && terraform plan

infra-apply:    ## Apply infrastructure changes
	cd infra && terraform apply

infra-destroy:  ## Destroy all GCP resources (DANGER)
	cd infra && terraform destroy

# ---------------------------------------------------------------------------
# Observability
# ---------------------------------------------------------------------------

logs-api:       ## Stream API logs from Cloud Run
	gcloud run services logs tail $(API_SERVICE_NAME) --region $(GCP_REGION) --project $(GCP_PROJECT_ID)

logs-ui:        ## Stream UI logs from Cloud Run
	gcloud run services logs tail $(UI_SERVICE_NAME) --region $(GCP_REGION) --project $(GCP_PROJECT_ID)
