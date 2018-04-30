// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.SaveStateDialog = function(mainElement, consoleControls, peripheralControls, stateMedia) {
"use strict";

    var self = this;

    this.show = function (pSave) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(pSave);
            }, 0);
        }

        save = pSave;
        visible = true;
        refreshList();
        dialog.classList.add("jt-show");
        dialog.focus();

        jt.Util.scaleToFitParentHeight(dialog, mainElement, jt.ScreenGUI.BAR_HEIGHT);
    };

    this.hide = function (confirm) {
        if (!visible) return;
        dialog.classList.remove("jt-show");
        visible = false;
        Javatari.room.screen.focus();
        if (confirm) {
            var option = slotOptions[slotSelected];
            var control = save ? option.save : option.load;
            if (option.peripheral) peripheralControls.controlActivated(control);
            else consoleControls.processControlState(control, true);
        }
    };

    function refreshList() {
        header.textContent = "Select Slot to " + (save ? "Save" : "Load");
        var prefix = save ? "Save to " : "Load from ";
        for (var i = 0; i < listItems.length; ++i) {
            var li = listItems[i];
            li.innerHTML = prefix + slotOptions[i].d;
            li.classList.toggle("jt-toggle-checked", stateMedia.isSlotUsed(i + 1));
        }
        refreshListSelection();
    }

    function refreshListSelection() {
        for (var i = 0; i < listItems.length; ++i)
            listItems[i].classList.toggle("jt-selected", i === slotSelected);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "jt-savestate";
        dialog.classList.add("jt-select-dialog");
        dialog.style.width = "280px";
        dialog.style.height = "" + (41 + 11 * 33) + "px";
        dialog.tabIndex = -1;

        header = document.createTextNode("Select Slot");
        dialog.appendChild(header);

        // Define list
        list = document.createElement('ul');
        list.style.width = "80%";

        for (var i = 0; i < slotOptions.length; ++i) {
            var li = document.createElement("li");
            li.classList.add("jt-visible");
            if (i < slotOptions.length - 1) li.classList.add("jt-toggle");
            li.style.textAlign = "center";
            li.innerHTML = slotOptions[i].d;
            li.jtSlot = i;
            li.jtNeedsUIG = true;         // Will open dialog or download file!
            listItems.push(li);
            list.appendChild(li);
        }
        dialog.appendChild(list);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        function hideAbort()   { self.hide(false); }
        function hideConfirm() { self.hide(true); }

        // Do not close with taps or clicks inside
        jt.Util.onTapOrMouseDownWithBlock(dialog, function() {
            dialog.focus();
        });

        // Select with tap or mousedown (UIG)
        jt.Util.onTapOrMouseDownWithBlockUIG(dialog, function(e, uigStart) {
            if (e.target.jtSlot >= 0) {
                if (uigStart) jt.DOMConsoleControls.hapticFeedbackOnTouch(e);
                slotSelected = e.target.jtSlot;
                refreshListSelection();
                if (!uigStart) setTimeout(hideConfirm, 120);  // UIG
            }
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            // Abort
            if (e.keyCode === ESC_KEY) hideAbort();
            // Confirm
            else if (CONFIRM_KEYS.indexOf(e.keyCode) >= 0) hideConfirm();
            // Select
            else if (SELECT_KEYS[e.keyCode]) {
                slotSelected += SELECT_KEYS[e.keyCode];
                if (slotSelected < 0) slotSelected = 0; else if (slotSelected > 10) slotSelected = 10;
                refreshListSelection();
            }
            return jt.Util.blockEvent(e);
        });
    }


    var save = false;
    var slotSelected = 0;

    var dialog, list;
    var listItems = [];
    var visible = false;
    var header;

    var c = jt.ConsoleControls;
    var p = jt.PeripheralControls;
    var slotOptions = [
        { d: "Slot 1", load: c.LOAD_STATE_1,             save: c.SAVE_STATE_1 },
        { d: "Slot 2", load: c.LOAD_STATE_2,             save: c.SAVE_STATE_2 },
        { d: "Slot 3", load: c.LOAD_STATE_3,             save: c.SAVE_STATE_3 },
        { d: "Slot 4", load: c.LOAD_STATE_4,             save: c.SAVE_STATE_4 },
        { d: "Slot 5", load: c.LOAD_STATE_5,             save: c.SAVE_STATE_5 },
        { d: "Slot 6", load: c.LOAD_STATE_6,             save: c.SAVE_STATE_6 },
        { d: "Slot 7", load: c.LOAD_STATE_7,             save: c.SAVE_STATE_7 },
        { d: "Slot 8", load: c.LOAD_STATE_8,             save: c.SAVE_STATE_8 },
        { d: "Slot 9", load: c.LOAD_STATE_9,             save: c.SAVE_STATE_9 },
        { d: "Slot 10", load: c.LOAD_STATE_10,           save: c.SAVE_STATE_10 },
        { d: "File...", load: p.CONSOLE_LOAD_STATE_FILE, save: p.CONSOLE_SAVE_STATE_FILE, peripheral: true }
    ];

    var k = jt.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS = [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECT_KEYS = {};
    SELECT_KEYS[k.VK_UP.c] = -1;
    SELECT_KEYS[k.VK_DOWN.c] = 1;

};