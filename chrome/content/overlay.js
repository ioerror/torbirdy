function startup() {
  // Set the time zone to UTC.
  var env = Components.classes["@mozilla.org/process/environment;1"]
                            .getService(Components.interfaces.nsIEnvironment);
  env.set('TZ', 'UTC');

  var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);
  prefs.setIntPref("mailnews.reply_header_type", 1);
  prefs.setCharPref("mailnews.reply_header_authorwrote", "%s");

  var myPanel = document.getElementById("my-panel");
  if (prefs.getBoolPref("extensions.torbirdy.protected"))
  {
    myPanel.label = "Tor Enabled";
    myPanel.style.color = "green";
  } else {
    myPanel.label = "Tor Disabled!";
    myPanel.style.color = "red";
  }
}

function onClickHandler(event) {
  switch(event.which) {
    case 1:
      alert("Torbutton for Thunderbird is currently enabled and is helping protect your anonymity.\n" +
              "\nTo disable Torbutton, go to Tools > Add-ons.");
      break;
  }
}

window.addEventListener("load", startup, false);
