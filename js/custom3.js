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
    $loginButton.hide();
}

function cacheDOM() {
    $chatHistory = $('.chat-messages');
    $button = $('#sendBtn');
    $textarea = $('#message-input');
    $chatHistoryList = $chatHistory;
    $loginButton = $('#loginButton')
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
    };

    setTimeout(function () {
        $chatHistoryList.append(templateResponse(contextResponse));
        scrollToBottom();
    }.bind(this), 1500);
}

function getCurrentTime() {
    return moment().format('LT')
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