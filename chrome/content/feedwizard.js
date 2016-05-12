Components.utils.import("resource://gre/modules/Preferences.jsm");

if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

if (!org.torbirdy.feedwizard) org.torbirdy.feedwizard = new function() {
  var pub = {};

  pub.fixFeedAccount = function(account) {
    let accountKey = account.incomingServer.key;

    let pref_spec = [
      ['mail.server.%serverkey%.check_new_mail', false],
      ['mail.server.%serverkey%.login_at_startup', false]
    ];

    for each (var [pref_template, value] in pref_spec) {
      let pref = pref_template.replace("%serverkey%", accountKey);
      Preferences.set(pref, value);
    }
  };

  // From comm-release/mailnews/extensions/newsblog/content/feedAccountWizard.js : onFinish().
  // We need to disable automatic checking of articles on startup and every X
  // (100 is the default) minutes. Since these values are in FeedUtils.jsm, we
  // use this overlay, create the account, and then apply our settings.
  FeedAccountWizard.onFinish = function() {
    let account = FeedUtils.createRssAccount(this.accountName);
    if ("gFolderTreeView" in window.opener.top)
      // Opened from 3pane File->New or Appmenu New Message, or
      // Account Central link.
      window.opener.top.gFolderTreeView.selectFolder(account.incomingServer.rootMsgFolder);
    else if ("selectServer" in window.opener)
      // Opened from Account Settings.
      window.opener.selectServer(account.incomingServer);

    // Now apply the settings.
    pub.fixFeedAccount(account);
    window.close();
  };

  return pub;
};
