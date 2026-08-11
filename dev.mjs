import * as esbuild from 'esbuild';

const ctx = await esbuild.context({
  entryPoints: [
    { in: 'app/index.jsx', out: 'app' },
    { in: 'worker/index.js', out: 'moonscript-worker' },
  ],
  bundle: true,
  format: 'esm',
  sourcemap: true,
  outdir: '.',
  define: { BUILD_ID: JSON.stringify(`dev-${Date.now()}`) },
});

await ctx.watch();

const { hosts, port } = await ctx.serve({
  servedir: '.',
  port: Number(process.env.PORT) || 8000,
});

console.log(`serving on http://${hosts[0]}:${port}/`);
