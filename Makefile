COMPOSE_FILE := docker-compose.yml
ENV := .env.development

dev: $(COMPOSE_FILE) $(ENV)
	@echo "Starting Database"
	docker-compose --env-file $(ENV) --file $(COMPOSE_FILE) up --detach 
	@echo "Starting API"
	pnpm run start:dev

clean: $(COMPOSE_FILE) $(ENV)
	@echo "Cleaning Database"
	docker-compose --env-file $(ENV) --file $(COMPOSE_FILE) down
	rm -rf dist

