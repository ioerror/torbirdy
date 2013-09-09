if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

if (!org.torbirdy.prefs) org.torbirdy.prefs = {

  prefBranch: "extensions.torbirdy.",
  customBranch: "extensions.torbirdy.custom.",

  torKeyserver: "hkp://2eghzlv2wwcq7u7y.onion",
  jondoKeyserver: "hkp://pool.sks-keyservers.net",

  prefs: Components.classes["@mozilla.org/preferences-service;1"]
                   .getService(Components.interfaces.nsIPrefBranch),

  torBirdyPref: Components.classes["@mozilla.org/preferences-service;1"]
                          .getService(Components.interfaces.nsIPrefService).getBranch(this.customBranch),

  acctMgr: Components.classes["@mozilla.org/messenger/account-manager;1"]
                     .getService(Components.interfaces.nsIMsgAccountManager),

  strBundle: Components.classes["@mozilla.org/intl/stringbundle;1"]
                       .getService(Components.interfaces.nsIStringBundleService)
                       .createBundle("chrome://castironthunderbirdclub/locale/torbirdy.properties"),

  setDefaultPrefs: function() {
    this.prefs.setCharPref("network.proxy.socks", "127.0.0.1");
    this.prefs.setIntPref("network.proxy.socks_port", 9150);
    this.prefs.clearUserPref("network.proxy.http");
    this.prefs.clearUserPref("network.proxy.http_port");
    this.prefs.clearUserPref("network.proxy.ssl");
    this.prefs.clearUserPref("network.proxy.ssl_port");
  },

  resetNetworkProxy: function() {
    this.prefs.setIntPref("network.proxy.type", 1);
  },

  setEnigmailPrefs: function(anonService) {
    if (this.prefs.getBoolPref("extensions.torbirdy.enigmail.throwkeyid")) {
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
  },

  updateKeyserver: function(anonService) {
    var extension = "extensions.enigmail.keyserver";
    var keyserver = this.enigmailKeyserver;
    if (typeof keyserver === "undefined") {
      var keyserverValue = (anonService === "tor") ? this.torKeyserver : this.jondoKeyserver;
    } else {
      var keyserverValue = keyserver.value;
    }
    if (anonService === "tor") {
      this.setPreferences(extension, keyserverValue);
    }
    if (anonService === "jondo") {
      this.setPreferences(extension, keyserverValue);
    }
  },

  restoreEnigmailPrefs: function() {
    this.prefs.setCharPref("extensions.enigmail.agentAdditionalParam", this.setEnigmailPrefs("tor"));
    this.updateKeyserver("tor");
  },

  clearCustomPrefs: function() {
    var customPrefs = this.torBirdyPref.getChildList("", {});
    for (var i = 0; i < customPrefs.length; i++) {
      this.prefs.clearUserPref(this.customBranch + customPrefs[i]);
    }
  },

  clearSinglePref: function(pref) {
    this.prefs.clearUserPref(this.customBranch + pref);
  },

  fetchAllMessages: function() {
    if (this.fetchAllMails.checked) {
      this.imapIdle.checked = true;
      this.startupFolder.checked = true;
    }
    else {
      this.imapIdle.checked = false;
      this.startupFolder.checked = false;
    }
  },

  checkSetting: function() {
    var index = this.anonService.selectedIndex;
    if (index === 2) {
      this.socksHost.disabled = false;
      this.socksPort.disabled = false;
    }
    else {
      this.socksHost.disabled = true;
      this.socksPort.disabled = true;
    }

    if (index === 1) {
      this.anonCustomService.disabled = false;
      var service = this.anonCustomService.selectedIndex;
      if (this.anonCustomService.selectedIndex === 0) {
        this.enigmailKeyserver.value = this.jondoKeyserver;
      }
      if (this.anonCustomService.selectedIndex === 1) {
        this.enigmailKeyserver.value = this.torKeyserver;
      }
    } else {
      this.anonCustomService.disabled = true;
    }
    if (index === 0 || index === 2 || index === 3) {
      this.enigmailKeyserver.value = this.torKeyserver;
    }
  },

  getAccount: function() {
    var mailAccounts = [];
    var accounts = this.acctMgr.accounts;
    for (var i = 0; i < accounts.Count(); i++) {
      var account = accounts.QueryElementAt(i, Components.interfaces.nsIMsgAccount).incomingServer;
      var name = account.prettyName;
      if (!(name === "Local Folders")) {
        mailAccounts.push(account);
      }
    }
    return mailAccounts;
  },

  selectMailAccount: function() {
    var index = this.mailAccount.selectedIndex;

    if (!(index === 0)) {
      // For email accounts, configure accordingly.
      var sAccount = null;
      var account = this.getAccount();
      for (var i = 0; i < account.length; i++) {
        if (account[i].key === this.mailAccount.value) {
          sAccount = i;
        }
      }
      // Configure the account.
      window.openDialog("chrome://castironthunderbirdclub/content/accountpref.xul",
                       "AccountPrefWindow",
                       "chrome, centerscreen, modal, resizable=yes",
                       account[sAccount]).focus();
      }
    this.mailAccount.selectedIndex = 0;
  },

  setPanelSettings: function(proxyname, color) {
    var win = Components.classes['@mozilla.org/appshell/window-mediator;1']
             .getService(Components.interfaces.nsIWindowMediator)
             .getMostRecentWindow('mail:3pane');
    this.myPanel = win.document.getElementById("torbirdy-my-panel");
    this.myPanel.label = proxyname;
    this.myPanel.style.color = color;
  },

  resetAll: function() {
    this.resetNetworkProxy();
    this.setDefaultPrefs();
    this.clearCustomPrefs();
    this.restoreEnigmailPrefs();
  },

  setPreferences: function(preference, value) {
    // Set the preferences both for Thunderbird and our custom branch.
    if (typeof value === "string") {
      this.prefs.setCharPref(preference, value);
      this.prefs.setCharPref(this.customBranch + preference, value);
    }
    if (typeof value === "boolean") {
      this.prefs.setBoolPref(preference, value);
      this.prefs.setBoolPref(this.customBranch + preference, value);
    }
    if (typeof value === "number") {
      this.prefs.setIntPref(preference, value);
      this.prefs.setIntPref(this.customBranch + preference, value);
    }
  },

  setProxyTor: function() {
    // Set Tor proxy
    this.resetAll();

    this.setPanelSettings(this.strBundle.GetStringFromName("torbirdy.enabled.tor"), "green");
    this.prefs.setIntPref(this.prefBranch + 'proxy', 0);
  },

  setProxyJonDo: function() {
    this.resetNetworkProxy();
    this.clearCustomPrefs();

    this.setPreferences("network.proxy.socks", "127.0.0.1");
    this.setPreferences("network.proxy.socks_port", 4001);

    // SSL.
    this.setPreferences("network.proxy.ssl", "127.0.0.1");
    this.setPreferences("network.proxy.ssl_port", 4001);
    // HTTP.
    this.setPreferences("network.proxy.http", "127.0.0.1");
    this.setPreferences("network.proxy.http_port", 4001);
    // Disable pipelining.
    this.setPreferences("network.http.pipelining", false);
    this.setPreferences("network.http.pipelining.ssl", false);
    this.setPreferences("network.http.proxy.pipelining", false);
    // Enigmail.
    this.setPreferences("extensions.enigmail.agentAdditionalParam", this.setEnigmailPrefs("jondo"));
    this.updateKeyserver("jondo");

    this.setPanelSettings(this.strBundle.GetStringFromName("torbirdy.enabled.jondo"), "green");
    this.prefs.setIntPref(this.prefBranch + 'proxy', 1);
    this.prefs.setIntPref(this.prefBranch + 'proxy.type', 0);
  },

  setProxyWhonix: function() {
    this.resetAll();

    this.setPreferences("network.proxy.socks", "192.168.0.10");
    this.setPreferences("network.proxy.socks_port", 9102);

    this.setPanelSettings(this.strBundle.GetStringFromName("torbirdy.enabled.whonix"), "green");
    this.prefs.setIntPref(this.prefBranch + 'proxy', 1);
    this.prefs.setIntPref(this.prefBranch + 'proxy.type', 1);
  },

  setProxyCustom: function() {
    this.resetAll();

    var socksHost = this.socksHost.value;
    var socksPort = this.socksPort.value;

    // Set them now.
    this.setPreferences("network.proxy.socks", socksHost);
    this.setPreferences("network.proxy.socks_port", parseInt(socksPort, 10));

    this.setPanelSettings(this.strBundle.GetStringFromName("torbirdy.enabled.custom"), "green");
    this.prefs.setIntPref(this.prefBranch + 'proxy', 2);
  },

  setProxyTransparent: function() {
    this.setPreferences("network.proxy.type", 0);

    this.setPanelSettings(this.strBundle.GetStringFromName("torbirdy.enabled.torification"), "red");
    this.prefs.setIntPref(this.prefBranch + 'proxy', 3);
  },

  /*
   Save
  */

  onAccept: function() {
    var index = this.anonService.selectedIndex;

    // Default (recommended) settings for TorBirdy.
    if (index === 0) {
      // Set proxies for Tor.
      this.setProxyTor();
    }

    // Anonymization service.
    if (index === 1) {
      var anonServiceType = this.anonCustomService.selectedIndex;
      if (anonServiceType === 0 || typeof anonServiceType === "undefined") {
        // Set proxies for JonDo.
        this.setProxyJonDo();
      }
      if (anonServiceType === 1) {
        // Set Whonix.
        this.setProxyWhonix();
      }
    }

    // Custom proxy.
    if (index === 2) {
      this.setProxyCustom();
    }

    // Transparent Anonymisation.
    if (index === 3) {
      // Disable the proxy.
      this.setProxyTransparent();
    }

    /*
      Privacy
    */
    var idlePref = 'mail.server.default.use_idle';
    if (this.imapIdle.checked) {
      this.setPreferences(idlePref, true);
    }
    else {
      this.setPreferences(idlePref, false);
    }

    // Last accessed folder.
    // default: false
    if (this.startupFolder.checked) {
      this.prefs.setBoolPref(this.prefBranch + 'startup_folder', true);
    } else {
      this.prefs.setBoolPref(this.prefBranch + 'startup_folder', false);
    }

    // Time zone.
    // default: true
    var timezone = this.timezone.checked;
    // Only update this if required.
    if (timezone === this.prefs.getBoolPref(this.prefBranch + 'timezone')) {
        var env = Components.classes["@mozilla.org/process/environment;1"]
                                      .getService(Components.interfaces.nsIEnvironment);
        if (timezone) {
          this.prefs.setBoolPref(this.prefBranch + 'timezone', false);
          env.set('TZ', '');
        } else {
          this.prefs.setBoolPref(this.prefBranch + 'timezone', true);
          env.set('TZ', 'UTC');
        }

        // Ask the user to restart Thunderbird. We can't do this for the user
        // because the environment variables are not reset without quitting
        // Thunderbird and starting it again.
        var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                                        .getService(Components.interfaces.nsIPromptService);
        prompts.alert(null, this.strBundle.GetStringFromName("torbirdy.name"),
                            this.strBundle.GetStringFromName("torbirdy.restart"));
    }

    // Fetch all messages for all accounts.
    // default: false
    // Only change the state if it is required.
    if (this.fetchAllMails.checked !== this.prefs.getBoolPref(this.prefBranch + 'fetchall')) {
      var accounts = this.getAccount();
      if (this.fetchAllMails.checked) {
        this.prefs.setBoolPref(this.prefBranch + 'fetchall', true);
        for (var i = 0; i < accounts.length; i++) {
          accounts[i].loginAtStartUp = true;
          accounts[i].doBiff = true;
        }
      }
      else {
        this.prefs.setBoolPref(this.prefBranch + 'fetchall', false);
        for (var i = 0; i < accounts.length; i++) {
          accounts[i].loginAtStartUp = false;
          accounts[i].doBiff = false;
        }
      }
    }

    // Enigmail.
    // --throw-keyids - default: false
    if (this.enigmailKeyId.checked) {
      this.prefs.setBoolPref(this.prefBranch + 'enigmail.throwkeyid', true);
    }
    else {
      this.prefs.setBoolPref(this.prefBranch + 'enigmail.throwkeyid', false);
    }

    // Confirm before sending - default: false
    var enigmailConfirmPref = "extensions.enigmail.confirmBeforeSend";
    if (this.enigmailConfirmEmail.checked) {
      this.prefs.setBoolPref(enigmailConfirmPref, true);
      this.prefs.setBoolPref(this.prefBranch + 'enigmail.confirmemail', true);
    } else {
      this.prefs.setBoolPref(enigmailConfirmPref, false);
      this.prefs.setBoolPref(this.prefBranch + 'enigmail.confirmemail', false);
    }

    // Thunderbird's email wizard - default: false
    if (this.emailWizard.checked) {
      this.prefs.setBoolPref(this.prefBranch + 'emailwizard', true);
    } else {
      this.prefs.setBoolPref(this.prefBranch + 'emailwizard', false);
    }

    // Insecure renegotiation - default: false (opt-out for mailservers that do
    // not support secure renegotiation yet)
    var securityRenegotiation = 'security.ssl.require_safe_negotiation';
    var securityWarn = 'security.ssl.treat_unsafe_negotiation_as_broken';
    if (this.secureRenegotiation.checked) {
      this.setPreferences(securityRenegotiation, false);
      this.setPreferences(securityWarn, false);
    } else {
      this.clearSinglePref(securityRenegotiation);
      this.clearSinglePref(securityWarn);
    }

    if (index === 1) {
      // JonDo.
      if (this.anonCustomService.selectedIndex === 0) {
        this.setPreferences("extensions.enigmail.agentAdditionalParam", this.setEnigmailPrefs("jondo"));
      }
      // Whonix.
      if (this.anonCustomService.selectedIndex === 1) {
        this.setPreferences("extensions.enigmail.agentAdditionalParam", this.setEnigmailPrefs("tor"));
      }
    }
    if (index === 0 || index === 2 || index === 3) {
      this.setPreferences("extensions.enigmail.agentAdditionalParam", this.setEnigmailPrefs("tor"));
    }
  },

  /*
    Load
  */

  onLoad: function() {
    // Proxy.
    this.anonCustomService = document.getElementById('torbirdy-anonservice');
    this.anonService = document.getElementById('torbirdy-proxy-settings');
    this.anonType = document.getElementById('torbirdy-anon-settings');
    this.socksHost = document.getElementById('torbirdy-socks-host');
    this.socksPort = document.getElementById('torbirdy-socks-port');
    this.torification = document.getElementById('torbirdy-torification');
    // Privacy.
    this.mailAccount = document.getElementById('torbirdy-mail-accounts');
    this.imapIdle = document.getElementById('torbirdy-idle');
    this.startupFolder = document.getElementById('torbirdy-startup-folder');
    this.timezone = document.getElementById('torbirdy-timezone');
    this.emailWizard = document.getElementById('torbirdy-email-wizard');
    this.fetchAllMails = document.getElementById('torbirdy-email-automatic');
    // Enigmail.
    this.enigmailKeyId = document.getElementById('torbirdy-enigmail-throwkeyid');
    this.enigmailKeyserver = document.getElementById('torbirdy-enigmail-keyserver');
    this.enigmailConfirmEmail = document.getElementById('torbirdy-confirm-email');
    // Security.
    this.secureRenegotiation = document.getElementById('torbirdy-renegotiation');

    // Make sure the user really wants to change these settings.
    var warnPrompt = this.prefs.getBoolPref("extensions.torbirdy.warn");

    if (warnPrompt) {
      var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                              .getService(Components.interfaces.nsIPromptService);
      var check = {value: true};
      var result = prompts.confirmCheck(null, this.strBundle.GetStringFromName('torbirdy.email.advanced.title'),
                                              this.strBundle.GetStringFromName('torbirdy.email.advanced'),
                                              this.strBundle.GetStringFromName('torbirdy.email.advanced.nextwarning'),
                                              check);
      if (!result) {
        window.close();
      } else {
        if (!check.value) {
          this.prefs.setBoolPref("extensions.torbirdy.warn", false);
        }
      }
    }

    /*
     PROXY
    */
    // Load the preference values.
    var anonService = this.prefs.getIntPref(this.prefBranch + 'proxy');
    this.anonService.selectedIndex = anonService;

    this.socksHost.value = this.prefs.getCharPref("network.proxy.socks");
    this.socksPort.value = this.prefs.getIntPref("network.proxy.socks_port");

    // Tor.
    if (anonService === 0) {
      this.socksHost.value = '127.0.0.1';
      this.socksPort.value = '9150';
    }

    // JonDo/Whonix.
    if (anonService === 1) {
      var anonCustomService = this.prefs.getIntPref(this.prefBranch + 'proxy.type');
      this.anonType.disabled = false;
      this.anonCustomService.disabled = false;
      this.anonCustomService.selectedIndex = anonCustomService;
    }

    // Custom.
    if (anonService === 2) {
      var socksHost = this.prefs.getCharPref(this.customBranch + 'network.proxy.socks');
      var socksPort = this.prefs.getIntPref(this.customBranch + 'network.proxy.socks_port');

      this.socksHost.value = socksHost;
      this.socksPort.value = socksPort;
      // Enable the settings.
      this.socksHost.disabled = false;
      this.socksPort.disabled = false;
    }

    /*
     Privacy
    */
    // Global settings.
    // IDLE.
    var idlePref = this.customBranch + 'mail.server.default.use_idle';
    if (this.prefs.prefHasUserValue(idlePref)) {
      var idlePrefValue = this.prefs.getBoolPref(idlePref);
    }
    if (idlePrefValue) {
      this.imapIdle.checked = true;
    } else {
      this.imapIdle.checked = false;
    }

    // Select last accessed folder.
    // default: false
    if (!this.prefs.getBoolPref(this.prefBranch + 'startup_folder')) {
      this.startupFolder.checked = false;
    } else {
      this.startupFolder.checked = true;
    }

    // Time zone settings.
    // default: true
    if (this.prefs.getBoolPref(this.prefBranch + 'timezone')) {
      this.timezone.checked = false;
    } else {
      this.timezone.checked = true;
    }

    // Fetch all messages for all accounts.
    // default: false
    if (this.prefs.getBoolPref(this.prefBranch + 'fetchall')) {
      this.fetchAllMails.checked = true;
    } else {
      this.fetchAllMails.checked = false;
    }

    // Enigmal settings
    // --throw-keyids - default: false
    if (this.prefs.getBoolPref(this.prefBranch + 'enigmail.throwkeyid')) {
      this.enigmailKeyId.checked = true;
    } else {
      this.enigmailKeyId.checked = false;
    }

    // Confirm before sending - default: false
    if (this.prefs.getBoolPref(this.prefBranch + 'enigmail.confirmemail')) {
      this.enigmailConfirmEmail.checked = true;
    } else {
      this.enigmailConfirmEmail.checked = false;
    }

    // Keyserver.
    var enigmailKeyserver = this.customBranch + 'extensions.enigmail.keyserver';
    if (this.prefs.prefHasUserValue(enigmailKeyserver)) {
      this.enigmailKeyserver.value = this.prefs.getCharPref(enigmailKeyserver);
    } else {
      this.enigmailKeyserver.value = this.prefs.getCharPref('extensions.enigmail.keyserver');
    }

    // Thunderbird's email wizard - default: false
    if (this.prefs.getBoolPref(this.prefBranch + 'emailwizard')) {
      this.emailWizard.checked = true;
    } else {
      this.emailWizard.checked = false;
    }

    /*
     Security
    */
    // Allow insecure renegotiation - default: false
    if (this.prefs.prefHasUserValue(this.customBranch + 'security.ssl.require_safe_negotiation')) {
      this.secureRenegotiation.checked = true;
    } else {
      this.secureRenegotiation.checked = false;
    }

    // Load the email accounts.
    var accounts = this.getAccount();
    if (accounts.length !== 0) {
      this.mailAccount.appendItem('...', 'select-account');
      for (var i = 0; i < accounts.length; i++) {
        this.mailAccount.appendItem(accounts[i].prettyName, accounts[i].key, accounts[i].type.toUpperCase());
      }
      this.mailAccount.selectedIndex = 0;
    } else {
        this.mailAccount.disabled = true;
        this.mailAccount.appendItem('No email accounts found');
        this.mailAccount.selectedIndex = 0;
    }
  },

  displayTestPage: function(service) {
    Components.classes['@mozilla.org/appshell/window-mediator;1'].getService(Components.interfaces.nsIWindowMediator).
              getMostRecentWindow("mail:3pane").
              document.getElementById("tabmail").
              openTab("contentTab", {contentPage: service});
  },

  testSettings: function() {
    this.onAccept();
    var index = this.anonService.selectedIndex;
    var anonCustomService = this.anonCustomService.selectedIndex;

    if ((index === 1) && (anonCustomService === 0 || typeof anonCustomService === "undefined")) {
        // Use "http://ip-check.info/tb.php?lang=en" for JonDo.
        this.displayTestPage("https://ip-check.info/tb.php?lang=en");
    } else {
        this.displayTestPage("https://check.torproject.org/");
    }
  },

  restoreDefaults: function() {
    // Set the values to their default state.
    this.anonService.selectedIndex = 0;
    this.timezone.checked = false;
    this.enigmailKeyId.checked = false;
    this.enigmailConfirmEmail.checked = false;
    this.emailWizard.checked = false;
    this.secureRenegotiation.checked = false;
    this.imapIdle.checked = false;
    this.startupFolder.checked = false;
    this.fetchAllMails.checked = false;
    // Save the settings and close the window.
    this.checkSetting();
    this.onAccept();
  }

};
