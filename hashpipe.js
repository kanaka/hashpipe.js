/*
 * HashPipe.js: hash sync with pipes (WebSockets)
 * Copyright (C) 2013 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage instructions.
 */

var pipe = Pipe();

hashpipe_lasthash = null;

pipe.on("stateChange", function (newState) {
        console.log("got state change: ", newState);
        if (newState.action === "hashChange") {
            console.log("Changing hash to: " + newState.value);
            hashpipe_lasthash = location.hash = newState.value;
        }
    });

pipe.on("serverMsg", function(html) {
        var msg = $('#message')[0];
        msg.style.background = "#fe8";
        msg.innerHTML = html;
    });

window.addEventListener("hashchange", function () {
        if (location.hash !== hashpipe_lasthash) {
            console.log("detected local hash change");
            var newState = {action: "hashChange", value: location.hash};
            pipe.changeState(newState);
            hashpipe_lasthash = newState.value;
        }
        return true;
    }, false);

window.addEventListener('load', function () {
        pipe.connect("ws://" + window.location.host);
    }, false);
