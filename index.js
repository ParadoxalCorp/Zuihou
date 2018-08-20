'use strict';

process.on('uncaughtException', console.error);
process.on('unhandledRejection', console.error);

const axios = require('axios').default;
const Hapi = require('hapi');
const config = require('./config');

const server = Hapi.server({
    port: config.port
});

(async() => {
    server.route({
        method: '*',
        path: '/',
        handler: async function (request, h) {
            if (request.headers.authorization !== config.authorization) {
                return h.response('Forbidden').code(403).message('Forbidden');
            }
            return await axios({
                method: request.payload.method || 'GET',
                headers: request.payload.headers,
                data: request.payload.data,
                url: request.payload.url,
                params: request.payload.params,
                responseType: request.payload.responseType
            })
            .then(res => {
                console.log(`${new Date().toUTCString()} (UTC) | ${request.payload.method ? request.payload.method.toUpperCase() : 'GET'} | ${res.status} | ${request.payload.url}`);
                return h.response(JSON.stringify({
                    status: res.status,
                    statusText: res.statusText,
                    data: request.payload.responseType === 'arraybuffer' ? {
                        buffer: res.data.toString('base64')
                    } : res.data
                })).code(200);
            })
            .catch(err => {
                console.error(`${new Date().toUTCString()} (UTC) | ${request.payload.method ? request.payload.method.toUpperCase() : 'GET'} | ${err.response.status} | ${request.payload.url}`);
                return h.response(JSON.stringify({
                    status: err.response.status,
                    data: err.response.data
                })).message('Upstream server error').code(500);
            });
        }
    });
    await server.start();
    console.log(`Server started at: ${server.info.uri}`);
})();