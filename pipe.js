/*
 * HashPipe.js: hash sync with pipes (WebSockets)
 * Copyright (C) 2013 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage instructions.
 */

function Pipe() {
    "use strict";
    var ws, clientId, connected,
        currentState = null,
        onStateChange = null, onServerMsg = null,
        onOpen = null, onClose = null,
        netDebug = 5;

    function changeState(newState) {
        currentState = newState;
        ws.send(JSON.stringify(newState));
    }

    function connect(uri) {
        console.log("Connecting to server:" + uri);
        ws = new WebSocket(uri);
        ws.onopen = function () {
            console.log("WebSocket connection opened");
            connected = true;
            if (onOpen) { onOpen(); }
        };
        ws.onmessage = function (e) {
            if (netDebug > 0) {
                console.log("WebSocket message received: ", e.data);
                netDebug--;
            }
            connected = true;
            var now = (new Date()).getTime();
            var msg = JSON.parse(e.data);
            if(msg.action === "assignId") {
                clientId = msg.id;
            } else if (msg.action === "serverMsg") {
                if (onServerMsg) { onServerMsg(msg.value); }
            } else {
                currentState = msg;
                // Notify if it's from somebody else
                if (onStateChange && currentState && currentState.id !== clientId) {
                    onStateChange(currentState);
                    currentState = msg;
                }
            }
        };
        ws.onerror = function (e) {
            console.log("WebSocket connection error:", e);
        };
        ws.onclose = function (e) {
            console.log("WebSocket connection closed:", e);
            connected = false;
            var msg = "";
            if (e.code === 1008 || e.code === 1009) {
                msg += "Disconnected from server"
                if (e.reason) {
                msg += ": " + e.reason;
                }
            } else {
                msg += "No connection to server";
            }
            if (onServerMsg) { onServerMsg(msg); }
            if (onClose) { onClose(); }
        };
    }
    function disconnect() {
        console.log("Disconnecting from server");
        ws.close();
    }

    function on(eventName, handler) {
        switch (eventName) {
        case "stateChange": onStateChange = handler; break;
        case "serverMsg":   onServerMsg = handler; break;
        case "open":        onOpen = handler; break;
        case "close":       onClose = handler; break;
        }
    }

    return {getWS: function(){ return ws; },
            on: on,
            connect: connect,
            disconnect: disconnect,
            isConnected: function(){ return connected; },
            changeState: changeState};

};
