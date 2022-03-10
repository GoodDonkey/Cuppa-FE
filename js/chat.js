const url = 'http://127.0.0.1:8081';
let stompClient;
let selectedUser;
let newMessages = new Map();
let $loginUsername;

$(document).ready(function() {
    $loginUsername = getUserName();
    console.log($loginUsername)
    if ($loginUsername !== null) {
        document.getElementById("usernameArea").innerHTML=$loginUsername;
        fetchAllUsers()
        fetchChatRooms()
    } else {
        $('#loginUserArea').empty().text("로그인 해주세요");
    }
})


function connectToChat(userName) {
    console.log("connecting to chat...")
    let socket = new SockJS(url + '/stomp/chat');
    stompClient = Stomp.over(socket);
    stompClient.connect({}, function (frame) {
        console.log("connected to: " + frame);
        stompClient.subscribe("/topic/messages/" + userName, function (response) {
            let $newMessageCount = 0;
            let data = JSON.parse(response.body);
            console.log(data)
            console.log("selectedUser: " + selectedUser);
            console.log("data.sender: " + data.sender);
            if (selectedUser === data.sender) {
                render(data.message, data.sender);
            } else {
                $newMessageCount++;
                if ($('#newMessage_' + data.sender).length === 0) {
                    $('#userNameAppender_' + data.sender).append('<span id="newMessage_' + data.sender + '" style="color: red"> +' + $newMessageCount + '</span>');
                } else {
                    $('#newMessage_' + data.sender).text('+' + $newMessageCount)
                }
            }
        });
    }, function () {
        console.log("stompClient 연결 실패")
    });
}

function sendMsg(from, text) {
    stompClient.send("/app/chat/" + selectedUser, {}, JSON.stringify({
        destination: selectedUser,
        sender: from,
        message: text
    }));
}

function getUserName() {
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
        console.log(response)
    })
    return username
}

function selectUser(userName) {
    console.log("selecting users: " + userName);
    // 현재 로그인 한 유저의 이름을 get으로 가져오기
    selectedUser = userName;

    // 채팅방 정보 가져오기
    connectToChat($loginUsername);
    $chatHistoryList.empty();
    $.ajax({
        url: url + "/chat/fetchAllMessages/" + selectedUser, 
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
            var template = Handlebars.compile($("#message-template").html());
            var templateResponse = Handlebars.compile($("#message-response-template").html());
            response.forEach(message => {
                if (message.sender === $loginUsername) { // 내가 보낸 메시지면
                    var context = {
                        messageOutput: message.message.trim(),
                        time: getCurrentTime(),
                        toUserName: userName
                    };
                    $chatHistoryList.append(template(context));
                } else { // 상대방 메시지면 다르게
                    var contextResponse = {
                        response: message.message.trim(),
                        time: getCurrentTime(),
                        userName: selectedUser
                    };
                    $chatHistoryList.append(templateResponse(contextResponse));
                }
            });
            scrollToBottom();
            $textarea.val('');
        }}).fail(function (error) {
            console.log(error)
        })
    let isNew = document.getElementById("newMessage_" + userName) !== null;
    if (isNew) {
        let element = document.getElementById("newMessage_" + userName);
        element.parentNode.removeChild(element);
        $newMessageCount = 0;
    }
    $('#selectedUserId').html('').append('Chat with ' + userName);
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
            let users = response;
            let usersTemplateHTML = "";
            console.log(response);
            for (let i = 0; i < users.length; i++) {
                usersTemplateHTML = usersTemplateHTML + '<a href="#" onclick="selectUser(\'' + users[i] + '\')"><li class="clearfix">\n' +
                    '                <img src="' + url + '/images/defaultUser.jpeg"' + ' width="55px" height="55px" alt="avatar" />\n' +
                    '                <div class="about">\n' +
                    '                    <div id="userNameAppender_' + users[i] + '" class="name">' + users[i] + '</div>\n' +
                    '                    <div class="status">\n' +
                    '                        <i class="fa fa-circle offline"></i>\n' +
                    '                    </div>\n' +
                    '                </div>\n' +
                    '            </li></a>';
            }
            $('#usersList').html(usersTemplateHTML);
        }
    ).fail(function (response) {
        console.log("ajax실패")
        console.log(response)
        alert("오류입니다\n\n" + response.responseJSON.error)
    })
}

function fetchChatRooms() {
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
            let chatrooms = response;
            let usersTemplateHTML = "";
            console.log(response);
            for (let i = 0; i < chatrooms.length; i++) {
                $("#chatRoomList").append('<a href="#" onclick="selectUser(\'' + chatrooms[i] + '\')"></a>')
                    .children().eq(i).append('<li class="clearfix">' + i +'</li>\n')
                    .children().eq(0).append('<img src="' + url + '/images/defaultUser.jpeg" width="55px" height="55px" alt="avatar" />\n')
                    .append('<div class="about"></div>')
                    .children().eq(1).append('<div id="chatRoomNumber_' + chatrooms[i] + '" class="chatRoomNumber">'+ chatrooms[i] + '</div>')
            }
        }
    ).fail(function (response) {
        console.log("ajax실패")
        console.log(response)
        alert("오류입니다\n\n" + response.responseJSON.error)
    })
}