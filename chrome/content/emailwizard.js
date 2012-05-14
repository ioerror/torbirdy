function disableAutoWizard() {
  var realname = document.getElementById("realname").value;
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  var remember_password = document.getElementById("remember_password").checked;

  alert("Torbutton has disabled Thunderbird's auto-configuration wizard to protect your anonymity.\n" +
      "\nPlease configure your account manually.");

  var currentConfig = new AccountConfig();
  currentConfig.incoming.type = "imap";
  currentConfig.incoming.username = "%EMAILLOCALPART%";
  currentConfig.outgoing.username = "%EMAILLOCALPART%";
  currentConfig.incoming.hostname = ".%EMAILDOMAIN%";
  currentConfig.outgoing.hostname = ".%EMAILDOMAIN%";

  replaceVariables(currentConfig, realname, email, password);
  currentConfig.rememberPassword = remember_password && !! password;

  var newAccount = createAccountInBackend(currentConfig);

  // From comm-release/mailnews/base/prefs/content/accountcreation/emailWizard.js : onAdvancedSetup().
  var windowManager = Cc["@mozilla.org/appshell/window-mediator;1"]
      .getService(Ci.nsIWindowMediator);
  var existingAccountManager = windowManager
      .getMostRecentWindow("mailnews:accountmanager");
  if (existingAccountManager) {
    existingAccountManager.focus();
  } else {
    window.openDialog("chrome://messenger/content/AccountManager.xul",
                      "AccountManager", "chrome,centerscreen,modal,titlebar",
                      { server: newAccount.incomingServer,
                        selectPage: "am-server.xul" });
  }
  window.close();
}
