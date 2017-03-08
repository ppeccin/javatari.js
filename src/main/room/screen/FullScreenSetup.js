// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

JavatariFullScreenSetup = {
    apply: function fullScreenSetup() {
        // Setup Basic full-screen CSS
        if (!this.cssApplied) {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = this.css;
            document.head.appendChild(style);
            this.cssApplied = true;
        }
        // Apply Standalone mode full-screen basic styles to html and body immediately if needed
        document.documentElement.classList.toggle("jt-full-screen", this.shouldStartInFullScreen());
    },
    shouldStartInFullScreen: function () {
        return window.Javatari
            ? Javatari.SCREEN_FULLSCREEN_MODE === 1 || (Javatari.SCREEN_FULLSCREEN_MODE === -1 && this.isBrowserStandaloneMode())
            : this.isBrowserStandaloneMode();
    },
    isBrowserStandaloneMode: function () {
        return navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
    },
    css: '' +
        'html.jt-full-screen, html.jt-full-screen body {' +
        '   background: black;' +
        '}' +
        'html.jt-full-screen .jt-full-screen-hidden {' +
        '   display: none;' +
        '}' +
        'html:not(.jt-full-screen) .jt-full-screen-only {' +
        '   display: none;' +
        '}'
};
JavatariFullScreenSetup.apply();
