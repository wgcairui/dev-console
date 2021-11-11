import { node } from '../../electron-vendors.config.json';
import { join } from 'path';
import { builtinModules } from 'module';

const PACKAGE_ROOT = __dirname;


/**
 * @type {import('vite').UserConfig}
 * @see https://vitejs.dev/config/
 */
const config = {
  mode: process.env.MODE,
  root: PACKAGE_ROOT,
  envDir: process.cwd(),
  resolve: {
    alias: {
      '/@/': join(PACKAGE_ROOT, 'src') + '/',
    },
  },
  server: {
    proxy: {
      "/api": 'https://uart.ladishb.com'
    }
  },
  build: {
    sourcemap: 'inline',
    target: `node${node}`,
    outDir: 'dist',
    assetsDir: '.',
    minify: process.env.MODE !== 'development',
    lib: {
      entry: 'src/index.ts',
      formats: ['cjs'],
    },
    rollupOptions: {
      /**
       * 把serialport打包成外部包,避免应为是编译文件报错
       * @see https://rollupjs.org/guide/en/#external
       */
      external: [
        'electron',
        'electron-devtools-installer',
        'serialport',
        ...builtinModules,
      ],
      output: {
        entryFileNames: '[name].cjs',
      },
    },
    emptyOutDir: true,
    brotliSize: false,
    commonjsOptions: {
      //dynamicRequireTargets:[],
      exclude: ['*.node']
    }
  },
};

export default config;
