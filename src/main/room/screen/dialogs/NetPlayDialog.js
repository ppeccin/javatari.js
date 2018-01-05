// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetPlayDialog = function(mainElement, consoleControls, peripheralControls) {
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

        var availHeight = mainElement.clientHeight - jt.ScreenGUI.BAR_HEIGHT - 20;      //  bar - tolerance
        var height = dialog.clientHeight;
        var scale = height < availHeight ? 1 : availHeight / height;
        dialog.style.transform = "translateY(-" + ((jt.ScreenGUI.BAR_HEIGHT / 2) | 0) + "px) scale(" + scale.toFixed(4) + ")";
    };

    this.hide = function() {
        if (!visible) return;
        Javatari.userPreferences.save();
        dialog.classList.remove("jt-show");
        visible = false;
        Javatari.room.screen.focus();
    };

    function refresh() {
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "jt-netplay";
        dialog.tabIndex = -1;

        var statusLine = document.createElement("div");
        statusLine.id = "jt-netplay-status-line";
        dialog.appendChild(statusLine);

        var status = document.createElement("div");
        status.id = "jt-netplay-status";
        status.textContent = 'HOSTING Session "Teste"';
        statusLine.appendChild(status);

        var stop = document.createElement("div");
        stop.id = "jt-netplay-stop";
        stop.textContent = "STOP";
        statusLine.appendChild(stop);

        var sessionLabel = document.createElement("div");
        sessionLabel.id = "jt-netplay-session-label";
        dialog.appendChild(sessionLabel);

        var sessionLine = document.createElement("div");
        sessionLine.id = "jt-netplay-session-line";
        dialog.appendChild(sessionLine);

        var start = document.createElement("div");
        start.id = "jt-netplay-start";
        start.textContent = "HOST";
        sessionLine.appendChild(start);

        var sessionName = document.createElement("input");
        sessionName.id = "jt-netplay-session-name";
        sessionLine.appendChild(sessionName);

        var join = document.createElement("div");
        join.id = "jt-netplay-join";
        join.textContent = "JOIN";
        sessionLine.appendChild(join);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        // Do not close with taps or clicks inside, select with tap or mousedown
        jt.Util.onTapOrMouseDownWithBlock(dialog, function(e) {
            if (e.target.jtControlItem) {
                jt.DOMConsoleControls.hapticFeedbackOnTouch(e);
                var item = e.target.jtControlItem;
                if (item.peripheral) peripheralControls.controlActivated(item.control, false, false);
                else consoleControls.controlStateChanged(item.control, true);
                refresh();
            } else
                dialog.focus();
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            // Exit
            if (EXIT_KEYS.indexOf(e.keyCode) >= 0) self.hide();
            return jt.Util.blockEvent(e);
        });
    }


    var visible = false;
    var dialog, list;

    var k = jt.DOMKeys;
    var EXIT_KEYS = [ k.VK_ESCAPE.c, k.VK_ENTER.c, k.VK_SPACE.c ];

};
