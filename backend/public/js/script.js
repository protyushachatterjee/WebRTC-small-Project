const socket = io();
let local, remote, peerConnection;
const rtcSettings = {
    iceServer: [{ urls: "stun:stun.l.google.com:19302" }]
}

const initialize = async () => {
    try {
        // Get user media and assign it to the local variable
        local = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });

        // Attach the local stream to the local video element
        document.getElementById("localVideo").srcObject = local;

        // Listen for signaling messages
        socket.on("signallingMassage", handleSignallingMessage);

        // Initiate the offer
        initiateOffer();
    } catch (error) {
        console.error("Error accessing media devices:", error);
    }
};

const initiateOffer = async () => {
    await createPeerConnection();

    const offer = await peerConnection.createOffer();
   await peerConnection.setLocalDescription(offer);
   socket.emit("signallingMassage", JSON.stringify({ type: "offer", offer }));
}

const createPeerConnection = async () => {
    peerConnection = new RTCPeerConnection(rtcSettings)

  remote= new MediaStream();
  document.getElementById("remoteVideo").srcObject = remote;
  document.getElementById("localVideo").srcObject = local;

  local.getTracks().forEach((track) => {
    peerConnection.addTrack(track, local);
  })

  peerConnection.ontrack = (event) => {
    event.streams[0].getTracks().forEach((track) => {
        remote.addTrack(track);
    })
  }

  peerConnection.onicecandidate = (event) => {
    event.candidate && socket.emit("signallingMassage", JSON.stringify({type:"candidate", candidate: event.candidate}));
  }
}

const handleSignallingMessage = async (message) => {
    const {type, offer, answer, candidate} = JSON.parse(message);

    if(type === "offer") {
        await createPeerConnection();
        await peerConnection.setRemoteDescription(offer);
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        socket.emit("signallingMassage", JSON.stringify({type: "answer", answer}));
    }
    if(type === "answer") {
        if(!peerConnection.currentRemoteDescription){
            await peerConnection.setRemoteDescription(answer);
        }
    }
    if(type === "candidate" && peerConnection){
         peerConnection.addIceCandidate(candidate);
    }
}

document.getElementById("disconnectButton").addEventListener("click", function () {
    // Stop all tracks in the local stream
    if (local) {
        local.getTracks().forEach((track) => track.stop());
    }

    // Disconnect the socket
    socket.disconnect();

    // Close the peer connection
    if (peerConnection) {
        peerConnection.close();
        peerConnection = null;
    }

    // Clear the local and remote video elements
    document.getElementById("localVideo").srcObject = null;
    document.getElementById("remoteVideo").srcObject = null;

    // Optionally, hide the video elements or show a blank box
    document.getElementById("remoteVideo").style.display = "block";
    document.getElementById("localVideo").style.display = "block";

    // Reset local and remote variables
    local = null;
    remote = null;
})

initialize();