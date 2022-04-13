let stompClient;
let $selectedUserId;
let $loginUsername;
let $loginUserId;
let template = Handlebars.compile($("#message-template").html());
let userTemplate = Handlebars.compile($("#user-template").html());
let unreadCount = new Map();
moment.locale('ko');

$(document).ready(function () {
    $loginUserId = getUserId();
    $loginUsername = getUsername();
    if ($loginUserId !== null) {
        document.getElementById("usernameArea").innerHTML = $loginUsername;
        fetchAllUsers()
        // fetchChatRooms()
    } else {
        $('#loginUserArea').empty().text("로그인 해주세요");
        $loginButton.show();

    }
    connectToChatServer();
    $textarea.attr('disabled', true);
})

$.ajaxSetup({
    beforeSend: function (xhr) {
        xhr.setRequestHeader("AJAX", true);
    }
})

//
// $.ajaxSetup({
//     headers: {
//         'X-CSRF-TOKEN': $('meta[name="csrf-token"]').attr('content')
//     }
// });


function connectToChatServer() {
    console.log("connecting to chat server...")
    let socket = new SockJS(API_URL + '/api/v1/stomp/chat');
    stompClient = Stomp.over(socket);
    stompClient.heartbeat.outgoing = 0;
    stompClient.heartbeat.incoming = 0;
    connectToChat($loginUserId); // 나에게 오는 메시지를 subscribe
}

function connectToChat(userId) {
    console.log("connecting to chat...")
    stompClient.connect({}, function (frame) {
        stompClient.subscribe("/exchange/chat.exchange/to." + userId, function (response) {
            let data = JSON.parse(response.body);
            console.log("selectedUser: " + $selectedUserId);
            let senderId = String(data.sender.id);
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
            }
        });
    }, function () {
        console.log("stompClient 연결 실패")
    });
}

function sendMsg(text) {
    stompClient.send("/app/chat." + $selectedUserId, {}, JSON.stringify({
        receiverId: $selectedUserId,
        senderId: $loginUserId,
        message: text,
        createdAt: null
    }));
}

function selectUser(userId) {
    // 채팅창 풀기
    $textarea.attr('disabled', false);

    // 선택한 유저 설정
    $('#chat-with').text($('#username-area-' + userId).text())
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
        url: API_URL + "/api/v1/messages/" + userId,
        type: "GET",
        dataType: 'json',
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            // message를 화면에 보여준다
            scrollToBottom();

            response.forEach(message => {
                if (message.sender.id === $loginUserId) { // 내가 보낸 메시지면
                    let context = {
                        message: message.message.trim(),
                        time: moment(message.createdAt).format('LT'),
                    };
                    $chatHistoryList.append(template(context));
                } else { // 상대방 메시지면 다르게
                    let contextResponse = {
                        message: message.message.trim(),
                        time: moment(message.createdAt).format('LT'),
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
        url: API_URL + "/api/v1/members",
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
        url: API_URL + "/api/v1/members/userId",
        async: false,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            userId = response
        },
        error: function (response) {
            console.log("getUserId error", response)
            userId = null
        }
    }).always(function (response) {
    })
    return userId
}

function getUsername() {
    let username;
    $.ajax({
        url: API_URL + "/api/v1/members/username",
        async: false,
        type: "GET",
        contentType: "application/json; charset=utf-8",
        crossDomain: true,
        xhrFields: {
            withCredentials: true
        },
        success: function (response) {
            username = response
        },
        error: function (response) {
            console.log("getUsername error", response)
            username = null
        }
    }).always(function (response) {
    })
    return username
}