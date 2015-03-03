/**
 * Created by ppeccin on 16/02/2015.
 */

// TODO Fix all Array initializations

JavatariLauncher = {

    launch: function () {
        // Get container elements if not already defined
        if (!window.JavatariScreenElement)
            JavatariScreenElement = document.getElementById(JavatariParameters.SCREEN_ELEMENT_ID);
        if (!window.JavatariConsolePanelElement)
            JavatariConsolePanelElement = document.getElementById(JavatariParameters.CONSOLE_PANEL_ELEMENT_ID);

        // Build and start emulator
        JavatariRoom = new Room(JavatariScreenElement, JavatariConsolePanelElement);
        JavatariRoom.powerOn();

        // Auto-load ROM if specified
        if (JavatariParameters.ROM_AUTO_LOAD_URL)
            JavatariRoom.romLoader.loadFromURL(JavatariParameters.ROM_AUTO_LOAD_URL);
    }

};

// Schedule automatic launch
window.addEventListener("load", function () {
    if (!JavatariParameters.AUTO_START_DISABLED)
       JavatariLauncher.launch();
});

