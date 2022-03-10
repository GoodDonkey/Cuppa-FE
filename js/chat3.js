const url = 'http://127.0.0.1:8081';
let stompClient;
let $selectedUserId;
let $loginUsername;
let $loginUserId;
let template = Handlebars.compile($("#message-template").html());
let userTemplate = Handlebars.compile($("#user-template").html());
let unreadCount = new Map();

$(document).ready(function() {
    $loginUserId = getUserId();
    $loginUsername = getUsername();
    console.log("$loginUsername", $loginUsername)
    if ($loginUserId !== null) {
        document.getElementById("usernameArea").innerHTML=$loginUsername;
        fetchAllUsers()
        // fetchChatRooms()
    } else {
        $('#loginUserArea').empty().text("로그인 해주세요");
    }
    connectToChatServer();
})

function connectToChatServer() {
    console.log("connecting to chat server...")
    let socket = new SockJS(url + '/stomp/chat');
    stompClient = Stomp.over(socket);
    connectToChat($loginUserId); // 나에게 오는 메시지를 subscribe
}

function connectToChat(userId) {
    console.log("connecting to chat...")
    stompClient.connect({}, function (frame) {
        console.log("connected to: " + frame);
        stompClient.subscribe("/topic/messages/" + userId, function (response) {
            let data = JSON.parse(response.body);
            console.log(data)
            console.log("selectedUser: " + $selectedUserId);
            let senderId = String(data.sender.id);
            console.log("data.sender.id: " + senderId);
            // 보낸 사람과 채팅을 하고 있는 경우
            if ($selectedUserId === senderId) {
                render(data);
            } else {
                // 현재 상대방과 채팅하고 있지 않은 경우
                let newMessages = $('#newMessages_' + senderId);
                if (unreadCount.has(senderId) === false) {
                    unreadCount.set(senderId, 1)
                    newMessages.html('+' + unreadCount.get(senderId))
                } else {
                    unreadCount.set(senderId, unreadCount.get(senderId) + 1)
                    newMessages.html('+' + unreadCount.get(senderId))
                }
                console.log(unreadCount)
            }
        });
    }, function () {
        console.log("stompClient 연결 실패")
    });
}

function sendMsg(text) {
    stompClient.send("/app/chat/" + $selectedUserId, {}, JSON.stringify({
        receiverId: $selectedUserId,
        senderId: $loginUserId,
        message: text
    }));
}

function selectUser(userId) {
    // 선택한 유저 설정
    console.log("selecting user Id: " + userId);
    $('#chat-with').text($('#username-area-'+userId).text())
    $selectedUserId = userId

    // 채팅 내역 가져오기
    $chatHistoryList.empty();
    fetchAllMessagesWith(userId);

    // 메시지 모두 읽음 처리하기
    unreadCount.set(userId, 0)
    $('#newMessages_' + userId).empty();
}

function fetchAllMessagesWith(userId) {
    $.ajax({
        url: url + "/chat/fetchAllMessages/" + userId,
        type: "GET",
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            // message를 화면에 보여준다
            console.log(response)
            scrollToBottom();

            response.forEach(message => {
                if (message.sender.id === $loginUserId) { // 내가 보낸 메시지면
                    let context = {
                        message: message.message.trim(),
                        time: getCurrentTime(), // Todo: 메시지에 저장된 시간으로 바꾸기
                    };
                    $chatHistoryList.append(template(context));
                } else { // 상대방 메시지면 다르게
                    let contextResponse = {
                        message: message.message.trim(),
                        time: getCurrentTime(),
                        username: message.sender.username
                    };
                    $chatHistoryList.append(templateResponse(contextResponse));
                }
            });
            scrollToBottom();
            $textarea.val('');
        }
    }).fail(function (error) {
        console.log(error)
    })
}

function fetchAllUsers() {
    // Json 을 예상하지만 html이 올 수 있다.
    $.ajax({
        url: url + "/fetchAllUsers",
        type: "GET",
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
    }).done(
        function (response) {
            let members = response;
            console.log("fetchAllUsers(): ", response);
            for (let i = 0; i < members.length; i++) {
                let context = {
                    newMessages: 0,
                    username: members[i].username,
                    userId: members[i].id,
                    online: "online"
                }
                $('#user-list').find('hr').before(userTemplate(context));
            }
        }
    ).fail(function (response) {
        console.log("ajax실패")
        console.log(response)
        alert("오류입니다\n\n" + response.responseJSON.error)
    })
}

function getUserId() {
    let userId;
    $.ajax({
        url: url + "/members/getUserId",
        async: false,
        type: "GET",
        // dataType: 'json',
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            userId = response
        },
        error: function(response) {
            console.log("getUsername error", response)
            userId = null
        }
    }).always(function (response){
        console.log("getUserName()", response)
    })
    return userId
}

function getUsername() {
    let username;
    $.ajax({
        url: url + "/members/getUsername",
        async: false,
        type: "GET",
        // dataType: 'json',
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function(response) {
            username = response
        },
        error: function(response) {
            console.log("getUsername error", response)
            username = null
        }
    }).always(function (response){
        console.log("getUserName()", response)
    })
    return username
}