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
  var prefs = Components.classes["@mozilla.org/preferences-service;1"]
                    .getService(Components.interfaces.nsIPrefBranch);

  // Set the time zone to UTC if the preference is true.
  if (prefs.getBoolPref("extensions.torbirdy.timezone"))
  {
    var env = Components.classes["@mozilla.org/process/environment;1"]
                              .getService(Components.interfaces.nsIEnvironment);
    env.set('TZ', 'UTC');
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
