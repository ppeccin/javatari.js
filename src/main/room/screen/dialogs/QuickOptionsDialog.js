// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.QuickOptionsDialog = function(mainElement, consoleControls, peripheralControls) {
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
    };

    this.hide = function() {
        if (!visible) return;
        Javatari.userPreferences.save();
        dialog.classList.remove("jt-show");
        visible = false;
        Javatari.room.screen.focus();
    };

    function refresh() {
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];
            var report = item.peripheral ? peripheralControls.getControlReport(item.control) : consoleControls.getControlReport(item.control);
            item.value = report.label;
            item.selected = report.active;
            controlsItems[i].innerHTML = item.value;
            controlsItems[i].classList.toggle("jt-selected", !!item.selected);
        }
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "jt-quick-options";
        dialog.tabIndex = -1;

        var cc = jt.ConsoleControls;
        var pc = jt.PeripheralControls;

        items = [
            { label: "NTSC / PAL",         control: cc.VIDEO_STANDARD },
            { label: "Collisions",         control: cc.NO_COLLISIONS },
            { label: "Audio Buffer *",     control: pc.SPEAKER_BUFFER_TOGGLE,       peripheral: true },
            { label: "Paddles Mode",       control: pc.PADDLES_TOGGLE_MODE,         peripheral: true },
            { label: "Turbo Fire",         control: pc.TURBO_FIRE_TOGGLE,           peripheral: true },
            { label: "Big Directionals *", control: pc.TOUCH_TOGGLE_DIR_BIG,        peripheral: true },
            { label: "Haptic Feedback *",  control: pc.HAPTIC_FEEDBACK_TOGGLE_MODE, peripheral: true }
        ];

        // Define list
        var list = document.createElement('ul');
        list.classList.add("jt-quick-options-list");

        for (var i = 0; i < items.length; ++i) {
            var li = document.createElement("li");
            var label = document.createElement("div");
            label.innerHTML = items[i].label;
            li.appendChild(label);
            var control = document.createElement("div");
            control.classList.add("jt-control");
            control.jtControlItem = items[i];
            li.appendChild(control);
            list.appendChild(li);
            controlsItems.push(control);
        }

        dialog.appendChild(list);

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
    var items, controlsItems = [];

    var k = jt.DOMKeys;
    var EXIT_KEYS = [ k.VK_ESCAPE.c, k.VK_ENTER.c, k.VK_SPACE.c ];

};
