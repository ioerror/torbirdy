(function initOverlayWindow() {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);
  if (!(prefs.getBoolPref('extensions.torbirdy.startup_folder'))) {
    function selectFolderOnInit(initialUri) {
      var startupFolder = GetMsgFolderFromUri("mailbox://nobody@Local%20Folders");
      if (startupFolder) {
        var folderTree = document.getElementById("folderTree");
        if (window.gFolderTreeView)
          gFolderTreeView.selectFolder(startupFolder);
      }
    }
    window.loadStartFolder = selectFolderOnInit;
  }
})();

function torbirdyStartup() {
  // Set the time zone to UTC.
  var env = Components.classes["@mozilla.org/process/environment;1"]
                            .getService(Components.interfaces.nsIEnvironment);
  env.set('TZ', 'UTC');

  var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);

  var myPanel = document.getElementById("torbirdy-my-panel");
  var strbundle = document.getElementById("strings");
  if (prefs.getBoolPref("extensions.torbirdy.protected"))
  {
    var type = prefs.getIntPref("extensions.torbirdy.proxy");
    myPanel.style.color = "green";
    // Tor.
    if (type === 0)
    {
      myPanel.label = strbundle.getString("torbirdy.enabled.tor");
    }
    // JonDo.
    if (type === 1)
    {
      myPanel.label = strbundle.getString("torbirdy.enabled.jondo");
    }
    // Custom.
    if (type === 2)
    {
      myPanel.label = strbundle.getString("torbirdy.enabled.custom");
    }
  } else {
    myPanel.label = strbundle.getString("torbirdy.enabled.disabled");
    myPanel.style.color = "red";
  }
}

function setProxyTor() {
   var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);

   var myPanel = document.getElementById("torbirdy-my-panel");
   var strbundle = document.getElementById("strings");
   
   prefs.setIntPref("extensions.torbirdy." + 'proxy', 0);
   
   // First set the preferences immediately.
   prefs.setIntPref("network.proxy.socks_port", 9050);
   prefs.setIntPref("network.proxy.ssl_port", 8118);
   prefs.setIntPref("network.proxy.http_port", 8118);
   prefs.setCharPref("extensions.enigmail.agentAdditionalParam", 
                              "--no-emit-version --no-comments --throw-keyids --display-charset utf-8 --keyserver-options http-proxy=http://127.0.0.1:8118 --keyserver hkp://2eghzlv2wwcq7u7y.onion");
   // Now save them for later use.
   prefs.clearUserPref("extensions.torbirdy.custom." + "network.proxy.socks_port");
   prefs.clearUserPref("extensions.torbirdy.custom." + "network.proxy.ssl_port");
   prefs.clearUserPref("extensions.torbirdy.custom." + "network.proxy.http_port");
   prefs.clearUserPref("extensions.torbirdy.custom." + "extensions.enigmail.agentAdditionalParam");
   myPanel.label = strbundle.getString("torbirdy.enabled.tor");
}

function setProxyJonDo() {
   var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);

   var myPanel = document.getElementById("torbirdy-my-panel");
   var strbundle = document.getElementById("strings");
   
   prefs.setIntPref("extensions.torbirdy." + 'proxy.type', 0);
   prefs.setIntPref("extensions.torbirdy." + 'proxy', 1);
   
   // First set the preferences immediately.
   prefs.setIntPref("network.proxy.socks_port", 4001);
   prefs.setIntPref("network.proxy.ssl_port", 4001);
   prefs.setIntPref("network.proxy.http_port", 4001);
   prefs.setCharPref("extensions.enigmail.agentAdditionalParam", 
                              "--no-emit-version --no-comments --throw-keyids --display-charset utf-8 --keyserver-options http-proxy=http://127.0.0.1:4001");
   // Now save them for later use.
   prefs.setIntPref("extensions.torbirdy.custom." + "network.proxy.socks_port", 4001);
   prefs.setIntPref("extensions.torbirdy.custom." + "network.proxy.ssl_port", 4001);
   prefs.setIntPref("extensions.torbirdy.custom." + "network.proxy.http_port", 4001);
   prefs.setCharPref("extensions.torbirdy.custom." + "extensions.enigmail.agentAdditionalParam", 
                              "--no-emit-version --no-comments --throw-keyids --display-charset utf-8 --keyserver-options http-proxy=http://127.0.0.1:4001");
   myPanel.label = strbundle.getString("torbirdy.enabled.jondo");
}

window.addEventListener("load", torbirdyStartup, false);
