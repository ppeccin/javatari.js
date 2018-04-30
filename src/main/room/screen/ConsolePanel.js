// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.ConsolePanel = function(screen, panelElement) {
"use strict";

    this.connectPeripherals = function(pFileLoader, pConsoleControls, pPeripheralControls) {
        consoleControls = pConsoleControls;
        peripheralControls = pPeripheralControls;
        pFileLoader.registerForDnD(panelElement);
    };

    this.connect = function(pControlsSocket) {
        controlsSocket = pControlsSocket;
    };

    this.setActive = function(pActive) {
        active = pActive;
        if (active) {
            if (!powerButton) create();
            refreshCartridge();
            updateVisibleControlsState();
        }
        document.documentElement.classList.toggle("jt-console-panel-active", active);
    };

    this.setLogoMessageActive = function(active) {
        logoMessageActive = active;
    };

    this.updateScale = function(screenWidth, isFullscreen, isLandscape) {
        var height = 0, width = 0;
        if (active) {
            screenWidth = isFullscreen
                ? isLandscape ? screenWidth * 0.85 : screenWidth - 36
                : screenWidth * 0.85;
            var scale = Math.min(1, screenWidth / jt.ConsolePanel.DEFAULT_WIDTH);
            panelElement.style.transform = scale < 1
                ? "translateX(-50%) scale(" + scale.toFixed(8) + ")"
                : "translateX(-50%)";
            height = Math.ceil(scale * jt.ConsolePanel.DEFAULT_HEIGHT);
            width  = Math.ceil(scale * jt.ConsolePanel.DEFAULT_WIDTH);
        }

        if (consoleControls) consoleControls.getTouchControls().updateConsolePanelSize(screenWidth, width, height, isFullscreen, isLandscape);

        //console.error("PANEL SCALE: " + scale);

        return height;
    };

    function create() {
        setupMain();
        setupButtons();
        setupCartridgeLabel();
    }

    var refreshControls = function() {
        // Controls State
        setVisibility(powerButton, !controlsStateReport[controls.POWER]);
        setVisibility(colorButton, controlsStateReport[controls.BLACK_WHITE]);
        setVisibility(selectButton, controlsStateReport[controls.SELECT]);
        setVisibility(resetButton, controlsStateReport[controls.RESET]);
        setVisibility(p0DiffButton, controlsStateReport[controls.DIFFICULTY0]);
        setVisibility(p1DiffButton, controlsStateReport[controls.DIFFICULTY1]);
        refreshCartridge();
    };

    var refreshCartridge = function () {
        // Cartridge Image
        setVisibility(cartInsertedImage, cartridgeInserted);
        setVisibility(cartLabel, cartridgeInserted);

        // Cartridge Label
        cartLabel.innerHTML = (cartridgeInserted && cartridgeInserted.rom.info.l) || DEFAULT_CARTRIDGE_LABEL;
        if (cartridgeInserted && cartridgeInserted.rom.info.lc) {
            var colors = cartridgeInserted.rom.info.lc.trim().split(/\s+/);
            cartLabel.style.color = colors[0] || DEFAULT_CARTRIDGE_LABEL_COLOR;
            cartLabel.style.background = colors[1] || DEFAULT_CARTRIDGE_BACK_COLOR;
            cartLabel.style.borderColor = colors[2] || DEFAULT_CARTRIDGE_BORDER_COLOR;
        } else {
            cartLabel.style.color = DEFAULT_CARTRIDGE_LABEL_COLOR;
            cartLabel.style.background = DEFAULT_CARTRIDGE_BACK_COLOR;
            cartLabel.style.borderColor = DEFAULT_CARTRIDGE_BORDER_COLOR;
        }
    };

    var updateVisibleControlsState = function() {
        controlsSocket.controlsStateReport(controlsStateReport);
        refreshControls();
    };

    var setupMain = function () {
        panelElement.innerHTML = jt.ScreenGUI.htmlConsolePanel;
        delete jt.ScreenGUI.htmlConsolePanel;

        if (jt.Util.isMobileDevice()) panelElement.classList.add("jt-hide-labels");
    };

    var setupButtons = function() {
        powerButton  = document.getElementById("jt-console-panel-power");
        consoleControlButton(powerButton, controls.POWER, true);
        colorButton  = document.getElementById("jt-console-panel-color");
        consoleControlButton(colorButton, controls.BLACK_WHITE, true);
        selectButton = document.getElementById("jt-console-panel-select");
        consoleControlButton(selectButton, controls.SELECT, true);
        resetButton  = document.getElementById("jt-console-panel-reset");
        consoleControlButton(resetButton, controls.RESET, true);
        p0DiffButton = document.getElementById("jt-console-panel-p0-diff");
        consoleControlButton(p0DiffButton, controls.DIFFICULTY0, true);
        p1DiffButton = document.getElementById("jt-console-panel-p1-diff");
        consoleControlButton(p1DiffButton, controls.DIFFICULTY1, true);

        cartInsertedImage = document.getElementById("jt-console-panel-cart-image");
        cartChangeButton  = document.getElementById("jt-console-panel-cart-load");
        addCartridgeControlButton(cartChangeButton, jt.PeripheralControls.CARTRIDGE_LOAD_RECENT);

        cartChangeFileButton = document.getElementById("jt-console-panel-cart-file");
        cartChangeURLButton = document.getElementById("jt-console-panel-cart-url");

        if (!Javatari.CARTRIDGE_CHANGE_DISABLED) {
            addCartridgeControlButton(cartChangeFileButton, jt.PeripheralControls.CARTRIDGE_LOAD_RECENT);
            addCartridgeControlButton(cartChangeURLButton, jt.PeripheralControls.AUTO_LOAD_URL);
        } else {
            setUnavailable(cartChangeFileButton);
            setUnavailable(cartChangeURLButton);
        }
    };

    var consoleControlButton = function (but, control, isHold) {
        but.jtControl = control;
        if (isHold) {
            but.jtPressed = false;
            jt.Util.addEventsListener(but, "mousedown touchstart", switchPressed);
            jt.Util.addEventsListener(but, "mouseup touchend touchcancel", switchReleased);
            jt.Util.addEventsListener(but, "mouseleave", switchLeft);
        } else
            jt.Util.onTapOrMouseDown(but, switchPressed);
    };

    function switchPressed(e) {
        jt.Util.blockEvent(e);
        if (logoMessageActive) return;
        consoleControls.hapticFeedbackOnTouch(e);
        screen.closeAllOverlays();
        e.target.jtPressed = true;
        consoleControls.processControlState(e.target.jtControl, true);
    }

    function switchReleased(e) {
        jt.Util.blockEvent(e);
        e.target.jtPressed = false;
        if (logoMessageActive) return;
        consoleControls.hapticFeedbackOnTouch(e);
        consoleControls.processControlState(e.target.jtControl, false);
    }

    function switchLeft(e) {
        if (!e.target.jtPressed) return;
        switchReleased(e);
    }

    var addCartridgeControlButton = function (but, control) {
        but.jtControl = control;
        but.jtNeedsUIG = true;
        jt.Util.onTapOrMouseDownWithBlockUIG(but, cartridgeButtonPressed);
    };

    function cartridgeButtonPressed(e, uigStart, uigEnd) {
        if (!uigEnd) consoleControls.hapticFeedbackOnTouch(e);
        if (uigStart) return;
        screen.closeAllOverlays();
        peripheralControls.controlActivated(e.target.jtControl);
    }

    var setVisibility = function(element, boo) {
        element.style.opacity = boo ? 1 : 0;
    };

    var setUnavailable = function(element, boo) {
        element.style.display = "none";
    };

    var setupCartridgeLabel = function() {
        // Adjust default colors for the label as per parameters
        var colors = (Javatari.CARTRIDGE_LABEL_COLORS || "").trim().split(/\s+/);
        if (colors[0]) DEFAULT_CARTRIDGE_LABEL_COLOR = colors[0];
        if (colors[1]) DEFAULT_CARTRIDGE_BACK_COLOR = colors[1];
        if (colors[2]) DEFAULT_CARTRIDGE_BORDER_COLOR = colors[2];

        cartLabel = document.getElementById("jt-console-panel-cart-label");
        addCartridgeControlButton(cartLabel, jt.PeripheralControls.CARTRIDGE_LOAD_RECENT);
    };



    // Controls interface  -----------------------------------

    var controls = jt.ConsoleControls;

    this.controlStateChanged = function(control, state) {
        if (active && visibleControls[control]) updateVisibleControlsState();
    };

    this.controlsStatesRedefined = function () {
        if (active) updateVisibleControlsState();
    };


    // Cartridge interface  ------------------------------------

    this.cartridgeInserted = function(cartridge) {
        cartridgeInserted = cartridge;
        if (active) refreshCartridge();
    };


    var active = false;

    var consoleControls;
    var peripheralControls;
    var controlsSocket, controlsStateReport = {};
    var cartridgeInserted;
    var logoMessageActive = false;

    var powerButton;
    var colorButton;
    var selectButton;
    var resetButton;
    var p0DiffButton;
    var p1DiffButton;
    var cartInsertedImage;
    var cartChangeButton;
    var cartChangeFileButton;
    var cartChangeURLButton;

    var cartLabel;

    var visibleControls = {};
    visibleControls[controls.POWER] = 1;
    visibleControls[controls.BLACK_WHITE] = 1;
    visibleControls[controls.SELECT] = 1;
    visibleControls[controls.RESET] = 1;
    visibleControls[controls.DIFFICULTY0] = 1;
    visibleControls[controls.DIFFICULTY1] = 1;


    var DEFAULT_CARTRIDGE_LABEL =        "JAVATARI";
    var DEFAULT_CARTRIDGE_LABEL_COLOR =  "#fa2525";
    var	DEFAULT_CARTRIDGE_BACK_COLOR =   "#101010";
    var	DEFAULT_CARTRIDGE_BORDER_COLOR = "transparent";

};

jt.ConsolePanel.DEFAULT_WIDTH = 460;
jt.ConsolePanel.DEFAULT_HEIGHT = 134;

jt.ConsolePanel.shouldStartActive = function() {
    // Try some backward compatible means to find if Panel should not be active by default
    return !Javatari.SCREEN_CONSOLE_PANEL_DISABLED && (Javatari.CONSOLE_PANEL_ELEMENT_ID === -1 || document.getElementById(Javatari.CONSOLE_PANEL_ELEMENT_ID));
};

jt.ConsolePanel.sameBoxShadowAsScreen = function() {
    var screenElement = document.getElementById(Javatari.SCREEN_ELEMENT_ID);
    return screenElement ? window.getComputedStyle(screenElement, null).getPropertyValue("box-shadow") : "none";
};