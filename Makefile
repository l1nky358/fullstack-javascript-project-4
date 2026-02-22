install:
	npm ci

test:
	npm test

test-coverage:
	npm run test:coverage

lint:
	npm run lint

lint-fix:
	npm run lint:fix

.PHONY: test lint lint-fix
