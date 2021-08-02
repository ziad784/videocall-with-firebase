


const firebaseConfig = {
    apiKey: "AIzaSyAvulw1vxeKtD-c6rfAJuTPEVu83vYkAfI",
    authDomain: "webrtc-4ae6a.firebaseapp.com",
    projectId: "webrtc-4ae6a",
    storageBucket: "webrtc-4ae6a.appspot.com",
    messagingSenderId: "847301147695",
    appId: "1:847301147695:web:530293bbf861dc2ece1ada",
    measurementId: "G-EYE9GMBW7H"
  };


      firebase.initializeApp(firebaseConfig);
  


  let firestore = firebase.firestore();

  const servers = {
    iceServers: [
      {
        urls: ['stun:stun1.l.google.com:19302', 'stun:stun2.l.google.com:19302'],
      },
    ],
    iceCandidatePoolSize: 10,
  };



let pc = new RTCPeerConnection(servers);

let me = null;
let frienders = null;

let me_vid = document.getElementById("me");
me_vid.muted  = true;
let friend_vid = document.getElementById("friend");
let start_btn = document.getElementById("start");
let make_offer_btn = document.getElementById("make_offer");
let answer_btn = document.getElementById("answer");
let input = document.getElementById("input");



start_btn.addEventListener("click", async ()=>{
    me = await navigator.mediaDevices.getUserMedia({video:true,audio:true});
    frienders = new MediaStream();

    me.getTracks().forEach((track)=>{
        pc.addTrack(track,me);
    })


    pc.ontrack = (e)=>{
     
        e.streams[0].getTracks().forEach((track)=>{
           
            frienders.addTrack(track);
           
        })
    }

    
    me_vid.srcObject = me;
    friend_vid.srcObject = frienders;
    


});

make_offer_btn.addEventListener("click", async ()=>{
    let callDoc = firestore.collection('calls').doc();
    let offerCan = callDoc.collection("offerCan");
    let answerCan = callDoc.collection("answerCan");
    input.value = callDoc.id;

    pc.onicecandidate = (e)=>{
       e.candidate && offerCan.add(e.candidate.toJSON())
    }


    let offerDesc = await pc.createOffer();
    await pc.setLocalDescription(offerDesc);


    let offer = {
        sdp: offerDesc.sdp,
        type: offerDesc.type
    };

    await callDoc.set({offer});


    callDoc.onSnapshot((snapshot)=>{
        let data = snapshot.data();
    
       if(!pc.currentRemoteDescription && data?.answer){
           let answerDesc = new RTCSessionDescription(data.answer);
           pc.setRemoteDescription(answerDesc);
       }
    })
    
    answerCan.onSnapshot((snapshot)=>{
        snapshot.docChanges().forEach((change)=>{
            if(change.type === 'added'){
                let candidate = new RTCIceCandidate(change.doc.data());
                pc.addIceCandidate(candidate);
            }
        })
    })


})





answer_btn.addEventListener("click", async ()=>{
    let docId = input.value;
    let callDoc = firestore.collection('calls').doc(docId);
    let answerCan = callDoc.collection('answerCan');
    let offerCan = callDoc.collection('offerCan');


    pc.onicecandidate = (e)=>{
        
       e.candidate && answerCan.add(e.candidate.toJSON());
    }


    let callData = (await callDoc.get()).data();

    let offerDesc = callData.offer;
    await pc.setRemoteDescription(new RTCSessionDescription(offerDesc));

    let answerDesc = await pc.createAnswer();
    await pc.setLocalDescription(answerDesc);

    let answer = {
        sdp: answerDesc.sdp,
        type: answerDesc.type
    };

    await callDoc.update({answer});

    offerCan.onSnapshot((snapshot)=>{
        snapshot.docChanges().forEach((change)=>{
        
            if(change.type == "added"){
                let candidate = new RTCIceCandidate(change.doc.data());
               
                pc.addIceCandidate(candidate);
            }
        })
    })


} )


