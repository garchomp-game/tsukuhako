import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
const port = Number(process.env.WEB_PORT || 5173);
const apiPort = Number(process.env.API_PORT || 8787);
export default defineConfig(({command})=>({
 plugins:[react()],
 define:{__LOCAL_PREVIEW__:JSON.stringify(command==='serve')},
 server:{host:'127.0.0.1',port,strictPort:true,proxy:{'/api':{target:`http://127.0.0.1:${apiPort}`,configure(proxy){proxy.on('proxyReq',req=>req.setHeader('x-preview-origin',`http://127.0.0.1:${port}`));}}}},
 build:{outDir:'dist',sourcemap:false}
}));
