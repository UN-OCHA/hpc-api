#! /usr/bin/env node

/*
 * A script that forwards port 9393 to 9339 to allow for attaching a debugger
 * from outside of the docker image.
 */

const net = require('net');

net
  .createServer((from) => {
    try {
      const to = net.createConnection({
        host: 'localhost',
        port: 9339,
      });
      const close = () => {
        to.destroy();
        from.destroy();
      };
      from.pipe(to);
      to.pipe(from);
      to.on('close', close);
      to.on('error', close);
      to.on('end', close);
      from.on('close', close);
      from.on('error', close);
      from.on('end', close);
    } catch (e) {
      console.log('Unable to connect');
      from.destroy();
    }
  })
  .listen(9393);
