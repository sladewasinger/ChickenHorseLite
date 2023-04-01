import path from 'path';

/** @type {import('vite').UserConfig} */
export default {
    server: {
        port: 3010,
        strictPort: true,
        proxy: {
            '/socket-io': {
                target: 'http://localhost:3000',
                changeOrigin: true,
            },
        }
    },
    resolve: {
        alias: {
            shared: path.resolve(__dirname, '../shared/'),
        },
    },
};
