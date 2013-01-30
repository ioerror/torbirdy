(function initOverlayWindow() {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);
  if (!(prefs.getBoolPref('extensions.torbirdy.startup_folder'))) {
    window.loadStartFolder = function() {
      var startupFolder = GetMsgFolderFromUri("mailbox://nobody@Local%20Folders");
      if (startupFolder) {
        if (window.gFolderTreeView) {
          gFolderTreeView.selectFolder(startupFolder);
        }
      }
    };
  }
})();

function torbirdyStartup() {
  var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);
  var env = Components.classes["@mozilla.org/process/environment;1"]
                            .getService(Components.interfaces.nsIEnvironment);

  // Set the time zone to UTC if the preference is true.
  if (prefs.getBoolPref("extensions.torbirdy.timezone"))
  {
    env.set('TZ', 'UTC');
  }

  // Check if we are running Whonix.
  var whonix = false;
  if (env.exists("WHONIX")) {
    whonix = true;
  }

  var myPanel = document.getElementById("torbirdy-my-panel");
  var strbundle = document.getElementById("torbirdy-strings");
  if (prefs.getBoolPref("extensions.torbirdy.protected"))
  {
    var type = prefs.getIntPref("extensions.torbirdy.proxy");
    myPanel.style.color = "green";
    // Tor.
    if (type === 0)
    {
      myPanel.label = strbundle.getString("torbirdy.enabled.tor");
    }
    // JonDo/Whonix.
    if (type === 1)
    {
      if (prefs.getIntPref("extensions.torbirdy.proxy.type") === 0) {
        myPanel.label = strbundle.getString("torbirdy.enabled.jondo");
      }
      if (prefs.getIntPref("extensions.torbirdy.proxy.type") === 1) {
        myPanel.label = strbundle.getString("torbirdy.enabled.whonix");
      }
    }
    // Custom.
    if (type === 2)
    {
      myPanel.label = strbundle.getString("torbirdy.enabled.custom");
    }
    // Whonix.
    if (whonix) {
      myPanel.label = strbundle.getString("torbirdy.enabled.whonix");
      org.torbirdy.prefs.setProxyWhonix();
    }
    // Transparent Torification.
    if (type === 3)
    {
      myPanel.label = strbundle.getString("torbirdy.enabled.torification");
      myPanel.style.color = "red";
    }
  } else {
    myPanel.label = strbundle.getString("torbirdy.enabled.disabled");
    myPanel.style.color = "red";
  }
}

window.addEventListener("load", torbirdyStartup, false);
