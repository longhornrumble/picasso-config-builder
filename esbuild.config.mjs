import * as esbuild from 'esbuild';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from .env.local
dotenvConfig({ path: path.resolve(__dirname, '.env.local') });

// Path alias plugin for esbuild
const pathAliasPlugin = {
  name: 'path-alias',
  setup(build) {
    const aliases = {
      '@': path.resolve(__dirname, 'src'),
      '@components': path.resolve(__dirname, 'src/components'),
      '@lib': path.resolve(__dirname, 'src/lib'),
      '@hooks': path.resolve(__dirname, 'src/hooks'),
      '@types': path.resolve(__dirname, 'src/types')
    };

    build.onResolve({ filter: /^@/ }, args => {
      for (const [alias, aliasPath] of Object.entries(aliases)) {
        if (args.path === alias || args.path.startsWith(alias + '/')) {
          let resolvedPath = args.path.replace(alias, aliasPath);

          // Try to resolve to actual file
          const extensions = ['.tsx', '.ts', '.jsx', '.js', '/index.tsx', '/index.ts', '/index.jsx', '/index.js'];

          // If path doesn't have extension, try adding them
          if (!path.extname(resolvedPath)) {
            for (const ext of extensions) {
              const testPath = resolvedPath + ext;
              if (fs.existsSync(testPath)) {
                return { path: path.resolve(testPath) };
              }
            }
          }

          return { path: path.resolve(resolvedPath) };
        }
      }
    });
  }
};

