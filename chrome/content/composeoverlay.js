const Ci = Components.interfaces;
const Cc = Components.classes;

function getRandom() {
  return Math.random();
}

function atextRandom() {
  var inChars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789+-=_";
  var randomString = '';
  for (var i = 0; i < 10; i++) {
    var num = Math.floor(Math.random() * inChars.length);
    randomString += inChars.substring(num, num+1);
  }
  return randomString;
}

function toHexString(charCode) {
  return ("0" + charCode.toString(16)).slice(-2);
}

function send_event_handler(event) {
  var msgcomposeWindow = document.getElementById("msgcomposeWindow");
  var msg_type = msgcomposeWindow.getAttribute("msgtype");

  var prefs = Cc["@mozilla.org/preferences-service;1"]
                 .getService(Ci.nsIPrefBranch);

  var is_custom_msg_id = prefs.getBoolPref("mailnews.custom_message_id");

  if (is_custom_msg_id) {
    // Only continue if this is an actual send event.
    if (!(msg_type == nsIMsgCompDeliverMode.Now || msg_type == nsIMsgCompDeliverMode.Later))
      return;

    var to_field = gMsgCompose.compFields.to;
    var cc_field = gMsgCompose.compFields.cc;
    var subject_field = gMsgCompose.compFields.subject;

    // When a message is forwarded, remove the references header.
    // See https://trac.torproject.org/projects/tor/ticket/6392
    if (gMsgCompose.type === 3 || gMsgCompose.type === 4) {
      gMsgCompose.compFields.references = '';
    }

    try {
      var editor = GetCurrentEditor();
      var body = editor.outputToString('text/plain', 4);
    } catch(ex) {
      // We couldn't get the editor.
      var body = '';
    }

    // Generate an 'email' and append a random number. The SHA512 hash of this email will be used later.
    var mail = to_field + cc_field + subject_field + body + getRandom();

    var converter = Cc["@mozilla.org/intl/scriptableunicodeconverter"]
                        .createInstance(Ci.nsIScriptableUnicodeConverter);
    var ch = Cc["@mozilla.org/security/hash;1"]
                 .createInstance(Ci.nsICryptoHash);

    converter.charset = "UTF-8";
    var result = {};

    var data = converter.convertToByteArray(mail, result);
    ch.init(ch.SHA512);
    ch.update(data, data.length);

    var hash = ch.finish(false);
    var pref_hash = [toHexString(hash.charCodeAt(i)) for (i in hash)].join("").slice(0, 40);
    // Randomize characters to upper case and lower case.
    var choices = [true, false];
    pref_hash = [choices[Math.floor(Math.random() * choices.length)] ?
                        e.toUpperCase() : e.toLowerCase() for each (e in pref_hash.split(""))].join("");

    // Introduce more randomness.
    var randomString = atextRandom();
    var message_id = pref_hash + randomString;

    // Set the preference to use the custom generated header ID.
    prefs.setCharPref("mailnews.header.custom_message_id", message_id);
  }
}

window.addEventListener("compose-send-message", send_event_handler, true);
