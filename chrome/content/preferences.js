const Ci = Components.interfaces;
const Cc = Components.classes;

if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

org.torbirdy.prefs = new function() {
  var pub = {};

  pub.prefBranch = "extensions.torbirdy.";
  pub.customBranch = "extensions.torbirdy.custom.";

  pub.prefs = Cc["@mozilla.org/preferences-service;1"]
                  .getService(Ci.nsIPrefBranch);

  pub.torBirdyPref = Cc["@mozilla.org/preferences-service;1"]
                         .getService(Ci.nsIPrefService).getBranch(pub.customBranch);

  pub.acctMgr = Cc["@mozilla.org/messenger/account-manager;1"]
                    .getService(Ci.nsIMsgAccountManager);

  var bundles = Cc["@mozilla.org/intl/stringbundle;1"]
                        .getService(Ci.nsIStringBundleService);
  pub.strbundle = bundles.createBundle("chrome://castironthunderbirdclub/locale/torbirdy.properties");

  pub.setDefaultPrefs = function() {
    pub.prefs.setCharPref("network.proxy.socks", "127.0.0.1");
    pub.prefs.setIntPref("network.proxy.socks_port", 9050);
    pub.prefs.clearUserPref("network.proxy.http");
    pub.prefs.clearUserPref("network.proxy.http_port");
    pub.prefs.clearUserPref("network.proxy.ssl");
    pub.prefs.clearUserPref("network.proxy.ssl_port");
  };

  pub.setEnigmailPrefs = function(anonService) {
    if (pub.prefs.getBoolPref("extensions.torbirdy.enigmail.throwkeyid")) {
      if (anonService === "tor") {
        return "--no-emit-version " +
               "--no-comments " +
               "--throw-keyids " +
               "--display-charset utf-8 " +
               "--keyserver-options http-proxy=http://127.0.0.1:8118 " +
               "--keyserver hkp://2eghzlv2wwcq7u7y.onion";
      }
      if (anonService === "jondo") {
        return "--no-emit-version " +
               "--no-comments " +
               "--throw-keyids " +
               "--display-charset utf-8 " +
               "--keyserver-options http-proxy=http://127.0.0.1:4001";
      }
    } else {
      if (anonService === "tor") {
        return "--no-emit-version " +
               "--no-comments " +
               "--display-charset utf-8 " +
               "--keyserver-options http-proxy=http://127.0.0.1:8118 " +
               "--keyserver hkp://2eghzlv2wwcq7u7y.onion";
      }
      if (anonService === "jondo") {
        return "--no-emit-version " +
               "--no-comments " +
               "--display-charset utf-8 " +
               "--keyserver-options http-proxy=http://127.0.0.1:4001";
      }
    }
  };

  pub.restoreEnigmailPrefs = function() {
    pub.prefs.setCharPref("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("tor"));
  };

  pub.clearCustomPrefs = function() {
    var customPrefs = pub.torBirdyPref.getChildList("", {});
    for (var i = 0; i < customPrefs.length; i++) {
      pub.prefs.clearUserPref(pub.customBranch + customPrefs[i]);
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
    } else {
      pub.anonCustomService.disabled = true;
    }
  };

  pub.getAccount = function() {
    var mailAccounts = [];
    var accounts = pub.acctMgr.accounts;
    for (var i = 0; i < accounts.Count(); i++) {
      var account = accounts.QueryElementAt(i, Ci.nsIMsgAccount).incomingServer;
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

  pub.onAccept = function() {
    var win = Cc['@mozilla.org/appshell/window-mediator;1']
                .getService(Ci.nsIWindowMediator)
                .getMostRecentWindow('mail:3pane');
    var myPanel = win.document.getElementById("torbirdy-my-panel");

    var index = pub.anonService.selectedIndex;

    // Default (recommended) settings for TorBirdy.
    if (index === 0) {
      // Set proxies for Tor.
      pub.setDefaultPrefs();
      pub.clearCustomPrefs();
      pub.restoreEnigmailPrefs();
      myPanel.label = pub.strbundle.GetStringFromName("torbirdy.enabled.tor");
    }
    
    // Anonymization service.
    if (index === 1) {
      pub.clearCustomPrefs();
      var anonType = pub.anonType.selectedIndex;
      if (anonType === 0 || typeof anonType === "undefined") {
        //
        // First set the preferences immediately.
        pub.prefs.setIntPref("network.proxy.socks_port", 4001);
        // SSL.
        pub.prefs.setCharPref("network.proxy.ssl", "127.0.0.1");
        pub.prefs.setIntPref("network.proxy.ssl_port", 4001);
        // HTTP.
        pub.prefs.setCharPref("network.proxy.http", "127.0.0.1");
        pub.prefs.setIntPref("network.proxy.http_port", 4001);

        pub.prefs.setCharPref("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("jondo"));
        // Now save them for later use.
        pub.prefs.setIntPref(pub.customBranch + "network.proxy.socks_port", 4001);
        // SSL.
        pub.prefs.setCharPref(pub.customBranch + "network.proxy.ssl", "127.0.0.1");
        pub.prefs.setIntPref(pub.customBranch + "network.proxy.ssl_port", 4001);
        // HTTP.
        pub.prefs.setCharPref(pub.customBranch + "network.proxy.http", "127.0.0.1");
        pub.prefs.setIntPref(pub.customBranch + "network.proxy.http_port", 4001);

        pub.prefs.setCharPref(pub.customBranch + "extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("jondo"));
        myPanel.label = pub.strbundle.GetStringFromName("torbirdy.enabled.jondo");
      }
      pub.prefs.setIntPref(pub.prefBranch + 'proxy.type', anonType);
    }

    // Custom proxy.
    if (index === 2) {
      pub.setDefaultPrefs();
      pub.restoreEnigmailPrefs();
      var socks_host = pub.socksHost.value;
      var socks_port = pub.socksPort.value;

      // Set them now.
      pub.prefs.setCharPref("network.proxy.socks", socks_host);
      pub.prefs.setIntPref("network.proxy.socks_port", socks_port);
      // Later use.
      pub.prefs.setCharPref(pub.customBranch + "network.proxy.socks", socks_host);
      pub.prefs.setIntPref(pub.customBranch + "network.proxy.socks_port", socks_port);
      myPanel.label = pub.strbundle.GetStringFromName("torbirdy.enabled.custom");
    }
    pub.prefs.setIntPref(pub.prefBranch + 'proxy', index);

    /*
      Privacy
    */
    var idlePref = 'mail.server.default.use_idle';
    var idle = pub.idle.checked; 
    if (idle) {
      pub.prefs.setBoolPref(pub.customBranch + idlePref, true);
      pub.prefs.setBoolPref(idlePref, true);
    }
    else {
      pub.prefs.setBoolPref(pub.customBranch + idlePref, false);
      pub.prefs.setBoolPref(idlePref, false);
    }

    // Last accessed folder.
    var startupFolder = pub.startupFolder.checked; 
    if (startupFolder) { 
      pub.prefs.setBoolPref(pub.prefBranch + 'startup_folder', true);
    } else {
      pub.prefs.setBoolPref(pub.prefBranch + 'startup_folder', false);
    }

    // Enigmail.
    var enigmail = pub.enigmail.checked;
    if (enigmail) {
      pub.prefs.setBoolPref(pub.prefBranch + 'enigmail.throwkeyid', false);
    }
    else {
      pub.prefs.setBoolPref(pub.prefBranch + 'enigmail.throwkeyid', true);
    }
    if (index === 1) {
      pub.prefs.setCharPref("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("jondo"));
      pub.prefs.setCharPref(pub.customBranch + "extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("jondo"));
    }
    if (index === 0) {
      pub.prefs.setCharPref("extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("tor"));
      pub.prefs.setCharPref(pub.customBranch + "extensions.enigmail.agentAdditionalParam", pub.setEnigmailPrefs("tor"));
    }
  };

  pub.onLoad = function() {
    pub.anonService = document.getElementById('torbirdy-proxy-settings');
    pub.socksHost = document.getElementById('torbirdy-socks-host');
    pub.socksPort = document.getElementById('torbirdy-socks-port');
    pub.mailAccount = document.getElementById('torbirdy-mail-accounts');
    pub.anonType = document.getElementById('torbirdy-anon-settings');
    pub.idle = document.getElementById('torbirdy-idle');
    pub.startupFolder = document.getElementById('torbirdy-startup-folder');
    pub.anonCustomService = document.getElementById('torbirdy-anonservice');
    pub.enigmail = document.getElementById('torbirdy-enigmail-throwkeyid');

    // Make sure the user really wants to change these settings.
    var warnPrompt = pub.prefs.getBoolPref("extensions.torbirdy.warn");

    if (warnPrompt) {
      var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                              .getService(Ci.nsIPromptService);
      var check = {value: true};
      var result = prompts.confirmCheck(null, pub.strbundle.GetStringFromName('torbirdy.email.advanced.title'),
                                              pub.strbundle.GetStringFromName('torbirdy.email.advanced'),
                                              pub.strbundle.GetStringFromName('torbirdy.email.advanced.nextwarning'),
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

    if (anonService === 0) {
      pub.socksHost.value = '127.0.0.1';
      pub.socksPort.value = '9050';
    }

    if (anonService === 1) {
      var anonType = pub.prefs.getIntPref(pub.prefBranch + 'proxy.type');
      pub.anonCustomService.disabled = false;
      pub.anonType.selectedIndex = anonType;
    }
    if (anonService === 2) {
      var socks_host = pub.prefs.getCharPref(pub.customBranch + 'network.proxy.socks');
      var socks_port = pub.prefs.getIntPref(pub.customBranch + 'network.proxy.socks_port');

      pub.socksHost.value = socks_host;
      pub.socksPort.value = socks_port;
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
      pub.idle.checked = true;
    } else {
      pub.idle.checked = false;
    }
    
    // Select last accessed folder.
    var startupPref = pub.prefs.getBoolPref(pub.prefBranch + 'startup_folder');
    if (!startupPref) {
      pub.startupFolder.checked = false;
    } else {
      pub.startupFolder.checked = true;
    }

    // Enigmal settings.
    var enigmail_throwkeyid = pub.prefs.getBoolPref(pub.prefBranch + 'enigmail.throwkeyid');
    if (enigmail_throwkeyid) {
      pub.enigmail.checked = false;
    } else {
      pub.enigmail.checked = true;
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
    Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator).
              getMostRecentWindow("mail:3pane").
              document.getElementById("tabmail").
              openTab("contentTab", {contentPage: service});
  },

  pub.testSettings = function() {
    pub.onAccept();
    var index = pub.anonService.selectedIndex;
    var anonType = pub.anonType.selectedIndex;

    if ((index === 1) && (anonType === 0 || typeof anonType === "undefined")) {
        // Use "http://ip-check.info/tb.php?lang=en" for JonDo.
        pub.displayTestPage("https://ip-check.info/tb.php?lang=en");
    } else {
        pub.displayTestPage("https://check.torproject.org/");
    }
  };

  return pub;
};
