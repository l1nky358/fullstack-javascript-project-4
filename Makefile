@"
install:
	npm ci

test:
	npm test

test-coverage:
	npm run test:coverage

.PHONY: test
"@ | Out-File -FilePath Makefile -Encoding utf8