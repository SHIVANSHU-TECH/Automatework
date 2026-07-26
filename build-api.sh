#!/usr/bin/env bash
set -e

echo "==> Node: $(node --version) | NPM: $(npm --version)"
echo "==> Working dir: $(pwd)"

echo "==> Installing dependencies..."
npm install

echo "==> Copying shared packages into api src for compilation..."
mkdir -p apps/api/src/_packages/shared
mkdir -p apps/api/src/_packages/domain

cp -r packages/shared/src/. apps/api/src/_packages/shared/
cp -r packages/domain/src/.  apps/api/src/_packages/domain/

echo "==> Writing path-alias tsconfig for build..."
cat > apps/api/tsconfig.build.json << 'TSEOF'
{
  "compilerOptions": {
    "target": "ES2021",
    "module": "CommonJS",
    "moduleResolution": "Node",
    "lib": ["ES2021"],
    "resolveJsonModule": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": false,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "dist",
    "rootDir": "src",
    "baseUrl": "src",
    "types": ["node"],
    "paths": {
      "@shared": ["./_packages/shared/index.ts"],
      "@shared/*": ["./_packages/shared/*"],
      "@domain": ["./_packages/domain/index.ts"],
      "@domain/*": ["./_packages/domain/*"]
    }
  },
  "include": ["src/**/*.ts"],
  "exclude": ["node_modules", "dist"]
}
TSEOF

echo "==> Compiling TypeScript..."
npx tsc -p apps/api/tsconfig.build.json

echo "==> Cleaning up temp package copies..."
rm -rf apps/api/src/_packages
rm -f  apps/api/tsconfig.build.json

echo "==> Verifying output..."
if [ ! -f "apps/api/dist/index.js" ]; then
  echo "ERROR: apps/api/dist/index.js not found!"
  find apps/api/dist -name "*.js" | head -20
  exit 1
fi

echo "==> SUCCESS: dist/index.js exists at $(pwd)/apps/api/dist/index.js"
