// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

// HTML and CSS data for Settings

jt.SettingsGUI = { WIDTH: 600, HEIGHT: 450};

jt.SettingsGUI.html = function() {
    return `<div id="jt-modal" tabindex="-1">
        <div id="jt-menu">
            <div id="jt-back" jt-var="true">
                <div class="jt-back-arrow">
                </div>
            </div>
            <div class="jt-caption">
                Help & Settings
            </div>
            <div class="jt-items">
                <div id="jt-menu-console" class="jt-item" jt-var="true">
                    CONSOLE
                </div>
                <div id="jt-menu-ports" class="jt-item" jt-var="true">
                    CONTROLLERS
                </div>
                <div id="jt-menu-general" class="jt-item jt-selected" jt-var="true">
                    EMULATION
                </div>
                <div id="jt-menu-about" class="jt-item" jt-var="true">
                    ABOUT
                </div>
                <div id="jt-menu-selection" jt-var="true">
                </div>
            </div>
        </div>
        <div id="jt-content" jt-var="true">
            <div id="jt-console">
                <div class="jt-left">
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F1
                            </div>
                        </div>
                        <div class="jt-desc">
                            POWER
                        </div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F2
                            </div>
                        </div>
                        <div class="jt-desc">
                            TV TYPE
                        </div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F4
                            </div>
                        </div>
                        <div class="jt-desc">
                            P1 Difficulty
                        </div>
                    </div>
                </div>
                <div class="jt-middle">
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F5
                            </div>
                        </div>
                        <div class="jt-desc">
                            Load Cartridge File
                        </div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F6
                            </div>
                        </div>
                        <div class="jt-desc">
                            Load Cartridge URL
                        </div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F7
                            </div>
                        </div>
                        <div class="jt-desc">
                            Remove Cartridge
                        </div>
                    </div>
                </div>
                <div class="jt-right">
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F12
                            </div>
                        </div>
                        <div class="jt-desc">
                            RESET
                        </div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F11
                            </div>
                        </div>
                        <div class="jt-desc">
                            SELECT
                        </div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F9
                            </div>
                        </div>
                        <div class="jt-desc">
                            P2 Difficulty
                        </div>
                    </div>
                </div>
                <div class="jt-full-divider"></div>
                <div class="jt-console-panel">
                    <div class="jt-console-panel-cart-file jt-console-panel-icon"></div>
                    <div class="jt-console-panel-cart-url jt-console-panel-icon"></div>
                    <div class="jt-console-panel-p0-diff-label jt-console-panel-icon"></div>
                    <div class="jt-console-panel-p1-diff-label jt-console-panel-icon"></div>
                    <div class="jt-console-panel-power-labels jt-console-panel-icon"></div>
                    <div class="jt-console-panel-reset-labels jt-console-panel-icon"></div>
                </div>
                <div class="jt-footer">
                    Drag & Drop Files or URLs to load Cartridge ROMs and State Files
                </div>
            </div>
            <div id="jt-ports">
                <div class="jt-left">
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                L
                            </div>
                        </div>
                        <div class="jt-desc">Toggle Paddles</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                K
                            </div>
                        </div>
                        <div class="jt-desc">Toggle Swap Sides</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                J
                            </div>
                        </div>
                        <div class="jt-desc">Toggle Gamepads</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                H
                            </div>
                        </div>
                        <div class="jt-desc">Adjust Turbo Fire speed</div>
                    </div>
                </div>
                <div class="jt-right">
                    <div id="jt-ports-paddles-mode" class="jt-hotkey jt-link jt-joystick-device" jt-var="true">Controllers: JOYSTICKS</div>
                    <div id="jt-ports-p1-mode" class="jt-hotkey jt-link jt-mouse-device" jt-var="true">Swap Mode: NORMAL</div>
                    <div id="jt-ports-gamepads-mode" class="jt-hotkey jt-link jt-joykeys-device" jt-var="true">Gamepads: AUTO (swapped)</div>
                </div>
                <div class="jt-full-divider"></div>
                <div class="jt-player jt-p1">
                    <div id="jt-control-p1-label" class="jt-title" jt-var="true">
                        PLAYER 1
                    </div>
                    <div class="jt-command jt-fire1">
                        Fire<br>
                        <div id="jt-control-p1-button" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-up">
                        <div id="jt-control-p1-up-label" jt-var="true">
                            Up
                        </div>
                        <div id="jt-control-p1-up" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-fire2">
                        Turbo Fire<br>
                        <div id="jt-control-p1-buttonT" class="jt-key" jt-var="true" >
                        </div>
                    </div>
                    <div class="jt-command jt-left">
                        Left<br>
                        <div id="jt-control-p1-left" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-controller">
                        <div id="jt-control-p1-controller" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-right">
                        Right<br>
                        <div id="jt-control-p1-right" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-down">
                        <div id="jt-control-p1-down-label" jt-var="true">
                            Down
                        </div>
                        <div id="jt-control-p1-down" class="jt-key" jt-var="true">
                        </div>
                    </div>
                </div>
                <div class="jt-player jt-p2">
                    <div id="jt-control-p2-label" class="jt-title" jt-var="true">
                        PLAYER 2
                    </div>
                    <div class="jt-command jt-fire1">
                        Fire<br>
                        <div id="jt-control-p2-button" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-up">
                        <div id="jt-control-p2-up-label" jt-var="true">
                            Up
                        </div>
                        <div id="jt-control-p2-up" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-fire2">
                        Turbo Fire<br>
                        <div id="jt-control-p2-buttonT" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-left">
                        Left<br>
                        <div id="jt-control-p2-left" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-controller">
                        <div id="jt-control-p2-controller" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-right">
                        Right<br>
                        <div id="jt-control-p2-right" class="jt-key" jt-var="true">
                        </div>
                    </div>
                    <div class="jt-command jt-down">
                        <div id="jt-control-p2-down-label" jt-var="true">
                            Down
                        </div>
                        <div id="jt-control-p2-down" class="jt-key" jt-var="true">
                        </div>
                    </div>
                </div>
                <div id="jt-ports-revert" class="jt-link" jt-var="true">
                    REVERT
                </div>
                <div id="jt-ports-defaults" class="jt-link" jt-var="true">
                    DEFAULTS
                </div>
            </div>
            <div id="jt-general">
                <div class="jt-left">
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                C
                            </div>
                        </div>
                        <div class="jt-desc">Collisions</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                Shift
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                F1
                            </div>
                        </div>
                        <div class="jt-desc">Fry Console</div>
                    </div>
                    <div class="jt-full-divider"></div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                Q
                            </div>
                        </div>
                        <div class="jt-desc">NTSC/PAL</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                W
                            </div>
                        </div>
                        <div class="jt-desc">V-Synch Modes</div>
                    </div>
                    <div class="jt-divider"></div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                R
                            </div>
                        </div>
                        <div class="jt-desc">CRT Modes</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                T
                            </div>
                        </div>
                        <div class="jt-desc">CRT Filters</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                D
                            </div>
                        </div>
                        <div class="jt-desc">Debug Modes</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                I
                            </div>
                        </div>
                        <div class="jt-desc">Show Info</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                G
                            </div>
                        </div>
                        <div class="jt-desc">Capture Screen</div>
                    </div>
                    <div class="jt-full-divider"></div>
                    <div class="jt-hotkey">
                        <div class="jt-desc">Right-Click Bar Icons: Default Action</div>
                    </div>
                </div>
                <div class="jt-right">
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                0 - 9
                            </div>
                        </div>
                        <div class="jt-desc">Load State</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Ctrl
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                0 - 9
                            </div>
                        </div>
                        <div class="jt-desc">Save State</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F8
                            </div>
                        </div>
                        <div class="jt-desc">Save State File</div>
                    </div>
                    <div class="jt-full-divider"></div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                F12
                            </div>&nbsp;&nbsp;/&nbsp;&nbsp;<div class="jt-key">
                                Shift
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                F12
                            </div>
                        </div>
                        <div class="jt-desc">Fast / Slow Speed</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                Shift
                            </div>&nbsp;<div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                Arrows
                            </div>
                        </div>
                        <div class="jt-desc">Adjust Speed</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                P
                            </div>
                        </div>
                        <div class="jt-desc">Toggle Pause</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                O
                            </div>&nbsp;/&nbsp;<div class="jt-key">
                                F
                            </div>
                        </div>
                        <div class="jt-desc">Next Frame</div>
                    </div>
                    <div class="jt-full-divider"></div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                Enter
                            </div>
                        </div>
                        <div class="jt-desc">Full Screen</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key jt-key-fixed">
                                Ctrl
                            </div>&nbsp;<div class="jt-key jt-key-fixed">
                                Alt
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                Arrows
                            </div>
                        </div>
                        <div class="jt-desc">Screen Size / Width</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                Shift
                            </div>&nbsp;<div class="jt-key jt-key-fixed">
                                Ctrl
                            </div>&nbsp;+&nbsp;<div class="jt-key">
                                Arrows
                            </div>
                        </div>
                        <div class="jt-desc">Viewport Size / Origin</div>
                    </div>
                    <div class="jt-hotkey">
                        <div class="jt-command">
                            <div class="jt-key">
                                Backspace
                            </div>
                        </div>
                        <div class="jt-desc">Defaults</div>
                    </div>
                </div>
            </div>
            <div id="jt-about">
                <div id="jt-logo-version">version&nbsp` + Javatari.VERSION + `</div>
                <div class="jt-info">` +
                    atob("Q3JlYXRlZCBieSBQYXVsbyBBdWd1c3RvIFBlY2Npbg==") + `<br>` +
                    atob("PGEgdGFyZ2V0PSJfYmxhbmsiIGhyZWY9Imh0dHA6Ly9qYXZhdGFyaS5vcmciPmh0dHA6Ly9qYXZhdGFyaS5vcmc8L2E+") + `
                </div>
                <div id="jt-browserinfo" jt-var="true">
                </div>
            </div>
        </div>
    </div>`;
};

