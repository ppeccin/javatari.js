// Copyright 2015 by Paulo Augusto Peccin. See license.txt distributed with this file.

jt.NetClient = function(room) {
    "use strict";

    var self = this;

    this.joinSession = function(pSessionID, pNick) {
        sessionIDToJoin = ("" + pSessionID).trim();
        if (!sessionIDToJoin)
            return room.showOSD("Must enter Session Name for joining NetPlay session", true, true);

        // Check for wsOnly indicator
        var wsOnlyAsked;
        if (sessionIDToJoin[sessionIDToJoin.length - 1] === "@") {
            sessionIDToJoin  = sessionIDToJoin.substr(0, sessionIDToJoin.length -1);
            wsOnlyAsked = true;
        } else
            wsOnlyAsked = false;

        nickDesired = pNick;
        wsOnlyDesired = wsOnlyAsked;

        if (sessionID === sessionIDToJoin && nick === nickDesired && wsOnly === wsOnlyDesired) return;
        if (sessionID) this.leaveSession(true);

        room.enterNetPendingMode(this);

        if (!ws) {
            ws = new WebSocket("wss://" + Javatari.SERVER_ADDRESS);
            ws.onmessage = onSessionMessage;
            ws.onopen = onSessionServerConnected;
            ws.onclose = onSessionServerDisconnected;
        } else
            onSessionServerConnected();
    };

    this.leaveSession = function(wasError, userMessage) {
        clearInterval(keepAliveTimer);
        keepAliveTimer = undefined;

        sessionID = nick = undefined;
        wsOnly = false;

        if (ws) {
            ws.onopen = ws.onclose = ws.onmessage = undefined;
            ws.close();
            ws = undefined;
        }
        if (dataChannel) dataChannel.onopen = dataChannel.onclose = dataChannel.onmessage = undefined;
        if (rtcConnection) rtcConnection.onicecandidate = rtcConnection.ondatachannel = undefined;

        dataChannelActive = false;
        dataChannelFragmentData = "";

        if (wasError) stopRTC();
        else setTimeout(stopRTC, 300);      // Give some time before ending RTC so Session Disconnection can be detected first by Server

        room.showOSD(userMessage || "NetPlay session ended", true, wasError);
        (wasError ? jt.Util.error : jt.Util.log) (userMessage || "NetPlay session ended");

        room.enterStandaloneMode();
    };

    this.getSessionID = function() {
        return sessionID;
    };

    this.netVideoClockPulse = function() {
        // Client gets clocks from Server at onServerNetUpdate()
    };

    function onSessionServerConnected() {
        // Setup keep-alive
        if (keepAliveTimer === undefined) keepAliveTimer = setInterval(keepAlive, 30000);
        // Join a Session
        ws.send(JSON.stringify({
            sessionControl: "joinSession", sessionType: "javatari", sessionID: sessionIDToJoin, clientNick: nickDesired, wsOnly: wsOnlyDesired,
            queryVariables: [ "RTC_CONFIG" ]
        }));
    }

    function onSessionServerDisconnected() {
        self.leaveSession(true, keepAliveTimer ? "NetPlay session ended: Connection lost" : "NetPlay: Connection error");
    }

    function onSessionMessage(event) {
        var message = JSON.parse(event.data);

        if (message.javatariUpdate)
            return onServerNetUpdate(JSON.parse(message.javatariUpdate));

        if (message.sessionControl) {
            switch (message.sessionControl) {
                case "sessionJoined":
                    onSessionJoined(message);
                    return;
                case "sessionDestroyed":
                    self.leaveSession(false, 'NetPlay Session "' + sessionID + '" ended');
                    return;
                case "joinError":
                    self.leaveSession(true, "NetPlay: " + message.errorMessage);
                    return;
            }
            return;
        }

        if(message.serverSDP)
            onServerSDP(message);
    }

    function onSessionJoined(message) {
        sessionID = message.sessionID;
        nick = message.clientNick;
        wsOnly = wsOnlyDesired || message.wsOnly;
        justJoined = true;

        if (wsOnly) return enterNetClientMode();

        try {
            rtcConnectionConfig = JSON.parse(message.queriedVariables.RTC_CONFIG || "{}");
        } catch (e) {}

        // Start RTC
        rtcConnection = new RTCPeerConnection(rtcConnectionConfig);

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

    function enterNetClientMode() {
        room.showOSD('NetPlay Session "' + sessionID + '" joined as "' + nick + '"', true);
        jt.Util.log('NetPlay Session "' + sessionID + '" joined as "' + nick + '"');

        consoleControls.netClearControlsToSend();
        room.enterNetClientMode(self);
    }

    function onServerSDP(message) {
        rtcConnection.setRemoteDescription(new RTCSessionDescription(message.serverSDP))
            .then(function() { return rtcConnection.createAnswer(); })
            .then(function(desc) { return rtcConnection.setLocalDescription(desc); })
            .catch(onRTCError);
    }

    function onDataChannelOpen(event) {
        dataChannelActive = true;
        dataChannelFragmentData = "";
        enterNetClientMode();
    }

    function onDataChannelClose(event) {
        jt.Util.error("NetPlay dataChannel closed");
        self.leaveSession(true, "NetPlay session ended: P2P connection lost");
    }

    function onDataChannelMessage(event) {
        var data = receiveFromDataChannel(event);
        if (data) onServerNetUpdate(JSON.parse(data));
    }

    function onRTCError(error) {
        jt.Util.error("NetPlay RTC error:", error);
        self.leaveSession(true, "NetPlay session ended: P2P connection error");
    }

    function stopRTC() {
        if (dataChannel) {
            dataChannel.onopen = dataChannel.onclose = dataChannel.onmessage = undefined;
            dataChannel.close();
            dataChannel = undefined;
        }
        if (rtcConnection) {
            rtcConnection.onicecandidate = rtcConnection.ondatachannel = undefined;
            rtcConnection.close();
            rtcConnection = undefined;
        }
    }

    function onServerNetUpdate(netUpdate) {
        // console.log(netUpdate);

        // Full Update?
        if (netUpdate.s) {
            atariConsole.loadState(netUpdate.s);    // extended
            if (justJoined) {
                // Change Controls Mode automatically to adapt to Server
                room.consoleControls.setP1ControlsAndPaddleMode(!netUpdate.cm.p1, netUpdate.cm.pd);
                justJoined = false;
            }
        } else {
            // Apply controls changes from Server
            if (netUpdate.c) consoleControls.netClientApplyControlsChanges(netUpdate.c);

            // Send local (Client) Machine clock
            atariConsole.videoClockPulseApplyPulldowns(netUpdate.v);
        }

        // Send clock do Controllers
        atariConsole.getConsoleControlsSocket().controlsClockPulse();

        // Send local controls to Server. We always send a message even when empty to keep the channel active
        var update = { c: consoleControls.netGetControlsToSend() };

        // Use DataChannel if available
        if (dataChannelActive) dataChannel.send(JSON.stringify(update));
        // Or fallback to WebSocket relayed through the Session Server (BAD!)
        else ws.send(JSON.stringify({ javatariUpdate: update }));

        consoleControls.netClearControlsToSend();
    }

    function keepAlive() {
        try {
            ws.send('{ "sessionControl": "keep-alive" }');
        } catch (e) {
            jt.Util.error("NetPlay error sending keep-alive");
            self.leaveSession(true, "NetPlay session ended: Connection error");
        }
    }

    // Automatically reconstructs message fragments as needed. Data must be a String
    function receiveFromDataChannel(event) {
        var data = event.data;

        var fragFlag = data.substr(0, 8);
        if (fragFlag === DATA_CHANNEL_FRAG_PART || fragFlag === DATA_CHANNEL_FRAG_END) {
            dataChannelFragmentData += data.substr(8);
            if (fragFlag === DATA_CHANNEL_FRAG_END) {
                data = dataChannelFragmentData;

                // console.log("Fragmented message received: " + data.length + ", fragments: " + ((data.length / DATA_CHANNEL_FRAG_SIZE - 0.0001) | 0 + 1));

                dataChannelFragmentData = "";
                return data;
            }
        } else {
            dataChannelFragmentData = "";
            return data;
        }
    }


    var atariConsole = room.console;
    var consoleControls = room.consoleControls;

    var ws;
    var sessionID;
    var sessionIDToJoin;
    var nick;
    var nickDesired;
    var wsOnlyDesired = false;
    var justJoined = false;
    var keepAliveTimer;

    var rtcConnectionConfig;
    var wsOnly = false;

    var rtcConnection;
    var dataChannel;
    var dataChannelActive = false;
    var dataChannelFragmentData = "";


    var DATA_CHANNEL_FRAG_SIZE = 16200;
    var DATA_CHANNEL_FRAG_PART = "#@FrgS@#";
    var DATA_CHANNEL_FRAG_END =  "#@FrgE@#";

};

jt.NetClient.initKeepAlive = function() {
    if (Javatari.SERVER_ADDRESS && Javatari.SERVER_KEEPALIVE) jt.NetClient.sendKeepAlive();
};

jt.NetClient.sendKeepAlive = function() {
    fetch("https://" + Javatari.SERVER_ADDRESS + "/keepalive", { mode: "no-cors" })
        .catch(function(e) {
            jt.Util.error("Sending KeepAlive: ", e);
        })
        .finally(function() {
            if (Javatari.SERVER_KEEPALIVE > 0) setTimeout(jt.NetClient.sendKeepAlive, Javatari.SERVER_KEEPALIVE);
        });
};
