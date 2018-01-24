// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetServer = function(room) {
    "use strict";

    var self = this;

    this.startSession = function(pSessionID) {
        sessionIDToCreate = pSessionID ? ("" + pSessionID).trim() : undefined;

        // Check for wsOnly indicator
        var wsOnlyAsked;
        if (sessionIDToCreate && sessionIDToCreate[sessionIDToCreate.length - 1] === "@") {
            sessionIDToCreate  = sessionIDToCreate.substr(0, sessionIDToCreate.length -1);
            wsOnlyAsked = true;
        } else
            wsOnlyAsked = false;

        if (sessionIDToCreate && (sessionID === sessionIDToCreate) && (wsOnly === wsOnlyAsked)) return;
        if (sessionID) this.stopSession(true);

        room.enterNetPendingMode(this);

        wsOnly = wsOnlyAsked;

        if (!ws) {
            ws = new WebSocket("ws://" + Javatari.WEB_EXTENSIONS_SERVER);
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
        var videoPulls = atariConsole.videoClockPulseGetNextPulldowns();
        atariConsole.videoClockPulseApplyPulldowns(videoPulls);

        var data, dataFull, dataNormal;
        for (var cNick in clients) {
            var client = clients[cNick];
            if (!client.wsOnly && !client.dataChannelActive) continue;

            if (client.justJoined || nextUpdateFull) {
                client.justJoined = false;
                if (!dataFull) {
                    netUpdateFull.s = atariConsole.saveStateExtended();
                    netUpdateFull.cm = { p1: room.consoleControls.isP1ControlsMode(), pd: room.consoleControls.isPaddleMode() };
                    dataFull = JSON.stringify(netUpdateFull);
                }
                data = dataFull;
            } else {
                if (!dataNormal) {
                    netUpdate.c = controlsToSend.length ? controlsToSend : undefined;
                    netUpdate.v = videoPulls;
                    dataNormal = JSON.stringify(netUpdate);
                }
                data = dataNormal;
            }

            try {
                if (client.dataChannelActive)
                    // Use DataChannel if available
                    sendToDataChannel(client.dataChannel, data);
                else
                    // Or fallback to WebSocket relayed through the Session Server (BAD!)
                    ws.send(JSON.stringify({ toClientNick: client.nick, javatariUpdate: data }));
            } catch (e) {
                dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P error sending data');
            }
        }

        nextUpdateFull = false;
        controlsToSend.length = 0;
    };

    this.processControlState = function (control, press) {
        consoleControlsSocket.controlStateChanged(control, press);

        // Store changes to be sent to Clients
        if (!localOnlyControls.has(control))
            controlsToSend.push((control << 4) | press );        // binary encoded, always < 16000
    };

    this.processControlValue = function (control, value) {
        consoleControlsSocket.controlValueChanged(control, value);

        // Store changes to be sent to Clients
        controlsToSend.push(control + (value + 10));             // always > 16000
    };

    this.processCheckPeripheralControl = function (control) {
        // All controls allowed
        return true;
    };

    this.processExternalStateChange = function() {
        nextUpdateFull = true;
    };

    function onSessionServerConnected() {
        // Setup keep-alive
        if (keepAliveTimer === undefined) keepAliveTimer = setInterval(keepAlive, 30000);
        // Start a new Session
        var command = { sessionControl: "createSession", sessionType: "javatari", wsOnly: wsOnly, queryVariables: [ "RTC_CONFIG", "RTC_DATA_CHANNEL_CONFIG" ] };
        if (sessionIDToCreate) command.sessionID = sessionIDToCreate;
        ws.send(JSON.stringify(command));
    }

    function onSessionServerDisconnected() {
        self.stopSession(true, keepAliveTimer ? "NetPlay Session stopped: Connection lost" : "NetPlay: Connection error");
    }

    function onSessionMessage(event) {
        const message = JSON.parse(event.data);

        if (message.javatariUpdate)
            return onClientNetUpdate(message.javatariUpdate);

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
            return;
        }

        if(message.clientSDP)
            onClientSDP(message);
    }

    function onSessionCreated(message) {
        try {
            rtcConnectionConfig = JSON.parse(message.queriedVariables.RTC_CONFIG || "{}");
        } catch (e) {}
        try {
            dataChannelConfig = JSON.parse(message.queriedVariables.RTC_DATA_CHANNEL_CONFIG || "{}");
        } catch (e) {}

        sessionID = message.sessionID;
        controlsToSend.length = 0;
        room.enterNetServerMode(self);

        room.showOSD('NetPlay session "' + message.sessionID + '" started', true);
        jt.Util.log('NetPlay session "' + message.sessionID + '" started');
    }

    function onClientJoined(message) {
        var client = { nick: message.clientNick, justJoined: true, wsOnly: wsOnly || !!message.wsOnly };
        clients[client.nick] = client;

        room.showOSD('NetPlay client "' + client.nick + '" joined', true);
        jt.Util.log('NetPlay client "' + client.nick + '" joined');

        // Use RTC?
        if (client.wsOnly) return;

        // Start RTC
        var rtcConnection = new RTCPeerConnection(rtcConnectionConfig);
        client.rtcConnection = rtcConnection;

        rtcConnection.onicecandidate = function(e) {
            if (!e.candidate) {
                jt.Util.log("Server SDP for client " + client.nick + ":", rtcConnection.localDescription);

                ws.send(JSON.stringify({toClientNick: client.nick, serverSDP: rtcConnection.localDescription}));
            }
        };

        var dataChannel = rtcConnection.createDataChannel("dataChannel", dataChannelConfig );
        client.dataChannel = dataChannel;
        dataChannel.onopen = function(event) { onDataChannelOpen(client, event) };
        dataChannel.onclose = function(event) { onDataChannelClose(client, event) };
        dataChannel.onmessage = function(event) { onDataChannelMessage(client, event) };

        // Create an offer to connect
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

        jt.Util.log("Client SDP from client " + client.nick + ":", message.clientSDP);

        client.rtcConnection.setRemoteDescription(new RTCSessionDescription(message.clientSDP))
            .catch(onRTCError);
    }

    function onDataChannelOpen(client, event) {
        jt.Util.log("Client " + client.nick + " dataChannel open");

        client.dataChannelActive = true;
    }

    function onDataChannelClose(client, event) {
        jt.Util.error("NetPlay Client " + client.nick + " dataChannel closed");
        dropClient(client, true, true, 'NetPlay client "' + client.nick + '" dropped: P2P connection lost');
    }

    function onDataChannelMessage(client, event) {
        onClientNetUpdate(JSON.parse(event.data));
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

    function onClientNetUpdate(netUpdate) {
        if (!netUpdate.c) return;

        // Process changes as if they were local controls
        for (var i = 0, changes = netUpdate.c, len = changes.length; i < len; ++i) {
            var change = changes[i];
            if (change < 16000)
                self.processControlState(change >> 4, change & 0x01);            // binary encoded
            else
                self.processControlValue(change & ~0x3fff, (change & 0x3fff) - 10);
        }
    }

    function keepAlive() {
        try {
            ws.send('{ "sessionControl": "keep-alive" }');
        } catch (e) {
            jt.Util.error("NetPlay error sending keep-alive");
            self.stopSession(true, "NetPlay Session stopped: connection error");
        }
    }

    // Automatically fragments message if needed. Data must be a String
    function sendToDataChannel(dataChannel, data) {
        var len = data.length;

        if (len < MAX_DATA_CHANNEL_SIZE)
            return dataChannel.send(data);

        var c = 0;
        var p = 0;
        while (true) {
            var frag = data.substr(p, DATA_CHANNEL_FRAG_SIZE);
            p += DATA_CHANNEL_FRAG_SIZE;
            c++;
            if (p < len)
                dataChannel.send(DATA_CHANNEL_FRAG_PART + frag);
            else {
                dataChannel.send(DATA_CHANNEL_FRAG_END + frag);

                // console.log("Fragmented message sent: " + data.length, + ", fragments: " + c);

                return;
            }
        }
    }


    var atariConsole = room.console;
    var consoleControlsSocket = atariConsole.getConsoleControlsSocket();

    var controlsToSend = new Array(100); controlsToSend.length = 0;     // pre allocate empty Array
    var netUpdate = { v: 0, c: undefined };
    var netUpdateFull = { cm: {}, s: {}, v: 0, c: undefined };
    var nextUpdateFull = false;

    var ws;
    var sessionID;
    var sessionIDToCreate;
    var keepAliveTimer;
    var clients = {};
    var wsOnly = false;

    var rtcConnectionConfig;
    var dataChannelConfig;

    var ct = jt.ConsoleControls;
    var localOnlyControls = new Set([
        ct.SAVE_STATE_0, ct.SAVE_STATE_1, ct.SAVE_STATE_2, ct.SAVE_STATE_3, ct.SAVE_STATE_4, ct.SAVE_STATE_5, ct.SAVE_STATE_6,
        ct.SAVE_STATE_7, ct.SAVE_STATE_8, ct.SAVE_STATE_9, ct.SAVE_STATE_10, ct.SAVE_STATE_11, ct.SAVE_STATE_12, ct.SAVE_STATE_FILE,
        ct.LOAD_STATE_0, ct.LOAD_STATE_1, ct.LOAD_STATE_2, ct.LOAD_STATE_3, ct.LOAD_STATE_4, ct.LOAD_STATE_5, ct.LOAD_STATE_6,
        ct.LOAD_STATE_7, ct.LOAD_STATE_8, ct.LOAD_STATE_9, ct.LOAD_STATE_10, ct.LOAD_STATE_11, ct.LOAD_STATE_12,
        ct.POWER_FRY, ct.VSYNCH, ct.TRACE, ct.CARTRIDGE_FORMAT
    ]);


    var MAX_DATA_CHANNEL_SIZE = 16300;
    var DATA_CHANNEL_FRAG_SIZE = 16200;
    var DATA_CHANNEL_FRAG_PART = "#@FrgS@#";
    var DATA_CHANNEL_FRAG_END =  "#@FrgE@#";

};
