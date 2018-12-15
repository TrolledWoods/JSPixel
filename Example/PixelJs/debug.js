function LogOnce(message, msg_id) {
    if(LogOnce.messages.includes(msg_id)) return;
    LogOnce.messages.push(msg_id);
    console.log(message);
}

LogOnce.messages = [];