jt.SettingsGUI.css = function() {
    return `#jt-modal * {
    outline: none;
    box-sizing: border-box;
}

#jt-modal {
    position: absolute;
    overflow: hidden;
    width: ` + jt.SettingsGUI.WIDTH + `px;
    height: 0;
    opacity: 0;
    visibility: hidden;
    top: 50%;
    left: 50%;
    color: hsl(0, 0%, 10%);
    font: normal 13px sans-serif;
    white-space: nowrap;
    text-align: initial;
    box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);
    transform: scale(0.85);
    transition: visibility .2s ease-out, opacity .2s ease-out, transform .2s ease-out, height .25s step-end;
    -webkit-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    z-index: 50;
}
#jt-modal.jt-show {
    transform: scale(1);
    transition: visibility .2s ease-out, opacity .2s ease-out, transform .2s ease-out;
    height: ` + jt.SettingsGUI.HEIGHT + `px;
    visibility: visible;
    opacity: 1;
}

#jt-modal .jt-heading {
    font-weight: 700;
    color: hsl(0, 0%, 30%);
}

#jt-modal .jt-link {
    font-weight: 700;
    line-height: 21px;
    color: hsl(228, 90%, 40%);
    cursor: pointer;
}
#jt-modal .jt-link:hover {
    outline: 1px solid;
}

.jt-command {
    position: relative;
    display: inline-block;
    font-weight: 600;
    color: hsl(0, 0%, 48%);
}

.jt-hotkey {
    height: 27px;
    padding: 3px 5px;
    box-sizing: border-box;
}

.jt-hotkey .jt-desc {
    display: inline-block;
    line-height: 21px;
}

.jt-key {
    position: relative;
    display: inline-block;
    top: -1px;
    min-width: 25px;
    height: 21px;
    padding: 4px 6px 3px;
    box-sizing: border-box;
    font-weight: 600;
    font-size: 12px;
    line-height: 12px;
    color: hsl(0, 0%, 42%);
    background: white;
    border-radius: 3px;
    border: 1px solid rgb(210, 210, 210);
    box-shadow: 0 1px 0 1px hsl(0, 0%, 47%);
    text-align: center;
}

.jt-key-fixed {
    width: 31px;
    padding-left: 0;
    padding-right: 2px;
}

.jt-footer {
    margin-top: 16px;
    text-align: center;
}

#jt-menu {
    position: relative;
    background: white;
    border-bottom: 1px solid hsl(0, 0%, 72%);
}

#jt-menu #jt-back {
    position: absolute;
    width: 40px;
    height: 34px;
    margin: 3px 1px;
    padding: 16px 12px;
    cursor: pointer;
}
#jt-menu #jt-back:hover {
    background: rgba(0, 0, 0, .12);
}

.jt-back-arrow {
    display: block;
    width: 16px;
    height: 2px;
    border-radius: 1000px;
    background: hsl(0, 0%, 98%);
}
.jt-back-arrow:before {
    content: "";
    display: block;
    position: absolute;
    width: 10px;
    height: 2px;
    border-radius: inherit;
    background: inherit;
    transform: rotate(-45deg);
    transform-origin: 1px 1px;
}
.jt-back-arrow:after {
    content: "";
    display: block;
    position: absolute;
    width: 10px;
    height: 2px;
    border-radius: inherit;
    background: inherit;
    transform: rotate(45deg);
    transform-origin: 1px 1px;
}


#jt-menu .jt-caption {
    height: 29px;
    margin: 0 -1px;
    padding: 10px 0 0 48px;
    font-size: 18px;
    color: white;
    background: hsl(358, 66%, 50%);
    box-shadow: 0 1px 3px rgba(0, 0, 0, .9);
    vertical-align: middle;
    box-sizing: content-box;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#jt-menu .jt-items {
    position: relative;
    width: 84%;
    height: 39px;
    margin: 0 auto;
    font-weight: 600;
}

#jt-menu .jt-item {
    float: left;
    width: 25%;
    height: 100%;
    padding-top: 13px;
    font-size: 14px;
    color: rgba(0, 0, 0, .43);
    text-align: center;
    cursor: pointer;
}

#jt-menu .jt-selected {
    color: hsl(358, 67%, 46%);
}

#jt-menu #jt-menu-selection {
    position: absolute;
    left: 0;
    bottom: 0;
    width: 25%;
    height: 3px;
    background: hsl(358, 67%, 46%);
    transition: left 0.3s ease-in-out;
}

#jt-content {
    position: relative;
    left: 0;
    width: 3000px;
    height: 371px;
    background: rgb(218, 218, 218);
    transition: left 0.3s ease-in-out
}

#jt-console, #jt-ports, #jt-general, #jt-about {
    position: absolute;
    width: ` + jt.SettingsGUI.WIDTH + `px;
    height: 100%;
    box-sizing: border-box;
}


#jt-console {
    padding-top: 35px;
}

#jt-console .jt-hotkey {
    height: 29px;
}

#jt-console .jt-command {
    width: 42px;
}

#jt-console .jt-left, #jt-console .jt-middle, #jt-console .jt-right {
    float: left;
}

#jt-console .jt-left {
    width: 160px;
    margin-left: 58px;
}

#jt-console .jt-middle {
    width: 204px;
}

#jt-console .jt-right .jt-command {
    width: 46px;
}

#jt-console .jt-console-panel {
    position: relative;
    margin: 18px auto 0;
    box-shadow: rgba(0, 0, 0, 0.6) 2px 2px 4px;
}

#jt-console .jt-console-panel * {
    cursor: auto;
}

#jt-console .jt-footer {
    margin: 20px auto;
}

#jt-ports {
    left: ` + jt.SettingsGUI.WIDTH + `px;
    padding: 18px 0 0 27px;
}

#jt-ports > .jt-left {
    float: left;
    width: 335px;
    padding-left: 26px;
}

#jt-ports > .jt-right {
    float: left;
}

#jt-ports .jt-command {
    width: 91px;
}

#jt-ports .jt-bottom {
    width: 546px;
    text-align: center;
}

#jt-ports .jt-player {
    position: absolute;
    top: 146px;
    width: 217px;
    color: rgba(0, 0, 0, .8);
}

#jt-ports .jt-p1 {
    left: 47px;
}

#jt-ports .jt-p2 {
    right: 47px;
}

#jt-ports .jt-title {
    margin-bottom: 09px;
    font-size: 14px;
    line-height: 14px;
    font-weight: bold;
    color: hsl(0, 0%, 35%);
    text-align: center;
}

#jt-ports .jt-player .jt-command {
    display: block;
    position: relative;
    float: left;
    width: 33%;
    height: 45px;
    font-size: 13px;
    text-align: center;
}

#jt-ports .jt-command.jt-fire1, #jt-ports .jt-command.jt-fire2 {
    top: 14px;
}

#jt-ports .jt-command.jt-left, #jt-ports .jt-command.jt-right {
    top: 27px;
}

#jt-ports .jt-command.jt-down {
    float: none;
    clear: both;
    margin: 0 auto;
}

#jt-ports .jt-command.jt-controller {
    height: 90px;
}

#jt-ports #jt-control-p1-controller, #jt-ports #jt-control-p2-controller {
    width: 70px;
    height: 89px;
    margin-left: 1px;
    background: url("` + jt.Images.urls.controllers + `") no-repeat -1px 0;
    background-size: 73px 179px;
}

#jt-ports .jt-player .jt-key {
    min-width: 33px;
    height: 23px;
    padding: 5px 6px 4px;
    margin-top: 2px;
    cursor: pointer;
}

#jt-ports .jt-player .jt-key:hover {
    box-shadow: 0 1px 0 1px rgba(0, 0, 0, .5), 1px 2px 6px 4px rgb(170, 170, 170);
}

#jt-ports .jt-player .jt-key.jt-redefining {
    color: white;
    background-color: rgb(87, 128, 255);
    border-color: rgb(71, 117, 255);
}

#jt-ports .jt-player .jt-key.jt-undefined {
    background-color: rgb(255, 150, 130);
    border-color: rgb(255, 130, 90);
}

#jt-ports-defaults, #jt-ports-revert {
    position: absolute;
    left: 260px;
    width: 82px;
    text-align: center;
    padding: 3px 0 1px;
    font-size: 12px;
}

#jt-ports-defaults {
    bottom: 47px;
}

#jt-ports-revert {
    bottom: 21px;
}


#jt-general {
    left: ` + (jt.SettingsGUI.WIDTH * 2) + `px;
    padding-top: 18px;
    padding-left: 34px;
}

#jt-general .jt-left {
    float: left;
    width: 245px;
}

#jt-general .jt-left .jt-command {
    width: 99px;
}

#jt-general .jt-right {
    float: left;
}

#jt-general .jt-right .jt-command {
    width: 160px;
}


#jt-about {
    left: ` + (jt.SettingsGUI.WIDTH * 3) + `px;
    font-size: 18px;
}

#jt-about #jt-logo-version {
    width: 300px;
    height: 238px;
    margin: 26px auto 19px;
    color: hsl(0, 0%, 98%);
    padding-top: 200px;
    box-sizing: border-box;
    text-align: center;
    background: black url("` + jt.Images.urls.logo + `") center 18px no-repeat;
    background-size: 233px 173px;
    box-shadow: 3px 3px 14px rgb(75, 75, 75);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
}

#jt-about .jt-info {
    line-height: 30px;
    text-align: center;
}

#jt-about a {
    color: rgb(0, 40, 200);
    text-decoration: none;
}
#jt-about a:hover {
    text-decoration: underline;
}

#jt-about #jt-browserinfo {
    position: absolute;
    left: 0;
    right: 0;
    bottom: 7px;
    font-size: 10px;
    text-align: center;
    color: transparent;
}


.jt-clear {
    clear: both;
}

.jt-divider {
    clear: both;
    height: 27px;
}

.jt-full-divider {
    clear: both;
    height: 21px;
}

#jt-general .jt-full-divider {
    clear: both;
    height: 18px;
}`;
};
