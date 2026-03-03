/**
 * esbuild build script for VS Code extension
 */
const esbuild = require('esbuild');

const isProduction = process.argv.includes('--minify');
const isWatch = process.argv.includes('--watch');

async function build() {
  console.log(`Building extension${isProduction ? ' (production)' : ''}...`);

  const options = {
    entryPoints: ['./src/extension.ts'],
    outfile: './out/extension.js',
    bundle: true,
    platform: 'node',
    format: 'cjs',
    external: ['vscode'],
    minify: isProduction,
    sourcemap: isProduction ? false : 'inline',
  };

  if (isWatch) {
    const ctx = await esbuild.context(options);
    await ctx.watch();
    console.log('Watching for changes...');
  } else {
    await esbuild.build(options);
    console.log('Build completed successfully!');
    console.log(`Output: ./out/extension.js`);
  }
}

build().catch((err) => {
  console.error('Build failed:', err);
  process.exit(1);
});
