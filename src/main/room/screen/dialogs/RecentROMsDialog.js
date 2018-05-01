// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.RecentROMsDialog = function(mainElement, screen, recentROMs, fileLoader) {
"use strict";

    var self = this;

    this.show = function (pSave) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(pSave);
            }, 0);
        }

        items = recentROMs.getCatalog().slice(0);        // clone
        items.sort(function (a, b) { return a.n > b.n; });
        var last = recentROMs.lastROMLoadedIndex;
        last = items.indexOf(items.find(function(r) { return r.i === last; }));
        itemSelected = last < 0 || last >= items.length ? items.length : last;

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
            if (itemSelected === items.length)
                screen.openLoadFileDialog();
            else {
                var rom = recentROMs.getROM(items[itemSelected].i);
                fileLoader.loadROM(rom);
            }
        }
    };

    function refreshList() {
        dialog.style.height = "" + (42 + (items.length + 1) * 33) + "px";

        for (var i = 0; i < 11; ++i) {                               // 10 + 1 for Open File option
            var li = listItems[i];
            var item = items[i];
            li.classList.toggle("jt-visible", i <= items.length);
            li.classList.toggle("jt-toggle", i < items.length);
            li.classList.toggle("jt-toggle-checked", i < items.length);
            li.jtNeedsUIG = i === items.length;                      // Open file
            li.innerHTML = item ? item.n : "&nbsp;&nbsp;Open ROM File...";
        }
        refreshListSelection();
    }

    function refreshListSelection() {
        for (var i = 0; i < listItems.length; ++i)
            listItems[i].classList.toggle("jt-selected", i === itemSelected);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "jt-recent-roms";
        dialog.classList.add("jt-select-dialog");
        dialog.style.width = "350px";
        dialog.tabIndex = -1;

        dialog.appendChild(document.createTextNode("Select Cartridge"));

        // Define list
        list = document.createElement('ul');
        list.style.width = "85%";

        for (var i = 0; i < 11; ++i) {
            var li = document.createElement("li");
            li.style.textAlign = "center";
            li.innerHTML = "";
            li.jtItem = i;
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
            if (e.target.jtItem >= 0) {
                if (uigStart) jt.DOMConsoleControls.hapticFeedbackOnTouch(e);
                itemSelected = e.target.jtItem;
                refreshListSelection();
                if (!uigStart) setTimeout(hideConfirm, 120);
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
                itemSelected += SELECT_KEYS[e.keyCode];
                if (itemSelected < 0) itemSelected = 0; else if (itemSelected > items.length) itemSelected =  items.length;     // + 1 for Open File
                refreshListSelection();
            }
            return jt.Util.blockEvent(e);
        });
    }


    var items = [];
    var itemSelected = 0;

    var dialog, list;
    var listItems = [];
    var visible = false;

    var k = jt.DOMKeys;
    var ESC_KEY = k.VK_ESCAPE.c;
    var CONFIRM_KEYS = [ k.VK_ENTER.c, k.VK_SPACE.c ];
    var SELECT_KEYS = {};
    SELECT_KEYS[k.VK_UP.c] = -1;
    SELECT_KEYS[k.VK_DOWN.c] = 1;

};