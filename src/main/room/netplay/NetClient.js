// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetClient = function(room) {
    "use strict";

    var self = this;

    this.joinSession = function(sessionID) {
        sessionIDToJoin = sessionID;
        ws = new WebSocket("ws://webmsx.herokuapp.com");
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

    this.netVideoClockPulse = function() {
        // Client get clocks from Server
    };

    this.processLocalControl = function (control, press) {
        // Reject controls not available to NetPlay Clients
        if (disabledControls.has(control))
            return room.showOSD("Function not available in NetPlay Client mode", true, true);

        // Send only to server, do not process locally
        controlsToSend.push({ c: control, p: press});
    };

    this.processCartridgeInserted = function() {
        throw new Error("Should never get here!");
    };

    this.processSaveStateLoaded = function() {
        throw new Error("Should never get here!");
    };

    function onSessionServerConnected() {
        // Join a Session
        ws.send(JSON.stringify({ sessionControl: "joinSession", sessionID: sessionIDToJoin }));
        // Setup keep-alive
        keepAliveTimer = setInterval(keepAlive, 30000);
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
        var netUpdate = JSON.parse(event.data);

        // window.console.log(netUpdate);

        if (netUpdate.u !== nextUpdate && nextUpdate >= 0) {
            jt.Util.error("NetPlay Client expected update: " + nextUpdate + ", but got: " + netUpdate.u);
            self.leaveSession(true);
        }
        nextUpdate = netUpdate.u + 1;

        if (netUpdate.p !== undefined)
            netUpdate.p ? console.powerOn() : console.powerOff();

        if (netUpdate.s)
            console.loadState(netUpdate.s);

        if (netUpdate.c) {
            var controls = netUpdate.c;
            for (var i = 0, len = controls.length; i < len; ++i)
                consoleControlsSocket.controlStateChanged(controls[i].c, controls[i].p);
        }

        console.videoClockPulse(true);

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

    function keepAlive() {
        try {
            ws.send('{ "sessionControl": "keep-alive" }');
        } catch (e) {
            jt.Util.error("NetPlay Session error sending keep-alive");
            self.stopSession(true);
        }
    }


    var console = room.console;
    var consoleControlsSocket = console.getConsoleControlsSocket();

    var controlsToSend = new Array(100);

    var ws;
    var sessionID;
    var sessionIDToJoin;
    var keepAliveTimer;

    var rtcConnection;
    var dataChannel;

    var nextUpdate = -1;

    var ct = jt.ConsoleControls;
    var disabledControls = new Set([
        ct.SAVE_STATE_0, ct.SAVE_STATE_1, ct.SAVE_STATE_2, ct.SAVE_STATE_3, ct.SAVE_STATE_4, ct.SAVE_STATE_5, ct.SAVE_STATE_6,
        ct.SAVE_STATE_7, ct.SAVE_STATE_8, ct.SAVE_STATE_9, ct.SAVE_STATE_10, ct.SAVE_STATE_11, ct.SAVE_STATE_12, ct.SAVE_STATE_FILE,
        ct.LOAD_STATE_0, ct.LOAD_STATE_1, ct.LOAD_STATE_2, ct.LOAD_STATE_3, ct.LOAD_STATE_4, ct.LOAD_STATE_5, ct.LOAD_STATE_6,
        ct.LOAD_STATE_7, ct.LOAD_STATE_8, ct.LOAD_STATE_9, ct.LOAD_STATE_10, ct.LOAD_STATE_11, ct.LOAD_STATE_12,
        ct.POWER_FRY, ct.VIDEO_STANDARD, ct.VSYNCH, ct.TRACE, ct.NO_COLLISIONS, ct.CARTRIDGE_FORMAT
    ]);

};
