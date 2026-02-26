install:
	npm ci

test:
	npm test

test-coverage:
	npm run test:coverage

lint:
	npx eslint .

lint-fix:
	npx eslint . --fix

.PHONY: test lint lint-fix