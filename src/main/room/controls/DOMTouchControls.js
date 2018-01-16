// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.DOMTouchControls = function(consoleControls) {
"use strict";

    var self = this;

    this.connect = function(pConsoleControlsSocket) {
        consoleControlsSocket = pConsoleControlsSocket;
    };

    this.connectScreen = function(pScreen) {
        screen = pScreen;
    };

    this.powerOn = function() {
        this.applyPreferences();
        resetStates();
        updateVisuals();
    };

    this.powerOff = function() {
    };

    this.releaseControllers = function() {
        resetStates();
    };

    this.updateConsolePanelSize = function(screenWidth, width, height, isFullscreen, isLandscape) {
        if (!speedControls || !isFullscreen) return;

        var center = !isLandscape && ((screenWidth - width - 10) / 2) < SPEED_CONTROLS_WIDTH;

        speedControls.classList.toggle("jt-center", center);
        if (center) speedControls.style.bottom = "" + (jt.ScreenGUI.BAR_HEIGHT + height + 3) + "px";
        else speedControls.style.removeProperty("bottom");
    };

    this.toggleMode = function() {
        if (!isTouchDevice) {
            screen.showOSD("Touch Controls unavailable. Not a touch device!", true, true);
            return;
        }

        mode++; if (mode > 2) mode = 0;     // AUTO mode not selectable
        resetStates();
        this.applyPreferences();
        updateVisuals();
        screen.showOSD("Touch Controls " + this.getModeDesc(), true);
    };

    this.setP1ControlsMode = function(state) {
        p1ControlsMode = state;
        this.applyPreferences();
    };

    this.getModeDesc = function() {
        switch (mode) {
            case -1: return "AUTO";
            case 0:  return "DISABLED";
            case 1:  return "ENABLED";
            case 2:  return "ENABLED (swapped)";
        }
    };

    this.toggleTouchDirBig = function() {
        dirBig = !dirBig;
        prefs.touch.directionalBig = dirBig;
        Javatari.userPreferences.setDirty();
        updateVisuals();
    };

    this.isDirBig = function() {
        return dirBig;
    };

    this.setupTouchControlsIfNeeded = function(mainElement) {
        if (dirElement || mode <= 0) return;

        speedControls = document.createElement('div');
        speedControls.id = "jt-touch-speed";
        var pause = document.createElement('div');
        pause.id = "jt-touch-pause";
        pause.addEventListener("touchstart", pauseTouchStart);
        pause.addEventListener("touchend", pauseTouchEnd);
        speedControls.appendChild(pause);
        var ff = document.createElement('div');
        ff.id = "jt-touch-fast";
        ff.addEventListener("touchstart", fastTouchStart);
        ff.addEventListener("touchend", fastTouchEnd);
        speedControls.appendChild(ff);
        mainElement.appendChild(speedControls);

        var group = document.createElement('div');
        group.id = "jt-touch-left";
        dirElement = createDirectional();
        dirElement.addEventListener("touchstart", dirTouchStart);
        dirElement.addEventListener("touchmove", dirTouchMove);
        dirElement.addEventListener("touchend", dirTouchEnd);
        dirElement.addEventListener("touchcancel", dirTouchEnd);
        group.appendChild(dirElement);
        mainElement.appendChild(group);

        group = document.createElement('div');
        group.id = "jt-touch-right";
        createButton(group, "buttonT");         // Landscape top-down order
        createButton(group, "button");
        mainElement.appendChild(group);

        updateSpeedControls();

        function createDirectional() {
            var elem = document.createElement('div');
            elem.classList.add("jt-touch-dir");
            elem.classList.add("jt-touch-dir-joy");
            createArrowKey("left");
            createArrowKey("right");
            createArrowKey("up");
            createArrowKey("down");
            return elem;

            function createArrowKey(dir) {
                var key = document.createElement('div');
                key.classList.add("jt-touch-dir-" + dir);
                elem.appendChild(key);
                var arr = document.createElement('div');
                arr.classList.add("jt-arrow-" + dir);
                elem.appendChild(arr);
            }
        }

        function createButton(group, name) {
            var but = document.createElement('div');
            but.id = "jt-touch-" + name;
            but.classList.add("jt-touch-button");
            but.classList.add("jt-touch-button-joy");
            but.classList.add("jt-touch-button-joy-" + name);
            but.jtControl = name;
            but.addEventListener("touchstart", buttonTouchStart);
            but.addEventListener("touchmove", jt.Util.blockEvent);
            but.addEventListener("touchend", buttonTouchEnd);
            but.addEventListener("touchcancel", buttonTouchEnd);
            but.addEventListener("mousedown", buttonTouchStart);
            but.addEventListener("mouseup", buttonTouchEnd);
            buttonElements[name] = but;
            group.appendChild(but);
        }
    };

    this.consolePowerAndUserPauseStateUpdate = function(power, paused) {
        consolePower = power;
        consolePaused = paused;
        if (speedControls) updateSpeedControls();
    };

    function updateSpeedControls() {
        speedControls.classList.toggle("jt-poweroff", !consolePower);
        speedControls.classList.toggle("jt-paused", consolePaused);
    }

    function updateVisuals() {
        var active = mode > 0;
        document.documentElement.classList.toggle("jt-touch-active", active);
        document.documentElement.classList.toggle("jt-dir-big", dirBig);
        screen.touchControlsActiveUpdate(active, dirBig);
    }

    function dirTouchStart(e) {
        jt.Util.blockEvent(e);
        if (dirTouchID !== null) return;
        if (dirTouchCenterX === undefined) setDirTouchCenter();

        var touch = e.changedTouches[0];
        dirTouchID = touch.identifier;
        updateDirMovement(touch.pageX, touch.pageY);
    }

    function dirTouchEnd(e) {
        jt.Util.blockEvent(e);
        if (dirTouchID !== null) {
            dirTouchID = null;
            setCurrentDirection(-1);
        }
    }

    function dirTouchMove(e) {
        jt.Util.blockEvent(e);
        if (dirTouchID === null) return;

        var changed = e.changedTouches;
        for (var i = 0; i < changed.length; ++i) {
            if (changed[i].identifier === dirTouchID) {
                updateDirMovement(changed[i].pageX, changed[i].pageY);
                return;
            }
        }
    }

    function updateDirMovement(newX, newY) {
        var dir = -1;
        var x = newX - dirTouchCenterX, y = newY - dirTouchCenterY;
        var dist = Math.sqrt(x*x + y*y);
        if (dist > dirDeadZone) {
            dir = (1 - Math.atan2(x, y) / Math.PI) / 2;
            dir += 1 / 16;
            if (dir >= 1) dir -= 1;
            dir = (dir * 8) | 0;
        }
        setCurrentDirection(dir);
    }

    function setCurrentDirection(newDir) {
        if (dirCurrentDir === newDir) return;

        if (newDir >= 0) consoleControls.hapticFeedback();

        var newUp = false, newRight = false, newDown = false, newLeft = false;
        switch (newDir) {
            case 0: newUp = true; break;
            case 1: newUp = newRight = true; break;
            case 2: newRight = true; break;
            case 3: newDown = newRight = true; break;
            case 4: newDown = true; break;
            case 5: newDown = newLeft = true; break;
            case 6: newLeft = true; break;
            case 7: newUp = newLeft = true; break;
        }
        consoleControls.processKey(joyKeys.up.c, newUp);
        consoleControls.processKey(joyKeys.right.c, newRight);
        consoleControls.processKey(joyKeys.down.c, newDown);
        consoleControls.processKey(joyKeys.left.c, newLeft);

        dirCurrentDir = newDir;
    }

    function setDirTouchCenter() {
        var rec = dirElement.getBoundingClientRect();
        dirDeadZone = ((rec.right - rec.left) * 0.14) | 0;      // 14% deadzone each direction
        dirTouchCenterX = (((rec.left + rec.right) / 2) | 0) + window.pageXOffset;
        dirTouchCenterY = (((rec.top + rec.bottom) / 2) | 0) + window.pageYOffset;
    }

    function buttonTouchStart(e) {
        jt.Util.blockEvent(e);
        processButtonTouch(e.target.jtControl, true);
    }

    function buttonTouchEnd(e) {
        jt.Util.blockEvent(e);
        processButtonTouch(e.target.jtControl, false);
    }

    function processButtonTouch(control, press) {
        if (!control) return;

        if (press) consoleControls.hapticFeedback();
        consoleControls.processKey(joyKeys[control].c, press);
    }

    function pauseTouchStart(e) {
        jt.Util.blockEvent(e);
        consoleControls.hapticFeedback();
        consoleControls.processControlState(!consolePower ? jt.ConsoleControls.POWER : jt.ConsoleControls.PAUSE, true);
    }

    function pauseTouchEnd(e) {
        jt.Util.blockEvent(e);
        consoleControls.processControlState(!consolePower ? jt.ConsoleControls.POWER : jt.ConsoleControls.PAUSE, false);
    }

    function fastTouchStart(e) {
        jt.Util.blockEvent(e);
        consoleControls.processControlState(consolePaused ? jt.ConsoleControls.FRAME : jt.ConsoleControls.FAST_SPEED, true);
    }

    function fastTouchEnd(e) {
        jt.Util.blockEvent(e);
        consoleControls.processControlState(consolePaused ? jt.ConsoleControls.FRAME : jt.ConsoleControls.FAST_SPEED, false);
    }

    function resetStates() {
        joyState.reset();
        dirTouchCenterX = dirTouchCenterY = undefined;
        dirTouchID = null;
        setCurrentDirection(-1);
    }

    this.applyPreferences = function() {
        dirBig = !!prefs.touch.directionalBig;
        var p = mode === 2 ? 1 : 0;
        joyKeys = prefs.joystickKeys[p];
    };


    var consoleControlsSocket;
    var screen;

    var isTouchDevice = jt.Util.isTouchDevice();
    var isMobileDevice = jt.Util.isMobileDevice();
    var mode = Javatari.TOUCH_MODE >= 0 ? Javatari.TOUCH_MODE : isTouchDevice && isMobileDevice ? 1 : 0;            // -1: auto, 0: disabled, 1: enabled, 2: enabled (swapped)
    var p1ControlsMode = false;
    var dirBig = false;

    var dirElement = null, dirTouchID = null, dirTouchCenterX, dirTouchCenterY, dirCurrentDir = -1, dirDeadZone = 0;
    var buttonElements = { };
    var speedControls;

    var joyKeys;
    var joyState = new JoystickState();
    var consolePower = false, consolePaused = false;

    var prefs = Javatari.userPreferences.current;

    var SPEED_CONTROLS_WIDTH = 84;


    function JoystickState() {
        this.reset = function() {
            this.portValue = 0x3f;          // All switches off
        };
        this.reset();
    }


    // Savestate  -------------------------------------------

    this.saveState = function() {
        return {
        };
    };

    this.loadState = function(s) {
        resetStates();
    };

};