// Bundle analyzer plugin
const bundleAnalyzerPlugin = {
  name: 'bundle-analyzer',
  setup(build) {
    build.onEnd((result) => {
      if (result.metafile && process.env.ANALYZE === 'true') {
        console.log('\n📊 Bundle Analysis:');
        const outputs = result.metafile.outputs;
        const totalSize = Object.values(outputs).reduce((sum, output) => sum + output.bytes, 0);
        console.log(`Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);

        Object.entries(outputs).forEach(([file, output]) => {
          const sizeKB = (output.bytes / 1024).toFixed(2);
          console.log(`  ${path.basename(file)}: ${sizeKB} KB`);

          if (output.bytes > 150 * 1024) {
            console.warn(`⚠️  Large chunk detected: ${path.basename(file)} (${sizeKB} KB)`);
          }
        });

        const metafilePath = path.join(distDir, 'metafile.json');
        fs.writeFileSync(metafilePath, JSON.stringify(result.metafile, null, 2));
        console.log(`📄 Metafile written to: ${metafilePath}`);
      }
    });
  }
};

// CSS plugin to handle Tailwind CSS
const cssPlugin = {
  name: 'css',
  setup(build) {
    build.onEnd(async () => {
      // Process CSS with PostCSS (Tailwind)
      const { exec } = await import('child_process');
      exec('npx postcss src/index.css -o dist/index.css', (error, stdout, stderr) => {
        if (error) {
          console.error('❌ PostCSS error:', error);
          return;
        }
        if (stderr) console.error('PostCSS stderr:', stderr);
        console.log('✅ CSS processed with Tailwind');
      });
    });
  }
};

// Determine build environment
const environment = process.env.BUILD_ENV || process.env.NODE_ENV || 'development';
const isServe = process.argv.includes('--serve');
const isDevelopment = isServe || environment === 'development';
const shouldAnalyze = process.env.ANALYZE === 'true';

// E2E auth bypass: aliases @clerk/react to an always-signed-in stub.
// Dev/test-only. Production builds must never ship this.
const bypassAuthForE2E = process.env.VITE_E2E_BYPASS_AUTH === 'true';
if (bypassAuthForE2E && !isDevelopment) {
  console.error('❌ VITE_E2E_BYPASS_AUTH=true is not permitted in production builds.');
  process.exit(1);
}

console.log(`🏗️  ESBuild for environment: ${environment.toUpperCase()}`);
console.log(`📦 Build mode: ${isDevelopment ? 'DEVELOPMENT' : 'PRODUCTION'}`);
if (bypassAuthForE2E) {
  console.log('🔓 E2E auth bypass: @clerk/react → src/e2e/clerk-mock.tsx');
}

// Clean and create dist directory
const distDir = 'dist';
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });

// Copy index.html to dist
fs.copyFileSync('index.html', path.join(distDir, 'index.html'));
console.log('📋 Copied index.html to dist');

// Define environment variables
const defineVars = {
  __ENVIRONMENT__: JSON.stringify(environment),
  __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  __VERSION__: JSON.stringify(process.env.npm_package_version || '0.1.0'),

  // Vite compatibility
  'import.meta.env.DEV': JSON.stringify(isDevelopment),
  'import.meta.env.PROD': JSON.stringify(!isDevelopment),
  'import.meta.env.BASE_URL': JSON.stringify('/'),
  'import.meta.env.MODE': JSON.stringify(environment),
  'import.meta.env.VITE_S3_BUCKET': JSON.stringify(process.env.VITE_S3_BUCKET || 'myrecruiter-picasso'),
  'import.meta.env.VITE_AWS_REGION': JSON.stringify(process.env.VITE_AWS_REGION || 'us-east-1'),
  'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
  'import.meta.env.VITE_CLERK_PUBLISHABLE_KEY': JSON.stringify(process.env.VITE_CLERK_PUBLISHABLE_KEY || ''),
  'import.meta.env.VITE_CHANNELS_API_URL': JSON.stringify(process.env.VITE_CHANNELS_API_URL || ''),
  'import.meta.env.VITE_BUBBLE_AUTH_URL': JSON.stringify(process.env.VITE_BUBBLE_AUTH_URL || ''),
  // Catch-all so any future import.meta.env.X read returns undefined
  // (and falls through to `|| 'default'` at call sites) instead of
  // throwing "Cannot read properties of undefined". esbuild's define
  // replaces longest match first, so the specific VITE_* entries above
  // still resolve correctly.
  'import.meta.env': '{}',

  // Node.js environment compatibility
  'process.env.NODE_ENV': JSON.stringify(isDevelopment ? 'development' : 'production')
};

const buildOptions = {
  entryPoints: ['./src/main.tsx'],
  bundle: true,
  outdir: distDir,
  format: 'esm',
  sourcemap: isDevelopment,
  minify: !isDevelopment,
  metafile: shouldAnalyze || isDevelopment,
  splitting: true,
  chunkNames: 'chunks/[name]-[hash]',

  loader: {
    '.js': 'jsx',
    '.jsx': 'jsx',
    '.ts': 'ts',
    '.tsx': 'tsx',
    '.png': 'dataurl',
    '.jpg': 'dataurl',
    '.jpeg': 'dataurl',
    '.gif': 'dataurl',
    '.svg': 'text',
    '.css': 'css',
    '.woff': 'file',
    '.woff2': 'file',
    '.ttf': 'file',
    '.eot': 'file'
  },

  define: defineVars,
  jsx: 'automatic',
  jsxImportSource: 'react',
  logLevel: 'info',

  ...(bypassAuthForE2E ? {
    alias: {
      '@clerk/react': path.resolve(__dirname, 'src/e2e/clerk-mock.tsx'),
    },
  } : {}),

  plugins: [
    pathAliasPlugin,
    bundleAnalyzerPlugin,
    cssPlugin
  ],

  ...(environment === 'production' && !isDevelopment ? {
    drop: ['debugger'],  // Keep console.log for debugging
    legalComments: 'none',
    treeShaking: true,
    minifyWhitespace: true,
    minifyIdentifiers: false,  // Disable to prevent breaking code
    minifySyntax: true,
    keepNames: true  // Keep component names even in production to avoid breaking React components
  } : {
    keepNames: true
  }),

  target: ['es2020', 'chrome64', 'firefox62', 'safari12'],
  platform: 'browser',
  conditions: ['import', 'module', 'browser']
};

if (isServe) {
  // Development server mode
  const ctx = await esbuild.context(buildOptions);
  await ctx.watch();

  const { host, port } = await ctx.serve({
    servedir: distDir,
    port: 3000,
    host: '0.0.0.0',
    fallback: path.join(distDir, 'index.html')
  });

  console.log(`
🚀 esbuild dev server running at:
   Local:   http://localhost:${port}
   Network: http://${host}:${port}
   Environment: ${environment.toUpperCase()}

   Path aliases configured:
   📁 @ → src/
   📁 @components → src/components/
   📁 @lib → src/lib/
   📁 @hooks → src/hooks/
   📁 @types → src/types/
  `);
} else {
  // Production build
  console.log(`🔨 Building for ${environment.toUpperCase()} environment...`);

  const startTime = Date.now();
  const result = await esbuild.build(buildOptions);
  const buildTime = Date.now() - startTime;

  console.log(`✅ Build complete! Output: ${distDir}`);
  console.log(`⏱️  Build time: ${buildTime}ms`);

  if (result.metafile) {
    const outputs = result.metafile.outputs;
    const totalSize = Object.values(outputs).reduce((sum, output) => sum + output.bytes, 0);
    console.log(`📦 Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);

    Object.entries(outputs).forEach(([file, output]) => {
      if (!file.includes('chunk') && !file.includes('assets/')) {
        const sizeKB = (output.bytes / 1024).toFixed(2);
        console.log(`   📄 ${path.basename(file)}: ${sizeKB} KB`);
      }
    });
  }
}
