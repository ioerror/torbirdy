/************************************
* Preferences dialog javascript code
 ************************************/

const Ci = Components.interfaces;
const Cc = Components.classes;


function onLoad() {
  var myprefsHandler = Cc["@mozilla.org/preferences-service;1"]
      .getService(Ci.nsIPrefBranch);

  var anonProxy = document.getElementById('AnonService');

  anonProxy.selectedIndex = myprefsHandler
                            .getIntPref('extensions.torbirdy.proxy');
}


function onAccept() {

  var myprefsHandler = Cc["@mozilla.org/preferences-service;1"]
      .getService(Ci.nsIPrefBranch);
  var win = Cc['@mozilla.org/appshell/window-mediator;1']
      .getService(Ci.nsIWindowMediator)
      .getMostRecentWindow('mail:3pane');
  var myPanel = win.document.getElementById("my-panel");
  var AnonService = document.getElementById('AnonService').selectedIndex;

  myprefsHandler.setIntPref('extensions.torbirdy.proxy', AnonService);
  
  if (AnonService == 0) {
      // Set proxies for Tor
      myprefsHandler.setIntPref("network.proxy.socks_port", 9050);
      myprefsHandler.setIntPref("network.proxy.ssl_port", 8118);
      myprefsHandler.setIntPref("network.proxy.http_port", 8118);
      myPanel.label = "TorBirdy Enabled:   Tor";
  } else {
      // Set proxies for JonDo
      myprefsHandler.setIntPref("network.proxy.socks_port", 4001);
      myprefsHandler.setIntPref("network.proxy.ssl_port", 4001);
      myprefsHandler.setIntPref("network.proxy.http_port", 4001);
      myPanel.label = "TorBirdy:     Disabled!";
  }
}

