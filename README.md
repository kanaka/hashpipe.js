# HashPipe.js: hash sync with pipes

HashPipe.js synchronizes URL hash value across multiple browsers using
WebSockets (the pipe).

HashPipe.js is composed of a client (hashpipe.js) and a Node.js
server (server.js).

## Why?

The initial purpose of HashPipe.js is to allow multiple people to stay
in sync while viewing online presentations which use the hash value to
indicate the current slide (most of them).

## Prerequisites

Your browser must support WebSockets.

## License

HashPipe.js is licensed under the [MPL 2.0](http://www.mozilla.org/MPL/2.0/)

## Running your own server

- Download and unpack node

- Configure and build node

    ```
    ./configure
    make
    ```

- Link node executable to bin dir

    ```ln -sf $(readlink node) ~/bin/node```

- Create npm script in ~/bin

    ```
    #!/bin/sh
    node "$HOME/node-v0.8.9/deps/npm/bin/npm-cli.js" "$@"
    ```

- In the source directory install ws module and dependencies (this will
  download and install ws and dependencies in node_modules/ sub-directory)

    ```
    npm install ws
    ```

- Run a normal web server to server the web files.

- Start the Node server (on port 8090 by default)

    ```
    ./server.js
    ```

- Load the page. It will automatically connect to the same hostname
  and port using WebSockets.

