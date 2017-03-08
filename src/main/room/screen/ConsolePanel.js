// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.ConsolePanel = function(screen) {
"use strict";

    function init() {
        setupMain();
        setupButtons();
        setupCartridgeLabel();
    }

    var visibleControls;
    this.connectPeripherals = function(pFileLoader, pPeripheralControls) {
        peripheralControls = pPeripheralControls;
        pFileLoader.registerForDnD(panelElement);
    };

    this.connect = function(pControlsSocket) {
        controlsSocket = pControlsSocket;
    };

    this.powerOn = function() {
        panelElement.style.visibility = "visible";
        refreshControls();
        refreshCartridge()
    };

    this.powerOff = function() {
        panelElement.style.visibility = "hidden";
        panelElement.style.display = "none";
    };

    this.keyControlsInputElements = function() {
        return [panelElement];
    };

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
        panelElement = document.getElementById("jt-console-panel");
        panelElement.innerHTML = jt.ScreenGUI.htmlConsolePanel;
        delete jt.ScreenGUI.htmlConsolePanel;

        document.documentElement.classList.add("jt-show-console-panel");
        var screenElement = document.getElementById(Javatari.SCREEN_ELEMENT_ID);
        if (screenElement.style.boxShadow) panelElement.style.boxShadow = screenElement.style.boxShadow;     // Use same shadow as main screen :-)
    };

    var setupButtons = function() {
        powerButton  = document.getElementById("jt-console-panel-power");
        consoleControlButton(powerButton, controls.POWER, false);
        colorButton  = document.getElementById("jt-console-panel-color");
        consoleControlButton(colorButton, controls.BLACK_WHITE, false);
        selectButton = document.getElementById("jt-console-panel-select");
        consoleControlButton(selectButton, controls.SELECT, true);
        resetButton  = document.getElementById("jt-console-panel-reset");
        consoleControlButton(resetButton, controls.RESET, true);
        p0DiffButton = document.getElementById("jt-console-panel-p0-diff");
        consoleControlButton(p0DiffButton, controls.DIFFICULTY0, false);
        p1DiffButton = document.getElementById("jt-console-panel-p1-diff");
        consoleControlButton(p1DiffButton, controls.DIFFICULTY1, false);

        cartInsertedImage = document.getElementById("jt-console-panel-cart-image");
        cartChangeButton  = document.getElementById("jt-console-panel-cart-load");
        addCartridgeControlButton(cartChangeButton, jt.PeripheralControls.CARTRIDGE_LOAD_FILE);

        if (!Javatari.CARTRIDGE_CHANGE_DISABLED) {
            cartChangeFileButton = document.getElementById("jt-console-panel-cart-file");
            addCartridgeControlButton(cartChangeFileButton, jt.PeripheralControls.CARTRIDGE_LOAD_FILE);
            setVisibility(cartChangeFileButton, true);
            cartChangeURLButton = document.getElementById("jt-console-panel-cart-url");
            addCartridgeControlButton(cartChangeURLButton, jt.PeripheralControls.CARTRIDGE_LOAD_URL);
            setVisibility(cartChangeURLButton, true);
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
        e.target.jtPressed = true;
        controlsSocket.controlStateChanged(e.target.jtControl, true);
    }

    function switchReleased(e) {
        jt.Util.blockEvent(e);
        e.target.jtPressed = false;
        controlsSocket.controlStateChanged(e.target.jtControl, false);
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

    function cartridgeButtonPressed(e) {
        peripheralControls.controlActivated(e.target.jtControl);
    }

    var setVisibility = function(element, boo) {
        element.style.opacity = boo ? 1 : 0;
    };

    var setupCartridgeLabel = function() {
        // Adjust default colors for the label as per parameters
        var colors = (Javatari.CARTRIDGE_LABEL_COLORS || "").trim().split(/\s+/);
        if (colors[0]) DEFAULT_CARTRIDGE_LABEL_COLOR = colors[0];
        if (colors[1]) DEFAULT_CARTRIDGE_BACK_COLOR = colors[1];
        if (colors[2]) DEFAULT_CARTRIDGE_BORDER_COLOR = colors[2];

        cartLabel = document.getElementById("jt-console-panel-cart-label");
        addCartridgeControlButton(cartLabel, jt.PeripheralControls.CARTRIDGE_LOAD_FILE);
    };



    // Controls interface  -----------------------------------

    var controls = jt.ConsoleControls;

    this.controlStateChanged = function(control, state) {
        if (visibleControls[control]) updateVisibleControlsState();
    };

    this.controlsStatesRedefined = function () {
        updateVisibleControlsState();
    };


    // Cartridge interface  ------------------------------------

    this.cartridgeInserted = function(cartridge) {
        cartridgeInserted = cartridge;
        refreshCartridge();
    };


    var panelElement;

    var peripheralControls;

    var controlsSocket;
    var controlsStateReport = {};

    var cartridgeInserted;

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

    visibleControls = {};
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


    init();

};

jt.ConsolePanel.DEFAULT_WIDTH = 465;
jt.ConsolePanel.DEFAULT_HEIGHT = 137;
