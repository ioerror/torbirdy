Components.utils.import("resource://gre/modules/Preferences.jsm");

if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

if(!org.torbirdy.emailwizard) org.torbirdy.emailwizard = new function() {
  var pub = {};

  var disableAutoConfiguration = false;
  if (Preferences.get("extensions.torbirdy.emailwizard", false)) {
    disableAutoConfiguration = true;
  }

  fixupTorbirdySettingsOnNewAccount = function(account) {
    var idkey = account.defaultIdentity.key;
    var outgoing = account.defaultIdentity.smtpServerKey;
    var serverkey = account.incomingServer.key;
    var protocol = account.incomingServer.type;

    var pref_spec = [
        ['mail.server.%serverkey%.check_new_mail', false],
        ['mail.server.%serverkey%.login_at_startup', false]
    ];

    // 10 specifies OAuth2 as the authentication method (used for Gmail).
    if (pub.isGmail) {
      pref_spec.push(['mail.smtpserver.%outgoing%.authMethod', 10]);
      pref_spec.push(['mail.server.%serverkey%.authMethod', 10]);
    }

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
        pref = pref.replace("%outgoing%", outgoing);
        Preferences.set(pref, value);
    }
  }

  pub.adjustAutoWizard = function() {
    if (!disableAutoConfiguration) {
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
      // This is true for all providers except Gmail, which uses OAuth2.
      config.incoming.auth = 3;
      config.outgoing.auth = 3;

      // Default the outgoing SMTP port.
      config.outgoing.port = 465;

      config.outgoing.hostname = "smtp.%EMAILDOMAIN%";

      let emailDomain = email.split("@")[1];
      // Gmail and Riseup settings.
      switch (emailDomain) {
        case "gmail.com":
          // Gmail uses OAuth2, which we deal with later.
          pub.isGmail = true;
          break;
        case "riseup.net":
          config.incoming.hostname = "mail.%EMAILDOMAIN%";
          config.outgoing.hostname = "mail.%EMAILDOMAIN%";
          break;
      }

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
      var prefer_pop = Preferences.get("extensions.torbirdy.defaultprotocol") != 1;
      // Both of these monkeypatches hook in only to change the
      // selection default (POP vs IMAP according to our pref) at
      // suitable times, i.e. when the page has been pre-filled and is
      // finally presented to user action.
      var result_imappop_hacks_run_once = false;
      var old_displayConfigResult = gEmailConfigWizard.displayConfigResult;
      gEmailConfigWizard.displayConfigResult = function(config) {
        old_displayConfigResult.call(this, config);
        var radiogroup = document.getElementById("result_imappop");
        if (radiogroup.hidden) return;
        // We can only run the monkeypatch code below once -- this
        // method is called every time we change selection, preventing
        // us from changing the selection away from POP.
        if (result_imappop_hacks_run_once) return;
        result_imappop_hacks_run_once = true;
        var imap_element = document.getElementById("result_select_imap");
        var pop_element = document.getElementById("result_select_pop3");
        if (prefer_pop && imap_element.selected && pop_element) {
          radiogroup.selectedItem = pop_element;
          gEmailConfigWizard.onResultIMAPOrPOP3();
        }
      }
      var old_fillManualEditFields = gEmailConfigWizard._fillManualEditFields;
      gEmailConfigWizard._fillManualEditFields = function(config) {
        old_fillManualEditFields.call(this, config);
        if (prefer_pop) {
          // In this itemlist, POP is located at index 1.
          document.getElementById("incoming_protocol").selectedIndex = 1;
          gEmailConfigWizard.onChangedProtocolIncoming();
        }
      }

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
    if (disableAutoConfiguration) {
      document.getElementById("torbirdy-protocol-box").collapsed = true;
    }
    document.getElementById("provisioner_button").disabled = true;
    document.getElementById("provisioner_button").hidden = true;

    // 0 is for POP3 (default), 1 is for IMAP. See emailwizard.xul and prefs.js.
    var selectProtocol = Preferences.get("extensions.torbirdy.defaultprotocol")
    document.getElementById("torbirdy-protocol").selectedIndex = selectProtocol;
  };

  return pub;
};

window.addEventListener("keypress", org.torbirdy.emailwizard.onKeyEnter, true);
window.addEventListener("load", org.torbirdy.emailwizard.onLoad, true);
