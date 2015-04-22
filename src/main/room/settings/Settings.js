// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Settings = {};

Settings.create = function() {

    var styles = document.createElement('style');
    styles.type = 'text/css';
    styles.innerHTML = Settings.css;
    document.head.appendChild(styles);

    var panel = document.createElement("div");
    panel.innerHTML = Settings.div;
    document.body.appendChild(panel);

    panel.addEventListener("click", function (e) {
        e.preventDefault();
        Settings.hide();
    });

    Settings.panel = panel;

    console.log("created");
};

Settings.show = function() {
    Settings.panel.style.display = "block";

    console.log("show");
};

Settings.hide = function() {
    Settings.panel.style.display = "none";

    console.log("close");
};

Settings.div =
    '<dov class="cover">' +
    '<div class="modal">' +
    '<div class="menu">' +
    '<div class="caption">' +
    'Settings' +
    '</div>' +
    '<div class="items">' +
    '<div class="item selected">' +
    'HELP' +
    '</div>' +
    '<div class="item">' +
    'CONTROLS' +
    '</div>' +
    '<div class="item">' +
    'ABOUT' +
    '</div>' +
    '<div class="selection-bar">' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="content">' +
    '<div class="help">' +
    '<div class="left">' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Ctrl' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    '1 - 0' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Save State' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    '1 - 0' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Load State' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'Enter' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Full Screen' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'V' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'NTSC/PAL' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'R' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'CRT Modes' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'T' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'CRT Filter' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'G' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Show Info' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'D' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Debug Modes' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'C' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Collisions' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'P' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Pause' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'F' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Next Frame' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command">' +
    '<div class="key">' +
    'Tab' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Fast Speed' +
    '</div>' +
    '</div>' +
    '</div>' +
    '<div class="right">' +
    '<div class="item">' +
    '<div class="command command-top">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'F1' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Fry Console' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command command-top">' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'F5/F6' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Load ROM with Power ON' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command command-top">' +
    '<div class="key">' +
    'F7' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Remove Cartridge' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command command-top">' +
    '<div class="key">' +
    'F8' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Save State File' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '</div>' +
    '<div class="item">' +
    '<div class="desc">' +
    'Drag/Drop Files or URLs to load ROMs' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '</div>' +
    '<div class="item">' +
    '<div class="command command-bottom">' +
    '<div class="key">' +
    'Backspace' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Screen Defaults' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command command-bottom">' +
    '<div class="key">' +
    'Shift' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'Arrows' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Screen Size' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command command-bottom">' +
    '<div class="key">' +
    'Shift' +
    '</div>' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'Arrows' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Screen Scale' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command command-bottom">' +
    '<div class="key">' +
    'Shift' +
    '</div>' +
    '<div class="key key-ctrlalt">' +
    'Ctrl' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'Arrows' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Viewport Size' +
    '</div>' +
    '</div>' +
    '<div class="item">' +
    '<div class="command command-bottom">' +
    '<div class="key key-ctrlalt">' +
    'Ctrl' +
    '</div>' +
    '<div class="key key-ctrlalt">' +
    'Alt' +
    '</div>' +
    ' + ' +
    '<div class="key">' +
    'Arrows' +
    '</div>' +
    '</div>' +
    '<div class="desc">' +
    'Viewport Origin' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>' +
    '</div>'
;

