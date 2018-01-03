// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetServer = function(room) {
    "use strict";

    var self = this;

    this.startSession = function() {
        ws = new WebSocket("ws://localhost");
        ws.onmessage = onSessionMessage;
        ws.onopen = onSessionServerConnected;
        ws.onclose = onSessionServerDisconnected;
    };

    this.stopSession = function(wasError) {
        sessionID = undefined;
        if (ws) {
            ws.onmessage = ws.onopen = ws.onclose = undefined;
            ws.close();
        }
        for (var cID in clients)
            dropClient(clients[cID], false);

        room.showOSD("NetPlay Session stopped", true, wasError);
        room.enterStandaloneMode();
    };

    this.netVideoClockPulse = function() {
        ++updates;

        var data, dataFull, dataNormal;
        for (var cID in clients) {
            var client = clients[cID];
            if (!client.dataChannelActive) continue;

            if (client.justJoined || nextUpdateFull) {
                client.justJoined = false;
                if (!dataFull) {

                    window.console.log("Full Update");

                    netUpdateFull.u = updates;
                    netUpdateFull.p = console.powerIsOn;
                    netUpdateFull.s = console.saveState();
                    if (controlsToProcess.length) netUpdateFull.c = controlsToProcess;
                    else if (netUpdateFull.c) delete netUpdateFull.c;
                    dataFull = JSON.stringify(netUpdateFull);
                }
                data = dataFull;
            } else {
                if (!dataNormal) {
                    netUpdate.u = updates;
                    if (controlsToProcess.length) netUpdate.c = controlsToProcess;
                    else if (netUpdate.c) delete netUpdate.c;
                    dataNormal = JSON.stringify(netUpdate);
                }
                data = dataNormal;
            }

            // window.console.log(data.length);
            // window.console.log("Controls sent:", controlsToSend.length);

            try {
                client.dataChannel.send(data);
            } catch (e) {
                jt.Util.error("NetPlay Client " + client.id + " error sending data:", e.toString());
                dropClient(client, true);
            }
        }

        if (nextUpdateFull) nextUpdateFull = false;

        if (controlsToProcess.length) {
            for (var i = 0, len = controlsToProcess.length; i < len; ++i) {

                // window.console.log("Accepting control:", controlsToProcess);

                consoleControlsSocket.controlStateChanged(controlsToProcess[i].c, controlsToProcess[i].p);
            }
            controlsToProcess.length = 0;
        }

        console.videoClockPulse();
    };

    this.processLocalControl = function (control, press) {
        // Just store changes, to be processed on netVideoClockPulse
        controlsToProcess.push({ c: control, p: press});
    };

    this.processCartridgeInserted = function() {
        nextUpdateFull = true;
    };

    this.processSaveStateLoaded = function() {
        nextUpdateFull = true;
    };

    function onSessionServerConnected() {
        // Start a new Session
        ws.send(JSON.stringify({ sessionControl: "createSession" }));
    }

    function onSessionServerDisconnected() {
        jt.Util.error("NetPlay Session disconnected");
        self.stopSession(true);
    }

    function onSessionMessage(event) {
        const message = JSON.parse(event.data);
        if (message.sessionControl) {
            switch (message.sessionControl) {
                case "sessionCreated":
                    onSessionCreated(message);
                    return;
                case "clientJoined":
                    onClientJoined(message);
                    return;
                case "clientLeft":
                    onClientLeft(message);
                    return;
            }
        } else {
            if(message.clientSDP)
                onClientSDP(message);
        }
    }

    function onSessionCreated(message) {
        room.showOSD("NetPlay Session started: " + message.sessionID, true);
        jt.Util.log("NetPlay Session started: " + message.sessionID);

        sessionID = message.sessionID;
        room.enterNetServerMode(self);
        controlsToProcess.length = 0;
    }

    function onClientJoined(message) {
        var client = { id: message.clientID };
        clients[client.id] = client;
        room.showOSD("NetPlay Client " + client.id + " joined", true);
        jt.Util.log("NetPlay Client " + client.id + " joined");

        // Start RTC
        var rtcConnection = new RTCPeerConnection({});
        client.rtcConnection = rtcConnection;

        // Set up the ICE candidates
        rtcConnection.onicecandidate = function(e) {
            if (!e.candidate)
                ws.send(JSON.stringify({ toClientID: client.id, serverSDP: rtcConnection.localDescription }));
        };

        // Create the data channel and establish its event listeners
        var dataChannel = rtcConnection.createDataChannel("dataChannel", { _protocol: "tcp", _id: 1 } );
        client.dataChannel = dataChannel;
        dataChannel.onopen = function(event) { onDataChannelOpen(client, event) };
        dataChannel.onclose = function(event) { onDataChannelClose(client, event) };
        dataChannel.onmessage = function(event) { onDataChannelMessage(client, event) };

        // Create an offer to connect; this starts the process
        rtcConnection.createOffer()
            .then(function(desc) { return rtcConnection.setLocalDescription(desc); })
            .catch( function(error) { onRTCError(client, error); });
    }

    function onClientLeft(message) {
        var client = clients[message.clientID];
        if (!client) return;

        dropClient(client, true, false);
    }

    function onClientSDP(message) {
        var client = clients[message.fromClientID];
        if (!client) return;

        client.rtcConnection.setRemoteDescription(new RTCSessionDescription(message.clientSDP))
            .catch(onRTCError);
    }

    function onDataChannelOpen(client, event) {
        client.dataChannelActive = true;
        client.justJoined = true;
    }

    function onDataChannelClose(client, event) {
        jt.Util.error("NetPlay Client " + client.id + " dataChannel closed");
        dropClient(client, true, true);
    }

    function onDataChannelMessage(client, event) {
        var update = JSON.parse(event.data);
        // Store remote controls to process on netVideoClockPulse
        if (update.controls) controlsToProcess.push.apply(controlsToProcess, update.controls);
    }

    function onRTCError(client, error) {
        jt.Util.error("NetPlay Client " + client.id + " RTC error:", error);
        dropClient(client, true, true);
    }

    function dropClient(client, showMessage, wasError) {
        if (showMessage) {
            room.showOSD("NetPlay Client " + client.id + " left", true, wasError);
            (wasError ? jt.Util.error : jt.Util.log) ("NetPlay Client " + client.id + " left");
        }

        if (client.dataChannel) {
            client.dataChannel.onopen = client.dataChannel.onclose = client.dataChannel.onmessage = undefined;
            client.dataChannel.close();
        }
        if (client.rtcConnection) {
            client.rtcConnection.onicecandidate = undefined;
            client.rtcConnection.close();
        }
        delete clients[client.id];
    }


    var console = room.console;
    var consoleControlsSocket = console.getConsoleControlsSocket();

    var controlsToProcess = new Array(100);
    var netUpdate = { u: 0 };
    var netUpdateFull = { u: 0, p: false, s: {} };
    var nextUpdateFull = false;

    var ws;
    var sessionID;
    var clients = {};
    var updates = 0;

};
