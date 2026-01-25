import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    server: {
        host: '0.0.0.0',
        proxy: {
            // System Service 代理
            '/api/v1/system': {
                target: 'http://localhost:8888',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v1\/system/, '/api/v1')
            },

            // Agent Service 代理 (对应 API Gateway 的 /api/v1/agent/)
            '/api/v1/agent': {
                target: 'http://localhost:8891',
                changeOrigin: true,
                rewrite: (path) => path.replace(/^\/api\/v1\/agent/, '/api/v1')
            },

            // 向后兼容：直接访问 /api/v1/user/login 这种旧式请求（如果不走 Gateway 前缀）
            // 注意：这应该放在具体路径之后
            '/api': {
                target: 'http://localhost:8888',
                changeOrigin: true,
            },

            // 向后兼容 Agent 旧接口
            '/ai': {
                target: 'http://localhost:8891',
                changeOrigin: true,
            }
        }
    }
})
