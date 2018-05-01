// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.CartridgeFormatDialog = function(screen, mainElement, atariConsole, cartridgeSocket) {
"use strict";

    var self = this;

    this.show = function (pAltPower) {
        if (!dialog) {
            create();
            return setTimeout(function() {
                self.show(pAltPower);
            }, 0);
        }

        altPower = pAltPower;
        cartridge = cartridgeSocket.inserted();
        if (!cartridge) return;

        format = cartridge.format.name;
        saveFormat = !!userROMFormats.getForROM(cartridge.rom);
        saveFormatEnabled = !!cartridge.rom.info.h;             // No save when hash unavailable

        visible = true;
        dialog.classList.add("jt-show");
        refreshList();
        dialog.focus();

        jt.Util.scaleToFitParentHeight(dialog, mainElement, jt.ScreenGUI.BAR_HEIGHT);
    };

    this.hide = function (confirm) {
        if (!visible) return;
        dialog.classList.remove("jt-show");
        visible = false;
        Javatari.room.screen.focus();
        if (confirm) {
            var formatName = userFormatOptions[optionSelected];
            var isAuto = formatName === userFormatOptions[0];
            var newCart = jt.CartridgeCreator.changeCartridgeFormat(cartridge, jt.CartridgeFormats[formatName]);
            if (saveFormat) userROMFormats.setForROM(cartridge.rom, formatName, isAuto);
            cartridgeSocket.insert(newCart, !altPower && atariConsole.powerIsOn, true);
            screen.showOSD("ROM Format: " + formatName + (isAuto ? " (Auto)" : ""), true);
        }
        cartridge = undefined;
    };

    function refreshList() {
        optionSelected = 0;
        cartridge.reinsertROMContent();
        userFormatOptions = jt.CartridgeCreator.getUserFormatOptionNames(cartridge.rom);
        var autoOption = jt.CartridgeCreator.getBestFormatOption(cartridge.rom);
        if (!autoOption) autoOption = jt.CartridgeFormats["4K"];  // default
        userFormatOptions.unshift(autoOption.name);
        for (var i = 0; i < listItems.length; ++i) {
            if (i < userFormatOptions.length) {
                if (userFormatOptions[i] === format) optionSelected = i;
                listItems[i].innerHTML = i === 0
                    ? "AUTO: " + autoOption.name + ": " + autoOption.desc
                    : userFormatOptions[i] + ": " + jt.CartridgeFormats[userFormatOptions[i]].desc;
                listItems[i].classList.add("jt-visible");
            } else
                listItems[i].classList.remove("jt-visible");
        }
        if (cartridge.format === autoOption) optionSelected = 0;
        refreshListSelection();
        refreshSaveFormat();
    }

    function refreshListSelection() {
        var selItem;
        for (var i = 0; i < userFormatOptions.length; ++i) {
            if (i === optionSelected) {
                selItem = listItems[i];
                selItem.classList.add("jt-selected");
            } else
                listItems[i].classList.remove("jt-selected");
        }

        // Scroll to selected item if needed
        if (list.scrollTop > selItem.offsetTop) {
            list.scrollTop = selItem.offsetTop;
        } else if (list.scrollTop + list.offsetHeight < selItem.offsetTop + 26 + 2) {
            list.scrollTop = selItem.offsetTop - (list.offsetHeight - 26 - 2);        // item height ~ 26px
        }
    }

    function refreshSaveFormat() {
        saveButton.textContent = saveFormatEnabled ? saveFormat ? "YES" : "NO" : "- -";
        saveButton.classList.toggle("jt-selected", saveFormat);
    }

    function create() {
        dialog = document.createElement("div");
        dialog.id = "jt-cartridge-format";
        dialog.classList.add("jt-select-dialog");
        dialog.style.width = "340px";
        dialog.style.height = "310px";
        dialog.tabIndex = -1;

        var header = document.createTextNode("Select ROM Format");
        dialog.appendChild(header);

        // Define list
        list = document.createElement('ul');
        for (var i = 0, len = jt.CartridgeFormatsUserOptions.length + 1; i < len; ++i) {   // + 1 for Auto
            var li = document.createElement("li");
            li.jtIndex = i;
            li.classList.add("jt-visible");
            li.style.textAlign = "center";
            listItems.push(li);
            list.appendChild(li);
        }
        dialog.appendChild(list);

        // Define Remember selection option
        var wDiv = document.createElement('div');
        var ul = document.createElement('ul');
        ul.classList.add("jt-quick-options-list");
        li = document.createElement('li');
        var div = document.createElement('div');
        div.innerHTML = "&#128190;&nbsp; Remember Choice";
        li.appendChild(div);
        saveButton = document.createElement('div');
        saveButton.innerHTML = "NO";
        saveButton.classList.add("jt-control");
        li.appendChild(saveButton);
        ul.appendChild(li);
        wDiv.appendChild(ul);
        dialog.appendChild(wDiv);

        setupEvents();

        mainElement.appendChild(dialog);
    }

    function setupEvents() {
        function hideAbort()   { self.hide(false); }
        function hideConfirm() { self.hide(true); }

        // Do not close with taps or clicks inside
        jt.Util.onTapOrMouseDownWithBlock(dialog, function() {
            list.focus();
        });

        // Allow touch scrolls and touch clicks to happen
        jt.Util.addEventsListener(list, "touchstart touchmove touchend", function(e) {
            e.stopPropagation();
        });

        // Only select with mousedown
        jt.Util.addEventsListener(list, "mousedown", function(e) {
            e.stopPropagation();
            jt.DOMConsoleControls.hapticFeedbackOnTouch(e);
            if (e.target.jtIndex >= 0) selectLineElement(e.target.jtIndex);
        });

        // Confirm on click
        jt.Util.addEventsListener(list, "click", function(e) {
            jt.Util.blockEvent(e);
            if (e.target.jtIndex >= 0) {
                var sameWasSelected = e.target.jtIndex === optionSelected;
                selectLineElement(e.target.jtIndex);
                setTimeout(hideConfirm, sameWasSelected ? 0 : 120);
            }
        });

        function selectLineElement(line) {
            optionSelected = line;
            refreshListSelection();
        }

        // Toggle Save Format option with tap or mousedown
        jt.Util.onTapOrMouseDownWithBlock(saveButton, function(e) {
            if (!saveFormatEnabled) return;
            jt.DOMConsoleControls.hapticFeedbackOnTouch(e);
            saveFormat = !saveFormat;
            refreshSaveFormat();
        });

        // Trap keys, respond to some
        dialog.addEventListener("keydown", function(e) {
            var keyCode = domKeys.codeForKeyboardEvent(e);
            // Abort
            if (keyCode === ESC_KEY) hideAbort();
            // Confirm
            else if (CONFIRM_KEYS.indexOf(keyCode) >= 0) hideConfirm();
            // Select
            else if (SELECT_KEYS[keyCode]) {
                optionSelected += SELECT_KEYS[keyCode];
                if (optionSelected < 0) optionSelected = 0; else if (optionSelected >= userFormatOptions.length) optionSelected = userFormatOptions.length - 1;
                refreshListSelection();
            }
            return jt.Util.blockEvent(e);
        });
    }


    var altPower = false;
    var cartridge;
    var format = "";
    var optionSelected = 0;
    var userFormatOptions = [];

    var dialog, list, saveButton;
    var listItems = [];
    var visible = false;
    var saveFormat = false, saveFormatEnabled = false;

    var userROMFormats = Javatari.userROMFormats;

    var domKeys = jt.DOMKeys;

    var ESC_KEY = domKeys.VK_ESCAPE.c;
    var CONFIRM_KEYS = [ domKeys.VK_ENTER.c, domKeys.VK_SPACE.c ];
    var SELECT_KEYS = {};
    SELECT_KEYS[domKeys.VK_UP.c] = -1;
    SELECT_KEYS[domKeys.VK_DOWN.c] = 1;

};