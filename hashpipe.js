/*
 * HashPipe.js: hash sync with pipes (WebSockets)
 * Copyright (C) 2013 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage instructions.
 */

var hashpipeURI = "ws://" + window.location.host;


var HPCounter = 0;

function HashPipe() {
    "use strict";

    var pipe = new Pipe(),
        lasthash = null,
        hp_id    = "hashpipe_" + (++HPCounter) + "_",
        $id      = function(id){return document.getElementById(hp_id + id);},
        ctrl     = document.createElement("nav"),
        styles   = document.createElement("style"),
        toggleB  = document.createElement("div"),
        active = true,
        down = "&#11015;", up = "&#11014;",
        left = "&#9668;", right = "&#9658;",
        h = "", s = "";

    function toggle() {
        if (active) {
            active = false;
            content.style.display = "none";
            toggleB.innerHTML = left;
        } else {
            active = true;
            content.style.display = "";
            toggleB.innerHTML = right;
        }
    }

    // -1 -> previous, 1 -> next (default)
    function move(dir) {
        dir = typeof(dir) === "undefined" ? 1 : dir;
        var atags = document.getElementsByTagName("a"),
            hashes = [], idx;
        for (var i=0; i < atags.length; i++) {
            var atag = atags[i];
            if (atag.name && !atag.href) {
                hashes.push("#" + atag.name);
            }
        }
        idx = hashes.indexOf(location.hash),
        idx = (hashes.length + idx + dir) % hashes.length;
        location.hash = hashes[idx];
        return false;
    }
    function next(){ move(1); }
    function prev(){ move(-1); }

    function connect() {
        pipe.connect($id("server").value);
    }
    function disconnect() {
        pipe.disconnect();
    }

    // Setup the Pipe and handle hash changes

    // We got a state change from another client
    pipe.on("stateChange", function (newState) {
        console.log("got state change: ", newState);
        if (newState.action === "hashChange") {
            console.log("Changing hash to: " + newState.value);
            lasthash = location.hash = newState.value;
        }
    });

    pipe.on("open", function() {
        console.log("pipe opened");
        $id("server").disabled = true;
        $id("connect").innerHTML = "Disconnect";
        $id("connect").onclick = disconnect;
    });
    pipe.on("close", function() {
        console.log("pipe closed");
        $id("server").disabled = false;
        $id("connect").innerHTML = "Connect";
        $id("connect").onclick = connect;
    });

    pipe.on("serverMsg", function(html) {
        var msg = $('#message')[0];
        msg.style.background = "#fe8";
        msg.innerHTML = html;
    });

    //
    // Intercept changes to the hash value
    //
    function hashchange () {
        if (location.hash !== lasthash) {
            console.log("detected local hash change");
            var newState = {action: "hashChange", value: location.hash};
            lasthash = newState.value;
            if (pipe.isConnected()) {
                pipe.changeState(newState);
            }
        }
        return true;
    }

    window.addEventListener("hashchange", hashchange, false);

    // Monkey patch to catch history change
    (function(){
        var pushState = history.pushState,
            replaceState = history.replaceState;
        history.pushState = function () {
            pushState.apply(history, arguments);
            hashchange();
        };
        history.replaceState = function () {
            replaceState.apply(history, arguments);
            hashchange();
        };
    })();

    setInterval(hashchange, 500); // And just for good measure

    ///////////////////////////////////////////
    // Render the controls
    ///////////////////////////////////////////

    // Control CSS
    s += ".hashpipe {";
    s += "  position: fixed;";
    s += "  bottom: 0;";
    s += "  right: 0;";
    s += "  padding: 2px;";
    s += "  margin: 3px;";
    s += "  border: solid #C0C0C0 1px;";
    s += "  background: #F0F0F0;";
    s += "  z-index: 10000;";
    s += "}";
    s += ".hashpipe .button {";
    s += "  text-align: right;";
    s += "  cursor: pointer;";
    s += "}";
    s += ".hashpipe .next, .hashpipe .prev {";
    s += "  margin: 5px;";
    s += "}";
    s += ".hashpipe .connect {";
    s += "  display: block;";
    s += "}";
    styles.innerHTML = s;

    ctrl.id = hp_id + "ctrl";
    ctrl.className = "hashpipe";

    // Control Content
    h += '<div class="content">';
    h += '  <div><b>HashPipe.js Controls</b></div>';
    h += '  Server <input id="' + hp_id + 'server"/><br/>';
    h += '  <button id="' + hp_id + 'connect" class="button connect">Connect</button>';
    h += '  <button id="' + hp_id + 'prev" class="button prev">Prev</button>';
    h += '  <button id="' + hp_id + 'next" class="button next">Next</button>';
    h += '</div>';
    ctrl.innerHTML = h;

    // Maximize/minimize toggle button
    toggleB.className = "button";
    toggleB.innerHTML = right;
    toggleB.onclick = toggle;

    ctrl.appendChild(toggleB);

    // Show/activate the controls
    function init() {
        document.body.appendChild(styles);
        document.body.appendChild(ctrl);
        $id("connect").onclick = connect;
        $id("prev").onclick = prev;
        $id("next").onclick = next;
        $id("server").value = hashpipeURI;
    }

    // Load as soon as document.body is available
    if (document.body) {
        init();
    } else {
        window.addEventListener('load', init, false);
    }

    // Return the public API functions
    return {toggle: toggle,
            prev: prev,
            next: next,
            connect: pipe.connect};
}

var hashpipe = new HashPipe();
