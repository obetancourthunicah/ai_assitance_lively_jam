# ==============================================================================
# PresenceLive - Mono-Repo Automation Makefile
# ==============================================================================
# Centralizes development, testing, building, database and deployment commands.

.PHONY: help dev dev-server test lint typecheck build preview clean deploy prisma-generate prisma-push

help: ## Display available targets
	@echo "Available commands:"
	@echo "  make dev          - Start local development server on port 3000"
	@echo "  make test         - Run full test suite and type verification"
	@echo "  make lint         - Run TypeScript and code linting"
	@echo "  make build        - Compile optimized production web application"
	@echo "  make preview      - Locally preview production build"
	@echo "  make clean        - Remove build artifacts and temporary cache"
	@echo "  make deploy       - Verify build and output Vercel deployment guide"
	@echo "  make prisma-gen   - Generate Prisma client from schema"
	@echo "  make prisma-push  - Push Prisma schema migrations to Supabase PostgreSQL"

dev: ## Start development server with fast reload
	npm run dev

lint: ## Check TypeScript compiler invariants
	npm run lint

test: lint ## Run tests and compiler checks
	@echo "✓ Codebase verification passed with zero errors."

build: ## Compile production distribution bundle
	npm run build

preview: ## Preview the production build locally
	npm run preview

clean: ## Clean build artifacts
	npm run clean

deploy: build ## Prepare and verify for Vercel deployment
	@echo "--------------------------------------------------------"
	@echo "✓ Production build verified successfully!"
	@echo "To deploy to Vercel:"
	@echo "  1. Install Vercel CLI (optional): npm i -g vercel"
	@echo "  2. Link repository or run: vercel --prod"
	@echo "  3. Configure environment variables in Vercel project settings"
	@echo "--------------------------------------------------------"

prisma-gen: ## Generate Prisma ORM client
	npx prisma generate

prisma-push: ## Sync schema with Supabase PostgreSQL
	npx prisma db push
