if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

if (!org.torbirdy.prefs) org.torbirdy.prefs = new function() {
  var pub = {};

  pub.prefBranch = "extensions.torbirdy.";
  pub.customBranch = "extensions.torbirdy.custom.";

  pub.torKeyserver = "hkp://qdigse2yzvuglcix.onion";
  pub.jondoKeyserver = "hkp://pool.sks-keyservers.net";

  pub.prefs = Components.classes["@mozilla.org/preferences-service;1"]
                  .getService(Components.interfaces.nsIPrefBranch);

  pub.torBirdyPref = Components.classes["@mozilla.org/preferences-service;1"]
                         .getService(Components.interfaces.nsIPrefService).getBranch(pub.customBranch);

  pub.acctMgr = Components.classes["@mozilla.org/messenger/account-manager;1"]
                    .getService(Components.interfaces.nsIMsgAccountManager);

  var bundles = Components.classes["@mozilla.org/intl/stringbundle;1"]
                        .getService(Components.interfaces.nsIStringBundleService);
  pub.strBundle = bundles.createBundle("chrome://castironthunderbirdclub/locale/torbirdy.properties");

  pub.setDefaultPrefs = function() {
    pub.prefs.setCharPref("network.proxy.socks", "127.0.0.1");
    pub.prefs.setIntPref("network.proxy.socks_port", 9150);
    pub.prefs.clearUserPref("network.proxy.http");
    pub.prefs.clearUserPref("network.proxy.http_port");
    pub.prefs.clearUserPref("network.proxy.ssl");
    pub.prefs.clearUserPref("network.proxy.ssl_port");
  };

  pub.resetNetworkProxy = function() {
    pub.prefs.setIntPref("network.proxy.type", 1);
  };

  pub.setEnigmailPrefs = function(anonService) {
    if (pub.prefs.getBoolPref("extensions.torbirdy.enigmail.throwkeyid")) {
      if (anonService === "tor") {
        return "--no-emit-version " +
               "--no-comments " +
               "--throw-keyids " +
               "--display-charset utf-8 " +
               "--keyserver-options no-auto-key-retrieve,no-try-dns-srv,http-proxy=http://127.0.0.1:8118";
      }
      if (anonService === "jondo") {
        return "--no-emit-version " +
               "--no-comments " +
               "--throw-keyids " +
               "--display-charset utf-8 " +
               "--keyserver-options no-auto-key-retrieve,no-try-dns-srv,http-proxy=http://127.0.0.1:4001";
      }
    }
    else {
      if (anonService === "tor") {
        return "--no-emit-version " +
               "--no-comments " +
               "--display-charset utf-8 " +
               "--keyserver-options no-auto-key-retrieve,no-try-dns-srv,http-proxy=http://127.0.0.1:8118";
      }
      if (anonService === "jondo") {
        return "--no-emit-version " +
               "--no-comments " +
               "--display-charset utf-8 " +
               "--keyserver-options no-auto-key-retrieve,no-try-dns-srv,http-proxy=http://127.0.0.1:4001";
      }
    }
  };

  pub.updateKeyserver = function(anonService) {
    var extension = "extensions.enigmail.keyserver";
    var keyserver = pub.enigmailKeyserver;
    if (typeof keyserver === "undefined") {
      var keyserverValue = (anonService === "tor") ? pub.torKeyserver : pub.jondoKeyserver;
    } else {
      var keyserverValue = keyserver.value;
    }
    if (anonService === "tor") {
      pub.setPreferences(extension, keyserverValue);
    }
    if (anonService === "jondo") {
      pub.setPreferences(extension, keyserverValue);
    }
  };

  pub.restoreEnigmailPrefs = function() {
    pub.prefs.setCharPref("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("tor"));
    pub.updateKeyserver("tor");
  };

  pub.clearCustomPrefs = function() {
    var customPrefs = pub.torBirdyPref.getChildList("", {});
    for (var i = 0, l=customPrefs.length ; i < l; i++) {
      pub.prefs.clearUserPref(pub.customBranch + customPrefs[i]);
    }
  };

  pub.clearSinglePref = function(pref) {
    pub.prefs.clearUserPref(pub.customBranch + pref);
  };

  pub.fetchAllMessages = function() {
    if (pub.fetchAllMails.checked) {
      pub.imapIdle.checked = true;
      pub.startupFolder.checked = true;
    }
    else {
      pub.imapIdle.checked = false;
      pub.startupFolder.checked = false;
    }
  };

  pub.checkSetting = function() {
    var index = pub.anonService.selectedIndex;
    if (index === 2) {
      pub.socksHost.disabled = false;
      pub.socksPort.disabled = false;
    }
    else {
      pub.socksHost.disabled = true;
      pub.socksPort.disabled = true;
    }

    if (index === 1) {
      pub.anonCustomService.disabled = false;
      var service = pub.anonCustomService.selectedIndex;
      if (pub.anonCustomService.selectedIndex === 0) {
        pub.enigmailKeyserver.value = pub.jondoKeyserver;
      }
      if (pub.anonCustomService.selectedIndex === 1) {
        pub.enigmailKeyserver.value = pub.torKeyserver;
      }
    } else {
      pub.anonCustomService.disabled = true;
    }
    if (index === 0 || index === 2 || index === 3) {
      pub.enigmailKeyserver.value = pub.torKeyserver;
    }
  };

  pub.getAccount = function() {
    var mailAccounts = [];
    var accounts = pub.acctMgr.accounts;

    // To maintain compatibility between Gecko 17+ and Gecko < 17.
    var newGecko = (accounts.queryElementAt) ? true : false;

    var accountLength = newGecko ? accounts.length : accounts.Count();

    for (var i = 0; i < accountLength; i++) {
      var account = (newGecko) ?
                    accounts.queryElementAt(i, Components.interfaces.nsIMsgAccount).incomingServer :
                    accounts.QueryElementAt(i, Components.interfaces.nsIMsgAccount).incomingServer;

      var name = account.prettyName;
      if (!(name === "Local Folders")) {
        mailAccounts.push(account);
      }
    }
    return mailAccounts;
  };

  pub.selectMailAccount = function() {
    var index = pub.mailAccount.selectedIndex;

    if (!(index === 0)) {
      // For email accounts, configure accordingly.
      var sAccount = null;
      var account = pub.getAccount();
      for (var i = 0; i < account.length; i++) {
        if (account[i].key === pub.mailAccount.value) {
          sAccount = i;
        }
      }
      // Configure the account.
      window.openDialog("chrome://castironthunderbirdclub/content/accountpref.xul",
                       "AccountPrefWindow",
                       "chrome, centerscreen, modal, resizable=yes",
                       account[sAccount]).focus();
      }
    pub.mailAccount.selectedIndex = 0;
  };

  pub.setPanelSettings = function(proxyname, color) {
    var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
             .getService(Components.interfaces.nsIWindowMediator)
             .getMostRecentWindow('mail:3pane');
    pub.myPanel = win.document.getElementById("torbirdy-my-panel");
    pub.myPanel.label = proxyname;
    pub.myPanel.style.color = color;
  };

  pub.resetAll = function() {
    pub.resetNetworkProxy();
    pub.setDefaultPrefs();
    pub.clearCustomPrefs();
    pub.restoreEnigmailPrefs();
  };

  pub.setPreferences = function(preference, value) {
    // Set the preferences both for Thunderbird and our custom branch.
    if (typeof value === "string") {
      pub.prefs.setCharPref(preference, value);
      pub.prefs.setCharPref(pub.customBranch + preference, value);
    }
    if (typeof value === "boolean") {
      pub.prefs.setBoolPref(preference, value);
      pub.prefs.setBoolPref(pub.customBranch + preference, value);
    }
    if (typeof value === "number") {
      pub.prefs.setIntPref(preference, value);
      pub.prefs.setIntPref(pub.customBranch + preference, value);
    }
  };

  pub.setProxyTor = function() {
    // Set Tor proxy
    pub.resetAll();

    pub.setPanelSettings(pub.strBundle.GetStringFromName("torbirdy.enabled.tor"), "green");
    pub.prefs.setIntPref(pub.prefBranch + 'proxy', 0);
  };

  pub.setProxyJonDo = function() {
    pub.resetNetworkProxy();
    pub.clearCustomPrefs();

    pub.setPreferences("network.proxy.socks", "127.0.0.1");
    pub.setPreferences("network.proxy.socks_port", 4001);

    // SSL.
    pub.setPreferences("network.proxy.ssl", "127.0.0.1");
    pub.setPreferences("network.proxy.ssl_port", 4001);
    // HTTP.
    pub.setPreferences("network.proxy.http", "127.0.0.1");
    pub.setPreferences("network.proxy.http_port", 4001);
    // Disable pipelining.
    pub.setPreferences("network.http.pipelining", false);
    pub.setPreferences("network.http.pipelining.ssl", false);
    pub.setPreferences("network.http.proxy.pipelining", false);
    // Enigmail.
    pub.setPreferences("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("jondo"));
    pub.updateKeyserver("jondo");

    pub.setPanelSettings(pub.strBundle.GetStringFromName("torbirdy.enabled.jondo"), "green");
    pub.prefs.setIntPref(pub.prefBranch + 'proxy', 1);
    pub.prefs.setIntPref(pub.prefBranch + 'proxy.type', 0);
  };

  pub.setProxyWhonix = function() {
    pub.resetAll();

    pub.setPreferences("network.proxy.socks", "10.152.152.10");
    pub.setPreferences("network.proxy.socks_port", 9102);

    pub.setPanelSettings(pub.strBundle.GetStringFromName("torbirdy.enabled.whonix"), "green");
    pub.prefs.setIntPref(pub.prefBranch + 'proxy', 1);
    pub.prefs.setIntPref(pub.prefBranch + 'proxy.type', 1);
  };

  pub.setProxyCustom = function() {
    pub.resetAll();

    var socksHost = pub.socksHost.value;
    var socksPort = pub.socksPort.value;

    // Set them now.
    pub.setPreferences("network.proxy.socks", socksHost);
    pub.setPreferences("network.proxy.socks_port", parseInt(socksPort, 10));

    pub.setPanelSettings(pub.strBundle.GetStringFromName("torbirdy.enabled.custom"), "green");
    pub.prefs.setIntPref(pub.prefBranch + 'proxy', 2);
  };

  pub.setProxyTransparent = function() {
    pub.setPreferences("network.proxy.type", 0);

    pub.setPanelSettings(pub.strBundle.GetStringFromName("torbirdy.enabled.torification"), "red");
    pub.prefs.setIntPref(pub.prefBranch + 'proxy', 3);
  };

  /*
   Save
  */

  pub.onAccept = function() {
    var index = pub.anonService.selectedIndex;

    // Default (recommended) settings for TorBirdy.
    if (index === 0) {
      // Set proxies for Tor.
      pub.setProxyTor();
    }

    // Anonymization service.
    if (index === 1) {
      var anonServiceType = pub.anonCustomService.selectedIndex;
      if (anonServiceType === 0 || typeof anonServiceType === "undefined") {
        // Set proxies for JonDo.
        pub.setProxyJonDo();
      }
      if (anonServiceType === 1) {
        // Set Whonix.
        pub.setProxyWhonix();
      }
    }

    // Custom proxy.
    if (index === 2) {
      pub.setProxyCustom();
    }

    // Transparent Anonymisation.
    if (index === 3) {
      // Disable the proxy.
      pub.setProxyTransparent();
    }

    /*
      Privacy
    */
    var idlePref = 'mail.server.default.use_idle';
    if (pub.imapIdle.checked) {
      pub.setPreferences(idlePref, true);
    }
    else {
      pub.setPreferences(idlePref, false);
    }

    // Last accessed folder.
    // default: false
    if (pub.startupFolder.checked) {
      pub.prefs.setBoolPref(pub.prefBranch + 'startup_folder', true);
    } else {
      pub.prefs.setBoolPref(pub.prefBranch + 'startup_folder', false);
    }

    // Time zone.
    // default: true
    var timezone = pub.timezone.checked;
    // Only update pub if required.
    if (timezone === pub.prefs.getBoolPref(pub.prefBranch + 'timezone')) {
        var env = Components.classes["@mozilla.org/process/environment;1"]
                                      .getService(Components.interfaces.nsIEnvironment);
        if (timezone) {
          pub.prefs.setBoolPref(pub.prefBranch + 'timezone', false);
          env.set('TZ', '');
        } else {
          pub.prefs.setBoolPref(pub.prefBranch + 'timezone', true);
          env.set('TZ', 'UTC');
        }

        // Ask the user to restart Thunderbird. We can't do pub for the user
        // because the environment variables are not reset without quitting
        // Thunderbird and starting it again.
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                        .getService(Components.interfaces.nsIPromptService);
        prompts.alert(null, pub.strBundle.GetStringFromName("torbirdy.name"),
                            pub.strBundle.GetStringFromName("torbirdy.restart"));
    }

    // Fetch all messages for all accounts.
    // default: false
    // Only change the state if it is required.
    if (pub.fetchAllMails.checked !== pub.prefs.getBoolPref(pub.prefBranch + 'fetchall')) {
      var accounts = pub.getAccount();
      if (pub.fetchAllMails.checked) {
        pub.prefs.setBoolPref(pub.prefBranch + 'fetchall', true);
        for (var i = 0; i < accounts.length; i++) {
          accounts[i].loginAtStartUp = true;
          accounts[i].doBiff = true;
        }
      }
      else {
        pub.prefs.setBoolPref(pub.prefBranch + 'fetchall', false);
        for (var i = 0; i < accounts.length; i++) {
          accounts[i].loginAtStartUp = false;
          accounts[i].doBiff = false;
        }
      }
    }

    // Enigmail.
    // --throw-keyids - default: false
    if (pub.enigmailKeyId.checked) {
      pub.prefs.setBoolPref(pub.prefBranch + 'enigmail.throwkeyid', true);
    }
    else {
      pub.prefs.setBoolPref(pub.prefBranch + 'enigmail.throwkeyid', false);
    }

    // Confirm before sending - default: false
    var enigmailConfirmPref = "extensions.enigmail.confirmBeforeSend";
    if (pub.enigmailConfirmEmail.checked) {
      pub.prefs.setBoolPref(enigmailConfirmPref, true);
      pub.prefs.setBoolPref(pub.prefBranch + 'enigmail.confirmemail', true);
    } else {
      pub.prefs.setBoolPref(enigmailConfirmPref, false);
      pub.prefs.setBoolPref(pub.prefBranch + 'enigmail.confirmemail', false);
    }

    // Thunderbird's email wizard - default: false
    if (pub.emailWizard.checked) {
      pub.prefs.setBoolPref(pub.prefBranch + 'emailwizard', true);
    } else {
      pub.prefs.setBoolPref(pub.prefBranch + 'emailwizard', false);
    }

    // Insecure renegotiation - default: false (opt-out for mailservers that do
    // not support secure renegotiation yet)
    var securityRenegotiation = 'security.ssl.require_safe_negotiation';
    var securityWarn = 'security.ssl.treat_unsafe_negotiation_as_broken';
    if (pub.secureRenegotiation.checked) {
      pub.setPreferences(securityRenegotiation, false);
      pub.setPreferences(securityWarn, false);
    } else {
      pub.clearSinglePref(securityRenegotiation);
      pub.clearSinglePref(securityWarn);
    }

    if (index === 1) {
      // JonDo.
      if (pub.anonCustomService.selectedIndex === 0) {
        pub.setPreferences("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("jondo"));
      }
      // Whonix.
      if (pub.anonCustomService.selectedIndex === 1) {
        pub.setPreferences("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("tor"));
      }
    }
    if (index === 0 || index === 2 || index === 3) {
      pub.setPreferences("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("tor"));
    }
  };

  /*
    Load
  */

  pub.onLoad = function() {
    // Proxy.
    pub.anonCustomService = document.getElementById('torbirdy-anonservice');
    pub.anonService = document.getElementById('torbirdy-proxy-settings');
    pub.anonType = document.getElementById('torbirdy-anon-settings');
    pub.socksHost = document.getElementById('torbirdy-socks-host');
    pub.socksPort = document.getElementById('torbirdy-socks-port');
    pub.torification = document.getElementById('torbirdy-torification');
    // Privacy.
    pub.mailAccount = document.getElementById('torbirdy-mail-accounts');
    pub.imapIdle = document.getElementById('torbirdy-idle');
    pub.startupFolder = document.getElementById('torbirdy-startup-folder');
    pub.timezone = document.getElementById('torbirdy-timezone');
    pub.emailWizard = document.getElementById('torbirdy-email-wizard');
    pub.fetchAllMails = document.getElementById('torbirdy-email-automatic');
    // Enigmail.
    pub.enigmailKeyId = document.getElementById('torbirdy-enigmail-throwkeyid');
    pub.enigmailKeyserver = document.getElementById('torbirdy-enigmail-keyserver');
    pub.enigmailConfirmEmail = document.getElementById('torbirdy-confirm-email');
    // Security.
    pub.secureRenegotiation = document.getElementById('torbirdy-renegotiation');

    // Make sure the user really wants to change these settings.
    var warnPrompt = pub.prefs.getBoolPref("extensions.torbirdy.warn");

    if (warnPrompt) {
      var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                              .getService(Components.interfaces.nsIPromptService);
      var check = {value: true};
      var result = prompts.confirmCheck(null, pub.strBundle.GetStringFromName('torbirdy.email.advanced.title'),
                                              pub.strBundle.GetStringFromName('torbirdy.email.advanced'),
                                              pub.strBundle.GetStringFromName('torbirdy.email.advanced.nextwarning'),
                                              check);
      if (!result) {
        window.close();
      } else {
        if (!check.value) {
          pub.prefs.setBoolPref("extensions.torbirdy.warn", false);
        }
      }
    }

    /*
     PROXY
    */
    // Load the preference values.
    var anonService = pub.prefs.getIntPref(pub.prefBranch + 'proxy');
    pub.anonService.selectedIndex = anonService;

    pub.socksHost.value = pub.prefs.getCharPref("network.proxy.socks");
    pub.socksPort.value = pub.prefs.getIntPref("network.proxy.socks_port");

    // Tor.
    if (anonService === 0) {
      pub.socksHost.value = '127.0.0.1';
      pub.socksPort.value = '9150';
    }

    // JonDo/Whonix.
    if (anonService === 1) {
      var anonCustomService = pub.prefs.getIntPref(pub.prefBranch + 'proxy.type');
      pub.anonType.disabled = false;
      pub.anonCustomService.disabled = false;
      pub.anonCustomService.selectedIndex = anonCustomService;
    }

    // Custom.
    if (anonService === 2) {
      var socksHost = pub.prefs.getCharPref(pub.customBranch + 'network.proxy.socks');
      var socksPort = pub.prefs.getIntPref(pub.customBranch + 'network.proxy.socks_port');

      pub.socksHost.value = socksHost;
      pub.socksPort.value = socksPort;
      // Enable the settings.
      pub.socksHost.disabled = false;
      pub.socksPort.disabled = false;
    }

    /*
     Privacy
    */
    // Global settings.
    // IDLE.
    var idlePref = pub.customBranch + 'mail.server.default.use_idle';
    if (pub.prefs.prefHasUserValue(idlePref)) {
      var idlePrefValue = pub.prefs.getBoolPref(idlePref);
    }
    if (idlePrefValue) {
      pub.imapIdle.checked = true;
    } else {
      pub.imapIdle.checked = false;
    }

    // Select last accessed folder.
    // default: false
    if (!pub.prefs.getBoolPref(pub.prefBranch + 'startup_folder')) {
      pub.startupFolder.checked = false;
    } else {
      pub.startupFolder.checked = true;
    }

    // Time zone settings.
    // default: true
    if (pub.prefs.getBoolPref(pub.prefBranch + 'timezone')) {
      pub.timezone.checked = false;
    } else {
      pub.timezone.checked = true;
    }

    // Fetch all messages for all accounts.
    // default: false
    if (pub.prefs.getBoolPref(pub.prefBranch + 'fetchall')) {
      pub.fetchAllMails.checked = true;
    } else {
      pub.fetchAllMails.checked = false;
    }

    // Enigmal settings
    // --throw-keyids - default: false
    if (pub.prefs.getBoolPref(pub.prefBranch + 'enigmail.throwkeyid')) {
      pub.enigmailKeyId.checked = true;
    } else {
      pub.enigmailKeyId.checked = false;
    }

    // Confirm before sending - default: false
    if (pub.prefs.getBoolPref(pub.prefBranch + 'enigmail.confirmemail')) {
      pub.enigmailConfirmEmail.checked = true;
    } else {
      pub.enigmailConfirmEmail.checked = false;
    }

    // Keyserver.
    var enigmailKeyserver = pub.customBranch + 'extensions.enigmail.keyserver';
    if (pub.prefs.prefHasUserValue(enigmailKeyserver)) {
      pub.enigmailKeyserver.value = pub.prefs.getCharPref(enigmailKeyserver);
    } else {
      pub.enigmailKeyserver.value = pub.prefs.getCharPref('extensions.enigmail.keyserver');
    }

    // Thunderbird's email wizard - default: false
    if (pub.prefs.getBoolPref(pub.prefBranch + 'emailwizard')) {
      pub.emailWizard.checked = true;
    } else {
      pub.emailWizard.checked = false;
    }

    /*
     Security
    */
    // Allow insecure renegotiation - default: false
    if (pub.prefs.prefHasUserValue(pub.customBranch + 'security.ssl.require_safe_negotiation')) {
      pub.secureRenegotiation.checked = true;
    } else {
      pub.secureRenegotiation.checked = false;
    }

    // Load the email accounts.
    var accounts = pub.getAccount();
    if (accounts.length !== 0) {
      pub.mailAccount.appendItem('...', 'select-account');
      for (var i = 0; i < accounts.length; i++) {
        pub.mailAccount.appendItem(accounts[i].prettyName, accounts[i].key, accounts[i].type.toUpperCase());
      }
      pub.mailAccount.selectedIndex = 0;
    } else {
        pub.mailAccount.disabled = true;
        pub.mailAccount.appendItem('No email accounts found');
        pub.mailAccount.selectedIndex = 0;
    }
  };

  pub.displayTestPage = function(service) {
    Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).
              getMostRecentWindow("mail:3pane").
              document.getElementById("tabmail").
              openTab("contentTab", {contentPage: service});
  };

  pub.testSettings = function() {
    pub.onAccept();
    var index = pub.anonService.selectedIndex;
    var anonCustomService = pub.anonCustomService.selectedIndex;

    if ((index === 1) && (anonCustomService === 0 || typeof anonCustomService === "undefined")) {
        // Use "http://ip-check.info/tb.php?lang=en" for JonDo.
        pub.displayTestPage("https://ip-check.info/tb.php?lang=en");
    } else {
        pub.displayTestPage("https://check.torproject.org/");
    }
  };

  pub.restoreDefaults = function() {
    // Set the values to their default state.
    pub.anonService.selectedIndex = 0;
    pub.timezone.checked = false;
    pub.enigmailKeyId.checked = false;
    pub.enigmailConfirmEmail.checked = false;
    pub.emailWizard.checked = false;
    pub.secureRenegotiation.checked = false;
    pub.imapIdle.checked = false;
    pub.startupFolder.checked = false;
    pub.fetchAllMails.checked = false;
    // Save the settings and close the window.
    pub.checkSetting();
    pub.onAccept();
  };

  return pub;
};
