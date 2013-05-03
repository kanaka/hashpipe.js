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
        onStateChange = null, // state change handler
        onServerMsg = null,
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
                msg += "<br>You can also run your own server. " +
                    "Get the code <a href='https://github.com/kanaka/hashpipe.js'>on github</a>.<br>";
            } else {
                msg += "No connection to server";
            }
            if (onServerMsg) {
                onServerMsg(msg);
            }
        };
    }

    function on(eventName, handler) {
        if (eventName === "stateChange") {
            onStateChange = handler;
        } else if (eventName === "serverMsg") {
            onServerMsg = handler;
        }
    }

    return {getWS: function(){ return ws; },
            on: on,
            connect: connect,
            changeState: changeState};

};