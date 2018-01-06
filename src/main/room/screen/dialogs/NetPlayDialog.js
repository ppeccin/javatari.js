// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetPlayDialog = function(mainElement) {
    "use strict";

    var self = this;

    this.show = function () {
        if (!dialog) {
            create();
            return setTimeout(self.show, 0);
        }

        refresh();
        visible = true;
        dialog.classList.add("jt-show");
        dialog.focus();

        var availWidth = mainElement.clientWidth - 20;      //  - tolerance
        var width = dialog.clientWidth;
        var scale = width < availWidth ? 1 : availWidth / width;
        dialog.style.transform = "translate(" + (scale < 1 ? "-" + ((width - availWidth - 20) / 2 | 0) + "px" : "0") + ", -" + ((jt.ScreenGUI.BAR_HEIGHT / 2) | 0) + "px) scale(" + scale.toFixed(4) + ")";
    };

    this.hide = function() {
        if (!visible) return;
        Javatari.userPreferences.save();
        dialog.classList.remove("jt-show");
        visible = false;
        Javatari.room.screen.focus();
    };

    this.roomNetPlayStatusChangeUpdate = function() {
        if (visible) refresh();
    };

    function refresh() {
        switch (room.netPlayMode) {
            case 0:
                status.textContent = "STANDALONE";
                start.textContent = "HOST";
                join.textContent = "JOIN";
                start.disabled = false;
                join.disabled = false;
                sessionName.disabled = false;
                nick.disabled = false;
                status.classList.remove("jt-active");
                sessionBox.classList.remove("jt-disabled");
                sessionName.setAttribute("placeholder", "Enter a name");
                break;
            case 1:
                var netServer = room.getNetServer();
                status.textContent = "HOSTING Session: " + netServer.getSessionID();
                start.textContent = "STOP";
                join.textContent = "JOIN";
                start.disabled = false;
                join.disabled = true;
                sessionName.disabled = true;
                nick.disabled = true;
                status.classList.add("jt-active");
                sessionBox.classList.add("jt-disabled");
                sessionName.setAttribute("placeholder", "Automatic");
                break;
            case 2:
                var netClient = room.getNetClient();
                status.textContent = "JOINED Session: " + netClient.getSessionID();
                start.textContent = "HOST";
                join.textContent = "LEAVE";
                start.disabled = true;
                join.disabled = false;
                sessionName.disabled = true;
                nick.disabled = true;
                status.classList.add("jt-active");
                sessionBox.classList.remove("jt-disabled");
                sessionBox.classList.add("jt-disabled");
                sessionName.setAttribute("placeholder", "Enter a name");
                break;
            case -1:
            case -2:
                status.textContent = "Establishing connection...";
                sessionName.disabled = true;
                nick.disabled = true;
                status.classList.remove("jt-active");
                sessionBox.classList.add("jt-disabled");
                if (room.netPlayMode === -1) {
                    start.textContent = "CANCEL";
                    join.textContent = "JOIN";
                    start.disabled = false;
                    join.disabled = true;
                    sessionName.setAttribute("placeholder", "Automatic");
                } else {
                    start.textContent = "HOST";
                    join.textContent = "CANCEL";
                    start.disabled = true;
                    join.disabled = false;
                    sessionName.setAttribute("placeholder", "Enter a name");
                }
                break;
        }
    }

    function performCommand(e) {
        var button = e.target;
        if (button.disabled) return;

        jt.DOMConsoleControls.hapticFeedbackOnTouch(e);

        var mode = room.netPlayMode;
        if (button === start && (mode === 0 || mode === 1 || mode === -1)) {
            if (mode === 0) room.getNetServer().startSession(sessionName.value);
            else room.getNetServer().stopSession(false, mode === -1 ? "NetPlay connection aborted" : undefined);
        } else if (button === join && (mode === 0 || mode === 2 || mode === -2)) {
            if (mode === 0) room.getNetClient().joinSession(sessionName.value, nick.value);
            else room.getNetClient().leaveSession(false, mode === -2 ? "NetPlay connection aborted" : undefined);
        }
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "jt-netplay";
        dialog.tabIndex = -1;

        statusBox = document.createElement("div");
        statusBox.id = "jt-netplay-status-box";
        dialog.appendChild(statusBox);

        status = document.createElement("div");
        status.id = "jt-netplay-status";
        status.textContent = "HOSTING Session: Teste";
        statusBox.appendChild(status);

        sessionBox = document.createElement("div");
        sessionBox.id = "jt-netplay-session-box";
        dialog.appendChild(sessionBox);

        var sessionLabel = document.createElement("div");
        sessionLabel.id = "jt-netplay-session-label";
        sessionBox.appendChild(sessionLabel);

        start = document.createElement("button");
        start.id = "jt-netplay-start";
        start.jtCommand = true;
        start.classList.add("jt-netplay-button");
        start.textContent = "HOST";
        sessionBox.appendChild(start);

        sessionName = document.createElement("input");
        sessionName.id = "jt-netplay-session-name";
        sessionName.setAttribute("placeholder", "Enter a name");
        sessionName.setAttribute("maxlength", 12);
        sessionName.spellcheck = false;
        sessionName.autocorrect = false;
        sessionName.autocapitalize = false;
        sessionBox.appendChild(sessionName);

        join = document.createElement("button");
        join.id = "jt-netplay-join";
        join.jtCommand = true;
        join.classList.add("jt-netplay-button");
        join.textContent = "JOIN";
        sessionBox.appendChild(join);

        var nickLabel = document.createElement("div");
        nickLabel.id = "jt-netplay-nick-label";
        sessionBox.appendChild(nickLabel);

        nick = document.createElement("input");
        nick.id = "jt-netplay-nick";
        nick.setAttribute("placeholder", "Automatic");
        nick.setAttribute("maxlength", 12);
        nick.spellcheck = false;
        nick.autocorrect = false;
        nick.autocapitalize = false;
        sessionBox.appendChild(nick);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        // Do not close with taps or clicks inside, select with tap or mousedown
        jt.Util.onTapOrMouseDownWithBlock(dialog, function(e) {
            if (e.target.jtCommand) {
                performCommand(e);
            } else
                dialog.focus();
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            // Exit
            if (EXIT_KEYS.indexOf(e.keyCode) >= 0) self.hide();
            return jt.Util.blockEvent(e);
        });

        // Block invalid characters in sessionName and nick
        function filterChars(e) {
            var item = e.target;
            var sani = item.value.replace(/[^A-Za-z0-9_-]/g, "");
            if (item.value != sani) item.value = sani;
        }
        sessionName.addEventListener("input", filterChars);
        nick.addEventListener("input", filterChars);
        // Allow selection and edit in status, sessionName and nick
        jt.Util.addEventsListener(status, "touchstart touchmove touchend mousedown mousemove mouseup keydown keyup", function(e) {
            e.stopPropagation();
        });
        jt.Util.addEventsListener(sessionName, "touchstart touchmove touchend mousedown mousemove mouseup keydown keyup", function(e) {
            e.stopPropagation();
        });
        jt.Util.addEventsListener(nick, "touchstart touchmove touchend mousedown mousemove mouseup keydown keyup", function(e) {
            e.stopPropagation();
        });
        // Allow context in status
        status.addEventListener("contextmenu", function(e) {
            e.stopPropagation();
        });
    }


    var room = Javatari.room;

    var visible = false;
    var dialog, statusBox, sessionBox;
    var start, join, stop, status, sessionName, nick;

    var k = jt.DOMKeys;
    var EXIT_KEYS = [ k.VK_ESCAPE.c, k.VK_ENTER.c, k.VK_SPACE.c ];

};
