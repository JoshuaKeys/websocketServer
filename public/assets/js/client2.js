var connection = new WebSocket('wss://joshua-dev.life', 'echo-protocol');
let stream;
let userName;
var url_string = window.location.href;
var url = new URL(url_string);
var username = url.searchParams.get('username');
var local_video = document.querySelector('#local-video');
let remoteVideo = document.querySelector('#remote-video');
var call_button = document.querySelector('#call-btn');
var usernameInput = document.querySelector('#username-input');
var callStatus = document.querySelector('.call-hang-status');
let dataChannel;
let msgInput = document.querySelector('#msg-input');
let msgSendBtn = document.querySelector('#msg-sent-btn');
let msgChatArea = document.querySelector('.chat-area');

var myConn;
let connected_user;

connection.onopen = function () {
  if (connection.readyState === 1) {
    console.log('hello');
    if (username && username.length > 0) {
      userName = username;
      send({
        type: 'login',
        name: userName,
      });
    }
  } else {
    console.log(connection.readyState);
  }
};

connection.onmessage = (msg) => {
  handleClientMsg(msg);
};
connection.onerror = (error) => {
  console.error(error);
};

call_button.addEventListener('click', () => {
  var userToCall = usernameInput.value;
  callStatus.innerHTML =
    '<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="assets/images/other.jpg" class="caller-image circle" alt=""> </div> <div class="user-name">' +
    userToCall +
    '</div> <div class="user-calling-status">Calling...</div> <div class="calling-action"> <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>';
  connected_user = userToCall;
  const callReject = document.querySelector('.call-reject');
  callReject.addEventListener('click', (evt) => {
    alert('Call was canceled');
    callStatus.innerHTML = '';
    send({ name: userToCall });
  });
  if (!userToCall.length) {
    return;
  }
  createOffer(userToCall);
});

// functions
function send(message) {
  console.log(message);
  connection.send(JSON.stringify(message));
}

function handleClientMsg(msg) {
  const data = JSON.parse(msg.data);
  console.log('received', data.type);
  switch (data.type) {
    case 'reject':
      callStatus.innerHTML = '';
      break;
    case 'login':
      if (data.success === false) {
        alert('Try a different username');
      } else {
        navigator.mediaDevices
          .getUserMedia({
            video: true,
            audio: true,
          })
          .then((myStream) => {
            stream = myStream;
            local_video.srcObject = stream;
            local_video.muted = true;
            createConnection();
          })
          .catch((err) => {
            console.error(err);
          });
      }
      break;
    case 'leave':
      remoteVideo.src = null;
      callStatus.innerHTML = '';
      myConn.close();
      myConn.onicecandidate = null;
      myConn.ontrack = null;
      connectedUser = null;
      break;
    case 'offer':
      connected_user = data.name;
      callStatus.innerHTML =
        '<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="assets/images/me.jpg" class="caller-image circle" alt=""> </div> <div class="user-name">' +
        connected_user +
        '</div> <div class="user-calling-status">Calling...</div> <div class="calling-action"> <div class="call-accept"><i class="material-icons green darken-2 white-text audio-icon">call</i></div> <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>';
      const callReceive = document.querySelector('.call-accept');
      const callReject = document.querySelector('.call-reject');
      callReceive.addEventListener('click', (evt) => {
        if (myConn.connectionState === 'closed') {
          createConnection();
        }
        myConn.setRemoteDescription(new RTCSessionDescription(data.offer));
        myConn.createAnswer().then((answer) => {
          myConn.setLocalDescription(answer);
          send({
            type: 'answer',
            answer,
            name: connected_user,
          });
        });
        callStatus.innerHTML = '';
      });
      callReject.addEventListener('click', (evt) => {
        callStatus.innerHTML = '';
        rejectedCall(connected_user);
      });

      break;
    // create answer to an offer or user A.
    case 'answer':
      console.log('answer gotten', data.answer);
      callStatus.innerHTML = '';
      myConn.setRemoteDescription(new RTCSessionDescription(data.answer));
      break;
    case 'candidate':
      console.log('got candidateeeeee');
      myConn.addIceCandidate(new RTCIceCandidate(data.candidate));
      break;
    default:
      break;
  }
}

