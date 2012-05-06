window.addEventListener("compose-send-message", send_event_handler, true);

function send_event_handler(event) {
  var msgcomposeWindow = document.getElementById("msgcomposeWindow");
  var msg_type = msgcomposeWindow.getAttribute("msgtype");

  // Do not continue unless this is an actual send event.
  if( !(msg_type == nsIMsgCompDeliverMode.Now || msg_type == nsIMsgCompDeliverMode.Later) )
    return;

  // Edit required headers here.
  // https://developer.mozilla.org/en/XPCOM_Interface_Reference/NsIMsgCompFields
  // gMsgCompose.compFields.$FIELDS
}
