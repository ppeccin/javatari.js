// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

Settings = {};

Settings.create = function() {

    var cover = document.createElement("div");
    var s = cover.style;
    s.display = "none";
    s.position = "fixed";
    s.width = "100%";
    s.height = "100%";
    s.left = 0;
    s.top = 0;
    s.right = 0;
    s.botom = 0;
    s.background = "rgba(0, 0, 0, 0.7)";
    s.zIndex = 99999;

    var dialog = document.createElement("div");
    s = dialog.style;
    s.position = "absolute";
    s.width = "500px";
    s.height = "400px";
    s.left = "0";
    s.right = "0";
    s.top = "0";
    s.bottom = "0";
    s.margin = "80px auto";
    s.background = "white";
    cover.appendChild(dialog);

    cover.addEventListener("click", function (e) {
        e.preventDefault();
        Settings.hide();
    });

    document.body.appendChild(cover);

    Settings.cover = cover;
};

Settings.show = function() {
    Settings.cover.style.display = "block";

    console.log("show");

};

Settings.hide = function() {
    Settings.cover.style.display = "none";
};