function createConnection() {
  var iceServers = {
    iceServers: [
      { urls: 'stun:stun.services.mozilla.com' },
      { urls: 'stun:stun.l.google.com:19302' },
    ],
  };
  myConn = new RTCPeerConnection(iceServers);
  dataChannel = myConn.createDataChannel('channel1', {
    reliable: true,
  });
  dataChannel.onerror = (error) => {
    console.log('Error: ', error);
  };
  dataChannel.onmessage = function (event) {
    chatArea.innerHTML += `<div class="left-align"> 
      <img src="assets/images/other.jpg" class="caller-image circle">
      ${connectedUser}: ${event.data}
      </div><br>
      `;
  };
  dataChannel.onclose = function (event) {
    console.log('data channel is closed');
  };
  console.log(dataChannel);
  myConn.addTrack(stream.getTracks()[0], stream);
  myConn.addTrack(stream.getTracks()[1], stream);
  myConn.onicecandidate = function (event) {
    if (event.candidate) {
      send({
        type: 'candidate',
        candidate: event.candidate,
        name: connected_user,
      });
    }
  };
  myConn.ontrack = function (e) {
    console.log(e.streams);
    remoteVideo.srcObject = e.streams[0];
    // remoteVideo.muted = true;
    callStatus.innerHTML =
      ' <div class="call-status-wrap white-text"> <div class="calling-wrap"> <div class="calling-action"> <div class="videocam-on"> <i class="material-icons teal darken-2 white-text video-toggle">videocam</i> </div> <div class="audio-on"> <i class="material-icons teal darken-2 white-text audio-toggle">mic</i> </div> <div class="call-cancel"> <i class="material-icons red darken-3 white-text call-icon">call</i> </div> </div> </div> </div>';
    var videoToggle = document.querySelector('.videocam-on');
    var audioToggle = document.querySelector('.audio-on');
    var videoToggleClass = document.querySelector('.video-toggle');
    var audioToggleClass = document.querySelector('.audio-toggle');
    var closeCall = document.querySelector('.call-icon');
    closeCall.addEventListener('click', () => {
      console.log(connected_user);
      hangUp(connected_user);
    });
    videoToggle.onclick = () => {
      console.log(stream.getVideoTracks()[0]);
      stream.getVideoTracks()[0].enabled = !stream.getVideoTracks()[0].enabled;
      if (videoToggleClass.innerText === 'videocam') {
        videoToggleClass.innerText = 'videocam_off';
      } else {
        videoToggleClass.innerText = 'videocam';
      }
    };

    audioToggle.onclick = () => {
      console.log(stream.getAudioTracks()[0]);
      stream.getAudioTracks()[0].enabled = !stream.getAudioTracks()[0].enabled;
      if (audioToggleClass.innerText === 'mic') {
        audioToggleClass.innerText = 'mic_off';
      } else {
        audioToggleClass.innerText = 'mic';
      }
    };
  };
  return myConn;
}
function rejectedCall(rejectedUser) {
  send({
    type: 'reject',
    name: rejectedUser,
  });
}
function hangUp(name) {
  var callCancel = document.querySelector('.call-cancel');
  remoteVideo.src = null;
  callStatus.innerHTML = '';
  myConn.close();
  myConn.onicecandidate = null;
  myConn.ontrack = null;
  connectedUser = null;
  callCancel.addEventListener('click', () => {
    callStatus.innerHTML = '';
    send({
      type: 'leave',
      name,
    });
  });
}

function createOffer(userToCall) {
  if (myConn.connectionState == 'closed') {
    createConnection();
  }
  myConn
    .createOffer()
    .then((sessionDescription) => {
      myConn.setLocalDescription(sessionDescription);
      send({
        type: 'offer',
        offer: sessionDescription,
        name: userToCall,
      });
    })
    .catch((err) => {
      alert('Offer has not being created', err);
      console.error('offer has not being created', err);
    });
}

// Message sending
msgSendBtn.addEventListener('click', () => {
  const val = msgInput.value;
  chatArea.innerHTML += `<div class='right-align'>${val}: ${userName} 
  <img src="assets/images/me.jpg" class="caller-image circle">
  </div><br>`;
  dataChannel.send(val);
  msgInput.value = '';
});
