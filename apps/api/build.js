const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log("==> Building API (cross-platform)...");

const srcPackagesShared = path.join(__dirname, 'src', '_packages', 'shared');
const srcPackagesDomain = path.join(__dirname, 'src', '_packages', 'domain');

// Clean and create temp directories
fs.rmSync(path.join(__dirname, 'src', '_packages'), { recursive: true, force: true });
fs.mkdirSync(srcPackagesShared, { recursive: true });
fs.mkdirSync(srcPackagesDomain, { recursive: true });

// Helper to copy directory recursively
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

console.log("==> Copying packages...");
copyDir(path.join(__dirname, '..', '..', 'packages', 'shared', 'src'), srcPackagesShared);
copyDir(path.join(__dirname, '..', '..', 'packages', 'domain', 'src'), srcPackagesDomain);

const tsconfigBuild = {
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
};

console.log("==> Writing tsconfig.build.json...");
fs.writeFileSync(path.join(__dirname, 'tsconfig.build.json'), JSON.stringify(tsconfigBuild, null, 2));

try {
  console.log("==> Compiling TypeScript...");
  execSync('npx tsc -p tsconfig.build.json', { stdio: 'inherit', cwd: __dirname });
  console.log("==> Compilation successful.");
} catch (error) {
  console.error("==> Compilation failed.");
  process.exit(1);
} finally {
  console.log("==> Cleaning up...");
  fs.rmSync(path.join(__dirname, 'src', '_packages'), { recursive: true, force: true });
  fs.rmSync(path.join(__dirname, 'tsconfig.build.json'), { force: true });
}
