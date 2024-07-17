// src/components/VideoChat.js
import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const VideoChat = () => {
  const [stream, setStream] = useState();
  const [myPeer, setMyPeer] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callEnded, setCallEnded] = useState(false);
  const [userVideo, setUserVideo] = useState();
  const [socket, setSocket] = useState();

  const myVideo = useRef();
  const userVideoRef = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      setStream(stream);
      myVideo.current.srcObject = stream;
    });

    socketInstance.on('user-connected', (userId) => {
      const peer = new Peer({ initiator: true, trickle: false, stream });
      setMyPeer(peer);

      peer.on('signal', (data) => {
        socketInstance.emit('call-user', { userToCall: userId, signalData: data, from: socketInstance.id });
      });

      peer.on('stream', (userStream) => {
        userVideoRef.current.srcObject = userStream;
      });

      socketInstance.on('call-accepted', (signal) => {
        setCallAccepted(true);
        peer.signal(signal);
      });
    });

    socketInstance.on('call-user', (data) => {
      const peer = new Peer({ initiator: false, trickle: false, stream });
      setMyPeer(peer);

      peer.on('signal', (signal) => {
        socketInstance.emit('accept-call', { signal, to: data.from });
      });

      peer.on('stream', (userStream) => {
        userVideoRef.current.srcObject = userStream;
      });

      peer.signal(data.signal);
    });

  }, []);

  return (
    <div className="flex justify-center items-center h-screen bg-gray-100">
      <div className="grid grid-cols-1 gap-4">
        <video playsInline muted ref={myVideo} autoPlay className="w-1/2 h-auto" />
        {callAccepted && !callEnded ? (
          <video playsInline ref={userVideoRef} autoPlay className="w-1/2 h-auto" />
        ) : null}
      </div>
    </div>
  );
};

export default VideoChat;
