// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetPlayDialog = function(room, mainElement) {
    "use strict";

    var self = this;

    this.show = function () {
        if (!dialog) {
            create();
            return setTimeout(self.show, 0);
        }

        refresh();
        refreshPreferencesData();
        visible = true;
        dialog.classList.add("jt-show");
        dialog.focus();

        jt.Util.scaleToFitParentWidth(dialog, mainElement, 12);
    };

    this.hide = function() {
        if (!visible) return;
        dialog.classList.remove("jt-show");
        visible = false;
        room.screen.focus();
    };

    this.roomNetPlayStatusChangeUpdate = function(oldMode) {
        if (visible) refresh();

        // Close automatically when entering Client mode
        if (room.netPlayMode === 2 && oldMode < 0 && visible) return setTimeout(function() {
            self.hide();
        }, 2000);

        // Open automatically when leaving Server/Client mode
        if (room.netPlayMode === 0 && oldMode > 0 && !visible) self.show();
    };

    this.isVisible = function() {
        return visible;
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
                statusBox.classList.remove("jt-active");
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
                statusBox.classList.add("jt-active");
                sessionBox.classList.add("jt-disabled");
                sessionName.setAttribute("placeholder", "Automatic");
                link.href = getSessionLink();
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
                statusBox.classList.add("jt-active");
                sessionBox.classList.remove("jt-disabled");
                sessionBox.classList.add("jt-disabled");
                sessionName.setAttribute("placeholder", "Enter a name");
                link.href = getSessionLink();
                break;
            case -1:
            case -2:
                status.textContent = "Establishing connection...";
                sessionName.disabled = true;
                nick.disabled = true;
                statusBox.classList.remove("jt-active");
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

    function refreshPreferencesData() {
        sessionName.value = prefs.netPlaySessionName;
        nick.value = prefs.netPlayNick;
    }

    function getSessionLink() {
        return jt.Util.browserCurrentURL() + "?JOIN=" + room.netController.getSessionID();
    }

    function performCommand(e) {
        var button = e.target;
        if (button.disabled) return;

        jt.DOMConsoleControls.hapticFeedbackOnTouch(e);

        var save = false;
        var prevMode = room.netPlayMode;
        if (button === start && (prevMode === 0 || prevMode === 1 || prevMode === -1)) {
            if (prevMode === 0) {
                room.getNetServer().startSession(sessionName.value);
                save = true;
            } else
                room.getNetServer().stopSession(false, prevMode === -1 ? "NetPlay connection aborted" : undefined);
        } else if (button === join && (prevMode === 0 || prevMode === 2 || prevMode === -2)) {
            if (prevMode === 0) {
                room.getNetClient().joinSession(sessionName.value, nick.value);
                save = true;
            } else
                room.getNetClient().leaveSession(false, prevMode === -2 ? "NetPlay connection aborted" : undefined);
        }

        // Save Session Name and Nick if starting/joining
        if (save) {
            var s = sessionName.value.trim();
            var n = nick.value.trim();
            if (prefs.netPlaySessionName !== s || prefs.netPlayNick !== n) {
                prefs.netPlaySessionName = s;
                prefs.netPlayNick = n;
                Javatari.userPreferences.setDirty();
                Javatari.userPreferences.save();
            }
        }
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "jt-netplay";
        dialog.tabIndex = -1;

        statusBox = document.createElement("div");
        statusBox.id = "jt-netplay-status-box";
        dialog.appendChild(statusBox);

        linkText = document.createElement("input");
        linkText.id = "jt-netplay-link-text";
        statusBox.appendChild(linkText);

        status = document.createElement("div");
        status.id = "jt-netplay-status";
        status.textContent = "STANDALONE";
        statusBox.appendChild(status);

        link = document.createElement("a");
        link.id = "jt-netplay-link";
        link.textContent = "\uD83D\uDD17";
        link.setAttribute("title", "Copy Join Session link to clipboard");
        statusBox.appendChild(link);

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
            var value = item.value;
            if (!value || value.match(/^[A-Za-z0-9]+[A-Za-z0-9_\-]*@?$/))       // OK, store value
                return item.jtLastValidValue = value;
            else
                return item.value = item.jtLastValidValue || "";                // Not OK, use last OK value
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

        // Block drag
        dialog.ondragstart = jt.Util.blockEvent;

        // Allow context in status
        statusBox.addEventListener("contextmenu", function(e) {
            e.stopPropagation();
        });

        // Click on link
        jt.Util.addEventsListener(link, "click", function(e) {
            jt.Util.blockEvent(e);

            if (!document.queryCommandSupported || !document.queryCommandSupported('copy'))
                return room.showOSD("Copy to Clipboard not supported by the browser!", true, true);

            linkText.value = getSessionLink();
            linkText.focus();
            linkText.select();
            document.execCommand("copy");
            dialog.focus();
        });
    }


    var visible = false;
    var dialog, statusBox, sessionBox;
    var start, join, stop, status, link, linkText, sessionName, nick;

    var prefs = Javatari.userPreferences.current;

    var k = jt.DOMKeys;
    var EXIT_KEYS = [ k.VK_ESCAPE.c ];

};
