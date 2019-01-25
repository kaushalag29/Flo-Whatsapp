window.indexedDB = window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || 
window.msIndexedDB;
 
window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || 
window.msIDBTransaction;
window.IDBKeyRange = window.IDBKeyRange || 
window.webkitIDBKeyRange || window.msIDBKeyRange
 
if (!window.indexedDB) {
   window.alert("Your browser doesn't support a stable version of IndexedDB.")
}

var db,timing;
var request = window.indexedDB.open("Database1", 3);
request.onerror = function(event) {
    console.log("error: ",event.target);
};         

request.onsuccess = function(event) {
    db = request.result;
    console.log("success: "+ db);
    readFromDb();
};

request.onupgradeneeded = function(event) {
    db = event.target.result;
    console.log("hi");
    var objectStore = db.createObjectStore("chats", {keyPath:"id", autoIncrement:true});
   // readFromDb();
}

function addSentChat(msg,time){
	var request = db.transaction(["chats"], "readwrite")
   .objectStore("chats")
   .add({chat:"S"+msg,moment:time});
   
   request.onsuccess = function(event) {
      console.log("Message has been added to your database.");
   };
   
   request.onerror = function(event) {
      console.log("Unable to add message in your database! ");
   }
}

function addReceivedChat(msg,time){
	var request = db.transaction(["chats"], "readwrite")
   .objectStore("chats")
   .add({chat:"R"+msg,moment:time});
   
   request.onsuccess = function(event) {
      console.log("Message has been added to your database.");
   };
   
   request.onerror = function(event) {
      console.log("Unable to add message in your database! ");
   }
}

function readFromDb() {
	var objectStore = db.transaction(["chats"],IDBTransaction.READ_ONLY).objectStore("chats");
   	
   	objectStore.onerror = function(event) {
      console.log("No Store Found!");
   }
   	objectStore.openCursor().onsuccess = function(event) {
      var cursor = event.target.result;
      
      if (cursor) {
         addChatToFrontEnd(cursor.value.chat,cursor.value.moment);
         cursor.continue();
      } else {
         console.log("No more entries!");
      }
   };

   objectStore.openCursor().onerror = function(event) {
      console.log("No entries found!");
   };
}

var conversation = document.querySelector('.conversation-container');

function addChatToFrontEnd(msg,time){
	var orig_msg = msg.substring(1);
	if(msg[0] == 'R')
		var message = buildMessageReceived(orig_msg,time);
	else
		var message = buildMessageSent(orig_msg,time);
	conversation.appendChild(message);
	animateMessage(message);
	conversation.scrollTop = conversation.scrollHeight;
}

var deviceTime = document.querySelector('.status-bar .time');
var messageTime = document.querySelectorAll('.message .time');

deviceTime.innerHTML = moment().format('h:mm');

setInterval(function(){
	deviceTime.innerHTML = moment().format('h:mm');
}, 1000);

for (var i = 0; i < messageTime.length; i++){
	messageTime[i].innerHTML = moment().format('h:mm A');
}

var host = location.hostname	//location.hostname
var wsUri = "ws://"+host+":8000/ws";
console.log(wsUri);
var websocket;
//var noOfUsersOnline = 0;

function init(){
	//readFromDb();
	websocket = new WebSocket(wsUri);
    websocket.onopen = function(evt) { onOpen(evt) };
    websocket.onclose = function(evt) { onClose(evt) };
    websocket.onmessage = function(evt) { onMessage(evt) };
    websocket.onerror = function(evt) { onError(evt) };
}

function onOpen(evt){
    console.log("CONNECTED");
    makeOnline();
    //noOfUsersOnline++;
    //console.log("Total Users = "+noOfUsersOnline.toString());
    document.getElementsByClassName('user')[0].innerHTML = host+'';
}

function onClose(evt){
    console.log("DISCONNECTED");
    makeOffline();
    //noOfUsersOnline--;
    //console.log("Total Users = "+noOfUsersOnline.toString());
}

function onMessage(evt){
    console.log(evt);
    var msgArray = evt.data.split(' ');
    var len = msgArray.length;
    var msg = "";
    for(var i=1;i<len-1;i++)
    	msg = msg + msgArray[i] + ' ';
    msg = msg + msgArray[len-1];
    msg = msg.replace(/</g, "&lt;").replace(/>/g, "&gt;");
    //console.log(msg);
    var message = buildMessageReceived(msg,moment().format('h:mm A'));
	conversation.appendChild(message);
	addReceivedChat(msg,timing);
	animateMessage(message);
	conversation.scrollTop = conversation.scrollHeight;
}

function onError(evt){
    console.log(evt.data);
}

var form = document.querySelector('.conversation-compose');

form.addEventListener('submit', newMessage);

function newMessage(e) {
	var input = e.target.input;

	if(input.value){
		input.value = input.value.replace(/</g, "&lt;").replace(/>/g, "&gt;");
		//console.log(input.value);
		var message = buildMessageSent(input.value,moment().format('h:mm A'));
		console.log(message);
		conversation.appendChild(message);
		animateMessage(message);
		addSentChat(input.value,timing);
		websocket.send(input.value);
	}
	
	input.value = '';
	conversation.scrollTop = conversation.scrollHeight;

	e.preventDefault();
}

function buildMessageSent(text,time) {
	var element = document.createElement('div');
	timing = time;
	element.classList.add('message', 'sent');

	element.innerHTML = text +
		'<span class="metadata">' +
			'<span class="time">' + time + '</span>' +
			'<span class="tick tick-animation">' +
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" id="msg-dblcheck" x="2047" y="2061"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#92a58c"/></svg>' +
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" id="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#4fc3f7"/></svg>' +
			'</span>' +
		'</span>';

	return element;
}

function buildMessageReceived(text,time) {
	var element = document.createElement('div');
	timing = time;
	element.classList.add('message', 'received');

	element.innerHTML = text +
		'<span class="metadata">' +
			'<span class="time">' + time + '</span>' +
			'<span class="tick tick-animation">' +
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" id="msg-dblcheck" x="2047" y="2061"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#92a58c"/></svg>' +
				'<svg xmlns="http://www.w3.org/2000/svg" width="16" height="15" id="msg-dblcheck-ack" x="2063" y="2076"><path d="M15.01 3.316l-.478-.372a.365.365 0 0 0-.51.063L8.666 9.88a.32.32 0 0 1-.484.032l-.358-.325a.32.32 0 0 0-.484.032l-.378.48a.418.418 0 0 0 .036.54l1.32 1.267a.32.32 0 0 0 .484-.034l6.272-8.048a.366.366 0 0 0-.064-.512zm-4.1 0l-.478-.372a.365.365 0 0 0-.51.063L4.566 9.88a.32.32 0 0 1-.484.032L1.892 7.77a.366.366 0 0 0-.516.005l-.423.433a.364.364 0 0 0 .006.514l3.255 3.185a.32.32 0 0 0 .484-.033l6.272-8.048a.365.365 0 0 0-.063-.51z" fill="#4fc3f7"/></svg>' +
			'</span>' +
		'</span>';

	return element;
}

function animateMessage(message) {
	setTimeout(function() {
		var tick = message.querySelector('.tick');
		tick.classList.remove('tick-animation');
	}, 500);
}

function makeOnline(){
	console.log(document.getElementsByClassName('status')[0]);
    document.getElementsByClassName('status')[0].innerHTML = "Online";
}

function makeOffline(){
    document.getElementsByClassName('status')[0].innerHTML = "Offline";
}

window.addEventListener("load", init, false);