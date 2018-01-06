// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetServer = function(room) {
    "use strict";

    var self = this;

    this.startSession = function(pSessionID) {
        sessionIDToCreate = pSessionID ? ("" + pSessionID).trim() : undefined;

        if (sessionIDToCreate && (sessionID === sessionIDToCreate)) return;
        if (sessionID) this.stopSession(true);

        room.enterNetPendingMode(this);

        if (!ws) {
            // ws = new WebSocket("ws://10.42.10.141:8081");
            ws = new WebSocket("ws://webmsx.herokuapp.com");
            ws.onmessage = onSessionMessage;
            ws.onopen = onSessionServerConnected;
            ws.onclose = onSessionServerDisconnected;
        } else
            onSessionServerConnected();
    };

    this.stopSession = function(wasError, userMessage) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = undefined;

        if (ws) {
            ws.onmessage = ws.onopen = ws.onclose = undefined;
            ws.close();
            ws = undefined;
        }

        if (wasError) dropAllClients();
        else setTimeout(dropAllClients, 300);      // Give some time before ending RTC so Session ending can be detected first by Clients

        room.showOSD(userMessage || 'NetPlay Session "' + sessionID + '" stopped', true, wasError);
        (wasError ? jt.Util.error : jt.Util.log) (userMessage || 'NetPlay Session "' + sessionID + '" stopped');

        sessionID = undefined;
        room.enterStandaloneMode();
    };

    this.getSessionID = function() {
        return sessionID;
    };

    this.netVideoClockPulse = function() {
        ++updates;

        var data, dataFull, dataNormal;
        for (var cNick in clients) {
            var client = clients[cNick];
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
                dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P error sending data');
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

        console.videoClockPulse(true);
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
        // Setup keep-alive
        if (keepAliveTimer === undefined) keepAliveTimer = setInterval(keepAlive, 30000);
        // Start a new Session
        var command = { sessionControl: "createSession", queryVariables: [ "RTC_CONFIG", "RTC_DATA_CHANNEL_CONFIG" ] };
        if (sessionIDToCreate) command.sessionID = sessionIDToCreate;
        ws.send(JSON.stringify(command));
    }

    function onSessionServerDisconnected() {
        self.stopSession(true, keepAliveTimer ? "NetPlay Session stopped: Connection lost" : "NetPlay: Connection error");
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
                case "createError":
                    self.stopSession(true, "NetPlay: " + message.errorMessage);
                    return;
            }
        } else {
            if(message.clientSDP)
                onClientSDP(message);
        }
    }

    function onSessionCreated(message) {
        try {
            rtcConnectionConfig = JSON.parse(message.queriedVariables.RTC_CONFIG || "{}");
        } catch (e) {}
        try {
            dataChannelConfig = JSON.parse(message.queriedVariables.RTC_DATA_CHANNEL_CONFIG || "{}");
        } catch (e) {}

        sessionID = message.sessionID;
        updates = 0;
        controlsToProcess.length = 0;
        room.enterNetServerMode(self);

        room.showOSD('NetPlay session "' + message.sessionID + '" started', true);
        jt.Util.log('NetPlay session "' + message.sessionID + '" started');
    }

    function onClientJoined(message) {
        var client = { nick: message.clientNick };
        clients[client.nick] = client;
        room.showOSD('NetPlay client "' + client.nick + '" joined', true);
        jt.Util.log('NetPlay client "' + client.nick + '" joined');

        // Start RTC
        var rtcConnection = new RTCPeerConnection(rtcConnectionConfig);
        client.rtcConnection = rtcConnection;

        // Set up the ICE candidates
        rtcConnection.onicecandidate = function(e) {
            if (!e.candidate) {
                jt.Util.log("Server SDP:", rtcConnection.localDescription);

                ws.send(JSON.stringify({toClientNick: client.nick, serverSDP: rtcConnection.localDescription}));
            }
        };

        // Create the data channel and establish its event listeners
        var dataChannel = rtcConnection.createDataChannel("dataChannel", dataChannelConfig );
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
        var client = clients[message.clientNick];
        if (!client) return;

        dropClient(client, true, false, 'NetPlay client "' + client.nick + '" left');
    }

    function onClientSDP(message) {
        var client = clients[message.fromClientNick];
        if (!client) return;

        jt.Util.log("Client " + client.nick + " SDP:", message.clientSDP);

        client.rtcConnection.setRemoteDescription(new RTCSessionDescription(message.clientSDP))
            .catch(onRTCError);
    }

    function onDataChannelOpen(client, event) {
        jt.Util.log("Client " + client.nick + " dataChannel open");

        client.dataChannelActive = true;
        client.justJoined = true;
    }

    function onDataChannelClose(client, event) {
        jt.Util.error("NetPlay Client " + client.nick + " dataChannel closed");
        dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P connection lost');
    }

    function onDataChannelMessage(client, event) {
        var update = JSON.parse(event.data);
        // Store remote controls to process on netVideoClockPulse
        if (update.controls) controlsToProcess.push.apply(controlsToProcess, update.controls);
    }

    function onRTCError(client, error) {
        jt.Util.error("NetPlay Client " + client.nick + " RTC error:", error);
        dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P connection error');
    }

    function dropAllClients() {
        for (var cID in clients)
            dropClient(clients[cID], false);
    }

    function dropClient(client, showMessage, wasError, userMessage) {
        if (showMessage) {
            room.showOSD(userMessage || 'NetPlay client "' + client.nick + '" left', true, wasError);
            (wasError ? jt.Util.error : jt.Util.log) (userMessage || 'NetPlay client "' + client.nick + '" left');
        }

        if (client.dataChannel) {
            client.dataChannel.onopen = client.dataChannel.onclose = client.dataChannel.onmessage = undefined;
            client.dataChannel.close();
        }
        if (client.rtcConnection) {
            client.rtcConnection.onicecandidate = undefined;
            client.rtcConnection.close();
        }
        delete clients[client.nick];
    }

    function keepAlive() {
        try {
            ws.send('{ "sessionControl": "keep-alive" }');
        } catch (e) {
            jt.Util.error("NetPlay error sending keep-alive");
            self.stopSession(true, "NetPlay Session stopped: connection error");
        }
    }


    var console = room.console;
    var consoleControlsSocket = console.getConsoleControlsSocket();

    var controlsToProcess = new Array(100);
    var netUpdate = { u: 0 };
    var netUpdateFull = { u: 0, p: false, s: {} };
    var nextUpdateFull = false;

    var ws;
    var sessionID;
    var sessionIDToCreate;
    var keepAliveTimer;
    var clients = {};
    var updates = 0;

    var rtcConnectionConfig;
    var dataChannelConfig;

};
