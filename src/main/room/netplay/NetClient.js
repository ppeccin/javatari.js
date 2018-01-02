// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetClient = function(room) {
    "use strict";

    var self = this;

    this.joinSession = function(sessionID) {
        sessionIDToJoin = sessionID;
        ws = new WebSocket("ws://localhost");
        ws.onopen = onSessionServerConnected;
        ws.onclose = onSessionServerDisconnected;
        ws.onmessage = onSessionMessage;
    };

    this.leaveSession = function(wasError) {
        sessionID = sessionIDToJoin = undefined;
        if (ws) {
            ws.onpen = ws.onclose = ws.onmessage = undefined;
            ws.close();
            ws = undefined;
        }
        if (dataChannel) {
            dataChannel.onpen = dataChannel.onclose = dataChannel.onmessage = undefined;
            dataChannel.close();
            dataChannel = undefined;
        }
        if (rtcConnection) {
            rtcConnection.onicecandidate = rtcConnection.ondatachannel = undefined;
            rtcConnection.close();
            rtcConnection = undefined;
        }

        room.showOSD("NetPlay Session left", true, wasError);
        (wasError ? jt.Util.error : jt.Util.log) ("NetPlay Session left");

        room.enterStandaloneMode();
    };

    this.processLocalControl = function (control, press) {
        // Send only to server, do not process locally
        controlsToSend.push({ c: control, p: press});
    };

    this.netVideoClockPulse = function() {
        // Client get clocks from Server
    };

    function onSessionServerConnected() {
        // Join a Session
        ws.send(JSON.stringify({ sessionControl: "joinSession", sessionID: sessionIDToJoin }));
    }

    function onSessionServerDisconnected() {
        jt.Util.error("NetPlay Session disconnected");
        self.leaveSession(true);
    }

    function onSessionMessage(event) {
        const message = JSON.parse(event.data);
        if (message.sessionControl) {
            switch (message.sessionControl) {
                case "sessionJoined":
                    onSessionJoined(message);
                    return;
            }
        } else {
            if(message.serverSDP)
                onServerSDP(message);
        }
    }

    function onSessionJoined(netClock) {
        room.enterNetClientMode(self);
        controlsToSend.length = 0;

        sessionID = netClock.sessionID;
        room.showOSD("NetPlay Session joined: " + sessionID, true);
        jt.Util.log("NetPlay Session joined: " + sessionID);

        // Start RTC
        rtcConnection = new RTCPeerConnection({});

        // Set up the ICE candidates
        rtcConnection.onicecandidate = function(e) {
            if (!e.candidate)
                ws.send(JSON.stringify({ clientSDP: rtcConnection.localDescription }));
        };

        // Wait for data channel
        rtcConnection.ondatachannel = function(event) {
            dataChannel = event.channel;
            dataChannel.onopen = onDataChannelOpen;
            dataChannel.onclose = onDataChannelClose;
            dataChannel.onmessage = onDataChannelMessage;
        };
    }

    function onServerSDP(message) {
        rtcConnection.setRemoteDescription(new RTCSessionDescription(message.serverSDP))
            .then(function() { return rtcConnection.createAnswer(); })
            .then(function(desc) { return rtcConnection.setLocalDescription(desc); })
            .catch(onRTCError);
    }

    function onDataChannelOpen(event) {
    }

    function onDataChannelClose(event) {
        jt.Util.error("NetPlay dataChannel closed");
        self.leaveSession(true);
    }

    function onDataChannelMessage(event) {
        var update = JSON.parse(event.data);

        // window.console.log(update);

        ++updates;
        if (update.update !== updates) {
            jt.Util.error("NetPlay Client expected update: " + updates + ", but got: " + update.update);
            self.leaveSession(true);
        }

        if (update.power !== undefined)
            update.power ? console.powerOn() : console.powerOff();

        if (update.state)
            console.loadState(update.state);

        if (update.controls) {
            var controls = update.controls;
            for (var i = 0, len = controls.length; i < len; ++i)
                consoleControlsSocket.controlStateChanged(controls[i].c, controls[i].p);
        }

        console.videoClockPulse();

        // Send local controls to Server
        if (controlsToSend.length) {
            dataChannel.send(JSON.stringify({ controls: controlsToSend }));
            controlsToSend.length = 0;
        }
    }

    function onRTCError(error) {
        jt.Util.error("NetPlay RTC error:", error);
        self.leaveSession(true);
    }


    var console = room.console;
    var consoleControlsSocket = console.getConsoleControlsSocket();

    var controlsToSend = new Array(100);

    var ws;
    var sessionID;
    var sessionIDToJoin;

    var rtcConnection;
    var dataChannel;

    var updates = 0;

};