Settings.css =
    '.cover {' +
    '    position: fixed;' +
    '    top: 0;' +
    '    right: 0;' +
    '    bottom: 0;' +
    '    left: 0;' +
    '    background-color: rgba(0, 0, 0, 0.5);' +
    '}' +
    '' +
    '.modal {' +
    '    position: relative;' +
    '    overflow: hidden;' +
    '    width: 560px;' +
    '    top: 60px;' +
    '    margin: 0 auto;' +
    '    color: rgba(0, 0, 0, 0.92);' +
    '    font-family: arial, sans-serif;' +
    '    box-shadow: 3px 3px 15px 2px rgba(0, 0, 0, .4);' +
    '}' +
    '' +
    '.menu {' +
    '    position: relative;' +
    '    border-bottom: 1px solid rgb(200, 200, 200);' +
    '    background: white;' +
    '}' +
    '' +
    '.menu .caption {' +
    '    height: 38px;' +
    '    margin: 0 -1px;' +
    '    padding: 9px 0 0 23px;' +
    '    color: white;' +
    '    background-color: rgb(244, 67, 54);' +
    '    font-size: 19px;' +
    '    box-sizing: border-box;' +
    '    box-shadow: 0 1px 3px rgba(0, 0, 0, .75);' +
    '}' +
    '' +
    '.menu .items {' +
    '    position: relative;' +
    '    overflow: hidden;' +
    '    width: 70%;' +
    '    font-weight: 600;' +
    '    margin: 0 auto;' +
    '}' +
    '' +
    '.menu .item {' +
    '    float: left;' +
    '    height: 39px;' +
    '    width: 33%;' +
    '    padding-top: 13px;' +
    '    font-size: 14px;' +
    '    opacity: .48;' +
    '    box-sizing: border-box;' +
    '    text-align: center;' +
    '}' +
    '' +
    '.menu .selected {' +
    '    opacity: 1;' +
    '    color: rgb(238, 63, 50);' +
    '}' +
    '' +
    '.menu .selection-bar {' +
    '    position: absolute;' +
    '    left: 0;' +
    '    bottom: 0;' +
    '    width: 33%;' +
    '    height: 3px;' +
    '    background-color: rgb(244, 67, 54);' +
    '}' +
    '' +
    '.content {' +
    '    position: relative;' +
    '    height: 370px;' +
    '    background-color: rgb(230, 230, 230);' +
    '}' +
    '' +
    '.help {' +
    '    position: absolute;' +
    '    left: 0;' +
    '    width: 560px;' +
    '    padding: 18px 0 0 30px;' +
    '}' +
    '' +
    '.help .left {' +
    '    float: left;' +
    '}' +
    '' +
    '.help .right {' +
    '    float: left;' +
    '    padding-left: 50px;' +
    '}' +
    '' +
    '.help .item {' +
    '    height: 23px;' +
    '    padding-top: 3px;' +
    '    font-size: 13px;' +
    '}' +
    '' +
    '.help .command {' +
    '    position: relative;' +
    '    top: -2px;' +
    '    float: left;' +
    '    font-weight: 600;' +
    '    color: rgba(0, 0, 0, .40);' +
    '}' +
    '' +
    '.help .desc {' +
    '    float: left;' +
    '}' +
    '' +
    '.help .left .command {' +
    '    width: 107px;' +
    '}' +
    '' +
    '.help .right .command-top {' +
    '    width: 107px;' +
    '}' +
    '' +
    '.help .right .command-bottom {' +
    '    width: 162px;' +
    '}' +
    '' +
    '' +
    '' +
    '.key {' +
    '    position: relative;' +
    '    height: 22px;' +
    '    min-width: 25px;' +
    '    box-sizing: border-box;' +
    '    top: -1px;' +
    '    display: inline-block;' +
    '    font-weight: 600;' +
    '    font-size: 12px;' +
    '    line-height: 12px;' +
    '    color: rgba(0, 0, 0, .67);' +
    '    background-color: white;' +
    '    padding: 4px 6px 3px;' +
    '    border-radius: 4px;' +
    '    border: 1px solid;' +
    '    border-bottom-width: 2px;' +
    '    border-color: rgb(230, 230, 230) rgb(200, 200, 200) rgb(170, 170, 170) rgb(220, 220, 220);' +
    '    text-align: center;' +
    '}' +
    '' +
    '.key-ctrlalt {' +
    '    width: 31px;' +
    '    padding-left: 0;' +
    '    padding-right: 2px;' +
    '}'
;




