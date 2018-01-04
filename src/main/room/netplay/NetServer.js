// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetServer = function(room) {
    "use strict";

    var self = this;

    this.startSession = function(id) {
        sessionIDToCreate = id ? ("" + id).trim() : undefined;
        ws = new WebSocket("ws://10.42.10.141:8081");
        // ws = new WebSocket("ws://webmsx.herokuapp.com");
        ws.onmessage = onSessionMessage;
        ws.onopen = onSessionServerConnected;
        ws.onclose = onSessionServerDisconnected;
    };

    this.stopSession = function(wasError) {
        clearInterval(keepAliveTimer);
        sessionID = undefined;
        if (ws) {
            ws.onmessage = ws.onopen = ws.onclose = undefined;
            ws.close();
            ws = undefined;
        }
        for (var cID in clients)
            dropClient(clients[cID], false);

        room.showOSD("NetPlay Session stopped", true, wasError);
        room.enterStandaloneMode();
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
                jt.Util.error("NetPlay Client " + client.nick + " error sending data:", e.toString());
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
        // Start a new Session
        var command = { sessionControl: "createSession" };
        if (sessionIDToCreate) command.sessionID = sessionIDToCreate;
        ws.send(JSON.stringify(command));
        // Setup keep-alive
        keepAliveTimer = setInterval(keepAlive, 30000);
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
        room.showOSD('NetPlay Session "' + message.sessionID + '" started', true);
        jt.Util.log('NetPlay Session "' + message.sessionID + '" started');

        sessionID = message.sessionID;
        room.enterNetServerMode(self);
        controlsToProcess.length = 0;
    }

    function onClientJoined(message) {
        var client = { nick: message.clientNick };
        clients[client.nick] = client;
        room.showOSD('NetPlay client "' + client.nick + '" joined', true);
        jt.Util.log('NetPlay client "' + client.nick + '" joined');

        // Start RTC
        var rtcConnection = new RTCPeerConnection({});
        client.rtcConnection = rtcConnection;

        // Set up the ICE candidates
        rtcConnection.onicecandidate = function(e) {
            if (!e.candidate)
                ws.send(JSON.stringify({ toClientNick: client.nick, serverSDP: rtcConnection.localDescription }));
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
        var client = clients[message.clientNick];
        if (!client) return;

        dropClient(client, true, false, 'NetPlay client "' + client.nick + '" left');
    }

    function onClientSDP(message) {
        var client = clients[message.fromClientNick];
        if (!client) return;

        client.rtcConnection.setRemoteDescription(new RTCSessionDescription(message.clientSDP))
            .catch(onRTCError);
    }

    function onDataChannelOpen(client, event) {
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
            jt.Util.error("NetPlay Session error sending keep-alive");
            self.stopSession(true);
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

};
