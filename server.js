#!/usr/bin/env node

/*
 * HashPipe.js: hash synchronization with pipes (WebSockets)
 * Copyright (C) 2013 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage instructions.
 */

"use strict";
var url = require('url'),
    http = require('http'),
    path = require('path'),
    fs = require('fs'),
    WebSocket = require('ws'),
    WebSocketServer = WebSocket.Server,
    webServer, wsServer, http_request, http_error, ws_connection,
    maxClients = 20,
    maxMsgLength = 500,
    pushInterval = 75,
    port = process.argv[2] ? parseInt(process.argv[2],10) : 8080,
    clients = {}, nextId = 1,
    pendingState = null, currentState = null;

function log(msg) { console.log(Date() + ": " + msg); }
function warn(msg) { console.warn(Date() + ": " + msg); }
function error(msg) { console.error(Date() + ": " + msg); }

function removeClient(clientId) {
    if (clients[clientId]) {
        warn("Removing Client ID " + clientId);
        delete clients[clientId];
        log("Current number of clients: " + Object.keys(clients).length);
        sendAll(JSON.stringify({"delete": clientId}));
    }
};

function sendOne (clientId, json) {
    var client = clients[clientId];
    if (client) {
        try {
            if (client.readyState === WebSocket.OPEN) {
                client.send(json);
            }
        } catch (e) {
            log("Failed to send to client ID " + clientId);
            removeClient(clientId);
        }
    }
}

function sendAll (json) {
    var clientIds = Object.keys(clients), clientId;
    for (var i = 0; i < clientIds.length; i++) {
        clientId = clientIds[i];
        sendOne(clientId, json);
    }
}

function tooManyClients(client, clientId) {
    warn("Too many clients, disconnecting client " +
         (clientId ? clientId : ""));
    client.close(1008, "Too many clients, try again later");
}


// Any application specific transformations
function transformState (current, pending) {
    return pending;
}


// Periodically push out accumulated changes
setInterval(function () {
    if (pendingState) {
      currentState = transformState(currentState, pendingState);
      sendAll(JSON.stringify(currentState));
      pendingState = null;
    }
}, pushInterval);



ws_connection = function(client) {
    var numClients = Object.keys(clients).length+1;

    if (numClients > maxClients) {
        tooManyClients(client);
        return;
    }

    var clientId = nextId;
    nextId++;
  
    clients[clientId] = client;
    log("New client ID: " + clientId);
    log("Current number of clients: " + numClients);

    // Send the new guy his ID and the most current state
    sendOne(clientId, JSON.stringify({"action": "assignId", "id": clientId}));
    if (currentState) {
        sendOne(clientId, JSON.stringify(currentState));
    }

    client.on('close', function() {
        warn("Client ID " + clientId + " disconnected");
        removeClient(clientId);
    });

    client.on('message', function(message) {
        var data;
        //log("Received message from client ID " + clientId + ": " + message);
        if (message.length > maxMsgLength) {
            error("client " + clientId + " sent oversize " + message.length + " byte message ");
            client.close(1009, "Message length too long");
            return;
        }
        try {
            data = JSON.parse(message);
        } catch (e) {
            error("failed to parse client " + clientId + " message: " + message);
            return;
        }
        if (data.action === "testTooManyClients") { // for testing
            log("received testTooManyClients from client " + clientId);
            tooManyClients(client, clientId);
            return;
	}

        data.id = clientId;
        pendingState = data;
    });
};

///////////////////////////////////////////////////////////////////////

// Send an HTTP error response
http_error = function (response, code, msg) {
    response.writeHead(code, {"Content-Type": "text/plain"});
    response.write(msg + "\n");
    response.end();
    return;
}

// Process an HTTP static file request
http_request = function (request, response) {
//    console.log("pathname: " + url.parse(req.url).pathname);
//    res.writeHead(200, {'Content-Type': 'text/plain'});
//    res.end('okay');

//    if (! argv.web) {
//        return http_error(response, 403, "403 Permission Denied");
//    }

    var uri = url.parse(request.url).pathname
        //, filename = path.join(argv.web, uri);
        , filename = path.join(".", uri);
    
    fs.exists(filename, function(exists) {
        if(!exists) {
            return http_error(response, 404, "404 Not Found");
        }

        if (fs.statSync(filename).isDirectory()) {
            filename += '/index.html';
        }

        fs.readFile(filename, "binary", function(err, file) {
            if(err) {
                return http_error(response, 500, err);
            }

            response.writeHead(200);
            response.write(file, "binary");
            response.end();
        });
    });
};

webServer = http.createServer(http_request);
webServer.listen(port, function() {
    wsServer = new WebSocketServer({server: webServer});
    wsServer.on('connection', ws_connection);
});
console.log("Server started on port " + port);
