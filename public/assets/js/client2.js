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

    case 'offer':
      connected_user = data.name;
      callStatus.innerHTML =
        '<div class="calling-status-wrap card black white-text"> <div class="user-image"> <img src="assets/images/me.jpg" class="caller-image circle" alt=""> </div> <div class="user-name">' +
        connected_user +
        '</div> <div class="user-calling-status">Calling...</div> <div class="calling-action"> <div class="call-accept"><i class="material-icons green darken-2 white-text audio-icon">call</i></div> <div class="call-reject"><i class="material-icons red darken-3 white-text close-icon">close</i></div> </div> </div>';
      const callReceive = document.querySelector('.call-accept');
      const callReject = document.querySelector('.call-reject');
      callReceive.addEventListener('click', (evt) => {
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
  };
  console.log(stream.getTracks());
}
function rejectedCall(rejectedUser) {
  send({
    type: 'reject',
    name: rejectedUser,
  });
}
