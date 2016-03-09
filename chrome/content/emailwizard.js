Components.utils.import("resource://gre/modules/Preferences.jsm");

if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

if(!org.torbirdy.emailwizard) org.torbirdy.emailwizard = new function() {
  var pub = {};

  var disableWizard = !Preferences.get("extensions.torbirdy.emailwizard", false);

  fixupTorbirdySettingsOnNewAccount = function(account) {
    var idkey = account.defaultIdentity.key;
    var serverkey = account.incomingServer.key;
    var protocol = account.incomingServer.type;

    var pref_spec = [
        ['mail.server.%serverkey%.check_new_mail', false],
        ['mail.server.%serverkey%.login_at_startup', false]
    ];

    // Make sure that drafts are saved to Local Folders if it is an IMAP account.
    if (protocol === "imap") {
        pref_spec.push(['mail.identity.%idkey%.draft_folder',
                        'mailbox://nobody@Local%20Folders/Drafts']);
    }

    // Do not automatically download new messages in POP accounts.
    if (protocol === "pop3") {
        pref_spec.push(['mail.server.%serverkey%.download_on_biff', false]);
    }

    for each (var [pref_template, value] in pref_spec) {
        var pref = pref_template.replace("%idkey%", idkey);
        pref = pref.replace("%serverkey%", serverkey);
        Preferences.set(pref, value);
    }
  }

  pub.adjustAutoWizard = function() {
    if (!disableWizard) {
      var realname = document.getElementById("realname").value;
      var email = document.getElementById("email").value;
      var password = document.getElementById("password").value;
      var rememberPassword = document.getElementById("remember_password").checked;
      var protocol = document.getElementById("torbirdy-protocol").value;

      var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                                    .getService(Ci.nsIPromptService);

      var bundles = Cc["@mozilla.org/intl/stringbundle;1"]
                              .getService(Ci.nsIStringBundleService);
      var strings = bundles.createBundle("chrome://castironthunderbirdclub/locale/torbirdy.properties");
      var emailPrompt = strings.formatStringFromName("torbirdy.email.prompt", [email], 1);
      var extName = strings.GetStringFromName("torbirdy.name");
      prompts.alert(null, extName, emailPrompt);

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

      // Default to SSL for both outgoing and incoming servers.
      config.incoming.socketType = 2;
      config.outgoing.socketType = 2;

      // Set the authentication to 'Normal' (connection is already encrypted).
      config.incoming.auth = 3;
      config.outgoing.auth = 3;

      // Set default values to disable automatic email fetching.
      config.incoming.loginAtStartup = false;
      config.incoming.downloadOnBiff = false;

      // Default the outgoing SMTP port.
      config.outgoing.port = 465;

      config.outgoing.hostname = "smtp.%EMAILDOMAIN%";

      replaceVariables(config, realname, email, password);
      config.rememberPassword = rememberPassword && !!password;

      var new_account = createAccountInBackend(config);
      fixupTorbirdySettingsOnNewAccount(new_account);

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
                          { server: new_account.incomingServer,
                            selectPage: "am-server.xul" });
      }
      window.close();
    }
    else {
      // From comm-release/mailnews/base/prefs/content/accountcreation/emailWizard.js : finish().
      // We need somewhere to hook in, so we can access the new
      // account object created through the autoconfig wizard, and
      // apply Torbirdy's settings on it.
      gEmailConfigWizard.finish = function() {
        gEmailWizardLogger.info("creating account in backend");
        var account = createAccountInBackend(this.getConcreteConfig());
        fixupTorbirdySettingsOnNewAccount(account);
        window.close();
      }

      gEmailConfigWizard.onNext();
    }
  };

  pub.onKeyEnter = function(event) {
    var keycode = event.keyCode;
    if (keycode == 13) {
      if (document.getElementById("next_button").disabled === false) {
        pub.adjustAutoWizard();
      }
    }
  };

  pub.onLoad = function() {
    if (disableWizard) {
      document.getElementById("torbirdy-protocol-box").collapsed = true;
    }
    document.getElementById("provisioner_button").disabled = true;
    document.getElementById("provisioner_button").hidden = true;
  };

  return pub;
};

window.addEventListener("keypress", org.torbirdy.emailwizard.onKeyEnter, true);
window.addEventListener("load", org.torbirdy.emailwizard.onLoad, true);
