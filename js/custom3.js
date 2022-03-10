let $chatHistory;
let $button;
let $textarea;
let $chatHistoryList;
let templateResponse = Handlebars.compile($("#message-response-template").html());


function init() {
    cacheDOM();
    bindEvents();
}
function bindEvents() {
    $button.on('click', addMessage.bind(this));
    $textarea.on('keyup', addMessageEnter.bind(this));
}

function cacheDOM() {
    $chatHistory = $('.chat-messages');
    $button = $('#sendBtn');
    $textarea = $('#message-input');
    $chatHistoryList = $chatHistory;
}

function sendMessage(message) {
    if ($.trim(message) === '') {
        return false;
    }
    sendMsg(message)
    scrollToBottom()
    if ($.trim(message) !== '') {
        let context = {
            message: message,
            time: getCurrentTime(),
        };

        $chatHistoryList.append(template(context));
        scrollToBottom();
        $textarea.val('');
    }
}

function render(data) {
    console.log("render called")
    scrollToBottom();
    let contextResponse = {
        message: data.message,
        time: getCurrentTime(),
        username: data.sender.username,
        // userId: data.sender.id
    };

    setTimeout(function () {
        $chatHistoryList.append(templateResponse(contextResponse));
        scrollToBottom();
    }.bind(this), 1500);
}

function getCurrentTime() {
    return new Date().toLocaleTimeString().replace(/([\d]+:[\d]{2})(:[\d]{2})(.*)/, "$1$3");
}

function scrollToBottom() {
    $chatHistory.scrollTop($chatHistory[0].scrollHeight);
}

function addMessageEnter(event) {
    if (event.keyCode === 13) {
        addMessage();
    }
}

function addMessage() {
    sendMessage($textarea.val());
}

init()