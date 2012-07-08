function disableAutoWizard() {
  var realname = document.getElementById("realname").value;
  var email = document.getElementById("email").value;
  var password = document.getElementById("password").value;
  var remember_password = document.getElementById("remember_password").checked;
  var protocol = document.getElementById("protocol").value;

  alert("Torbutton has disabled Thunderbird's auto-configuration wizard to protect your anonymity.\n" +
      "\nPlease configure your account manually.");

  var config = new AccountConfig();
  config.incoming.type = protocol;

  config.incoming.username = "%EMAILLOCALPART%";
  config.outgoing.username = "%EMAILLOCALPART%";

  if (protocol === "imap") {
    config.incoming.hostname = "imap.%EMAILDOMAIN%";
    config.incoming.port = 993;
  }

  if (protocol === "pop3") {
    config.incoming.hostname = "pop.%EMAILDOMAIN%";
    config.incoming.port = 995;
  }

  // Default to SSL/TLS for both outgoing and incoming servers.
  config.incoming.socketType = 2;
  config.outgoing.socketType = 2;

  // Default the outgoing SMTP port.
  config.outgoing.port = 465;

  // Don't check for new messages at startup.
  config.incoming.loginAtStartup = false;

  config.outgoing.hostname = "smtp.%EMAILDOMAIN%";

  replaceVariables(config, realname, email, password);
  config.rememberPassword = remember_password && !!password;

  var newAccount = createAccountInBackend(config);

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

function onKeyEnter(event) {
  var keycode = event.keyCode;
  if (keycode == 13) {
    disableAutoWizard();
  }
}

function onLoad(event) {
  document.getElementById('provisioner_button').setAttribute('disabled', 'true');
}

window.addEventListener("keypress", onKeyEnter, true);
window.addEventListener("load", onLoad, true);
