/**
 * Bun build script for VS Code extension
 * Replaces esbuild with Bun's native bundler
 */

const isProduction = process.argv.includes('--minify');
const isWatch = process.argv.includes('--watch');

async function build() {
  console.log(`Building extension${isProduction ? ' (production)' : ''}...`);

  const result = await Bun.build({
    entrypoints: ['./src/extension.ts'],
    outdir: './out',
    target: 'node',
    format: 'cjs',
    external: ['vscode'],
    minify: isProduction,
    sourcemap: isProduction ? 'none' : 'inline',
    naming: {
      entry: 'extension.js',
    },
  });

  if (!result.success) {
    console.error('Build failed:');
    for (const log of result.logs) {
      console.error(log);
    }
    process.exit(1);
  }

  console.log('Build completed successfully!');
  console.log(`Output: ${result.outputs.map(o => o.path).join(', ')}`);
}

if (isWatch) {
  console.log('Watch mode not yet implemented with Bun.build API');
  console.log('Please use: bun --watch build.ts');
  process.exit(1);
}

await build();
