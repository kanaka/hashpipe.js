/*
 * HashPipe.js: hash sync with pipes (WebSockets)
 * Copyright (C) 2013 Joel Martin
 * Licensed under MPL 2.0 (see LICENSE.txt)
 *
 * See README.md for usage instructions.
 */

var hashpipeURI = "ws://" + window.location.host;


// Load as soon as document.body is available
function HPload (action) {
    if (document.body) {
        action();
    } else {
        window.addEventListener('load', action, false);
    }
}

var HPCounter = 0;

function HashPipe() {
    "use strict";

    var pipe = new Pipe(),
        lasthash = null,
        ctrl    = document.createElement("nav"),
        content = document.createElement("div"),
        styles  = document.createElement("style"),
        toggleB = document.createElement("div"),
        nextB   = document.createElement("span"),
        prevB   = document.createElement("span"),
        active = true,
        down = "&#11015;", up = "&#11014;",
        left = "&#9668;", right = "&#9658;",
        s = "";

    HPCounter +=1;
    ctrl.id = "hashpipe_ctrl_" + HPCounter;
    ctrl.className = "hashpipe";
    toggleB.className = "button";
    nextB.className = "button next";
    prevB.className = "button prev";
    content.className = "content";

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

    // Control Content
    content.innerHTML = "<div>HashPipe Controls</div>";
    ctrl.appendChild(content);

    // Next and previous buttons
    prevB.innerHTML = "prev#";
    prevB.onclick = prev;
    content.appendChild(prevB);
    nextB.innerHTML = "next#";
    nextB.onclick = next;
    content.appendChild(nextB);

    // Maximize/minimize button
    toggleB.innerHTML = right;
    toggleB.onclick = toggle;

    ctrl.appendChild(toggleB);

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
    styles.innerHTML = s;

    //////////////////////

    // Setup the Pipe and handle hash changes

    // We got a state change from another client
    pipe.on("stateChange", function (newState) {
        console.log("got state change: ", newState);
        if (newState.action === "hashChange") {
            console.log("Changing hash to: " + newState.value);
            lasthash = location.hash = newState.value;
        }
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
            pipe.changeState(newState);
            lasthash = newState.value;
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


    // Load the controls
    HPload(function() {
        document.body.appendChild(styles);
        document.body.appendChild(ctrl);
    });

    // Return the public API functions
    return {toggle: toggle,
            prev: prev,
            next: next,
            connect: pipe.connect};
}

var hashpipe = new HashPipe();
HPload(function() { hashpipe.connect(hashpipeURI); });
