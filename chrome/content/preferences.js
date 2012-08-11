const Ci = Components.interfaces;
const Cc = Components.classes;

const PREF_BRANCH = "extensions.torbirdy.";
const CUSTOM_BRANCH = "extensions.torbirdy.custom.";

var prefs = Cc["@mozilla.org/preferences-service;1"]
                .getService(Ci.nsIPrefBranch);

var torbirdyPref = Cc["@mozilla.org/preferences-service;1"]
                       .getService(Ci.nsIPrefService).getBranch(CUSTOM_BRANCH);

var acctMgr = Cc["@mozilla.org/messenger/account-manager;1"]
                  .getService(Ci.nsIMsgAccountManager);

var bundles = Cc["@mozilla.org/intl/stringbundle;1"]
                      .getService(Ci.nsIStringBundleService);
var strbundle = bundles.createBundle("chrome://castironthunderbirdclub/locale/torbirdy.properties");

function setDefaultPrefs() {
  prefs.setCharPref("network.proxy.socks", "127.0.0.1");
  prefs.setIntPref("network.proxy.socks_port", 9050);
  prefs.setIntPref("network.proxy.ssl_port", 8118);
  prefs.setIntPref("network.proxy.http_port", 8118);
}

function clearCustomPrefs() {
  var customPrefs = torbirdyPref.getChildList("", {});
  for (var i = 0; i < customPrefs.length; i++) {
    prefs.clearUserPref(CUSTOM_BRANCH + customPrefs[i]);
  }
}

function checkSetting() {
  var anonService = document.getElementById('proxy-settings').selectedIndex;
  if (anonService === 2) {
    document.getElementById('socks-host').disabled = false;
    document.getElementById('socks-port').disabled = false;
  }
  else {
    document.getElementById('socks-host').disabled = true;
    document.getElementById('socks-port').disabled = true;
  }

  if (anonService === 1) {
    document.getElementById('anonservice').disabled = false;
  } else {
    document.getElementById('anonservice').disabled = true;
  }
}

function getAccount() {
  var mailAccounts = [];
  var accounts = acctMgr.accounts;
  for (var i = 0; i < accounts.Count(); i++) {
    var account = accounts.QueryElementAt(i, Ci.nsIMsgAccount).incomingServer;
    var name = account.prettyName;
    if (!(name === "Local Folders")) {
      mailAccounts.push(account);
    }
  }
  return mailAccounts;
}

function selectMailAccount() {
  var mailaccount = document.getElementById('mail-accounts');
  var index = mailaccount.selectedIndex;

  if (!(index === 0)) {
    // For email accounts, configure accordingly.
    var sAccount = null;
    var account = getAccount();
    for (var i = 0; i < account.length; i++) {
      if (account[i].key === mailaccount.value) {
        sAccount = i;
      }
    }
    // Configure the account.
    window.openDialog("chrome://castironthunderbirdclub/content/accountpref.xul",
                     "AccountPrefWindow",
                     "chrome, dialog, centerscreen, modal",
                     account[sAccount]).focus();
    }
  mailaccount.selectedIndex = 0;
}

function onAccept() {
  var win = Cc['@mozilla.org/appshell/window-mediator;1']
              .getService(Ci.nsIWindowMediator)
              .getMostRecentWindow('mail:3pane');
  var myPanel = win.document.getElementById("my-panel");

  var anonService = document.getElementById('proxy-settings').selectedIndex;

  // Default (recommended) settings for TorBirdy.
  if (anonService === 0) {
    // Set proxies for Tor.
    setDefaultPrefs();
    clearCustomPrefs();
    myPanel.label = strbundle.GetStringFromName("torbirdy.enabled.tor");
  }
  
  // Anonymization service.
  if (anonService === 1) {
    var anonType = document.getElementById('anon-settings').selectedIndex;
    if (anonType === 0 || typeof anonType === "undefined") {
      // First set the preferences immediately.
      prefs.setIntPref("network.proxy.socks_port", 4001);
      prefs.setIntPref("network.proxy.ssl_port", 4001);
      prefs.setIntPref("network.proxy.http_port", 4001);
      // Now save them for later use.
      prefs.setIntPref(CUSTOM_BRANCH + "network.proxy.socks_port", 4001);
      prefs.setIntPref(CUSTOM_BRANCH + "network.proxy.ssl_port", 4001);
      prefs.setIntPref(CUSTOM_BRANCH + "network.proxy.http_port", 4001);
      myPanel.label = strbundle.GetStringFromName("torbirdy.enabled.jondo");
    }
    prefs.setIntPref(PREF_BRANCH + 'proxy.type', anonType);
  }

  // Custom proxy.
  if (anonService === 2) {
    var socks_host = document.getElementById('socks-host').value;
    var socks_port = document.getElementById('socks-port').value;
    // Set them now.
    prefs.setCharPref("network.proxy.socks", socks_host);
    prefs.setIntPref("network.proxy.socks_port", socks_port);
    // Later use.
    prefs.setCharPref(CUSTOM_BRANCH + "network.proxy.socks", socks_host);
    prefs.setIntPref(CUSTOM_BRANCH + "network.proxy.socks_port", socks_port);
    myPanel.label = strbundle.GetStringFromName("torbirdy.enabled.custom");
  }
  prefs.setIntPref(PREF_BRANCH + 'proxy', anonService);

  /*
    Privacy
  */
  var idlePref = 'mail.server.default.use_idle';
  var idle = document.getElementById('idle').checked;
  if (idle) {
    prefs.setBoolPref(CUSTOM_BRANCH + idlePref, true);
    prefs.setBoolPref(idlePref, true);
  }
  else {
    prefs.setBoolPref(CUSTOM_BRANCH + idlePref, false);
    prefs.setBoolPref(idlePref, false);
  }

  // Last accessed folder.
  var startupFolder = document.getElementById('startup-folder').checked;
  if (startupFolder) { 
    prefs.setBoolPref(PREF_BRANCH + 'startup_folder', true);
  } else {
    prefs.setBoolPref(PREF_BRANCH + 'startup_folder', false);
  }
}

function onLoad() {
  // Make sure the user really wants to change these settings.
  var warnPrompt = prefs.getBoolPref("extensions.torbirdy.warn");

  if (warnPrompt) {
    var prompts = Cc["@mozilla.org/embedcomp/prompt-service;1"]
                            .getService(Ci.nsIPromptService);
    var check = {value: true};
    var result = prompts.confirmCheck(null, strbundle.GetStringFromName('torbirdy.email.advanced.title'),
                                            strbundle.GetStringFromName('torbirdy.email.advanced'),
                                            strbundle.GetStringFromName('torbirdy.email.advanced.nextwarning'),
                                            check);
    if (!result) {
      window.close();
    } else {
      if (!check.value) {
        prefs.setBoolPref("extensions.torbirdy.warn", false);
      }
    }
  }

  /*
   PROXY
  */
  // Load the preference values.
  var anonService = prefs.getIntPref(PREF_BRANCH + 'proxy');
  document.getElementById('proxy-settings').selectedIndex = anonService;

  if (anonService === 0) {
    document.getElementById('socks-host').value = '127.0.0.1';
    document.getElementById('socks-port').value = '9050';
  }

  if (anonService === 1) {
    var anonType = prefs.getIntPref(PREF_BRANCH + 'proxy.type');
    document.getElementById('anonservice').disabled = false;
    document.getElementById('anon-settings').selectedIndex = anonType;
  }
  if (anonService === 2) {
    var socks_host = prefs.getCharPref(CUSTOM_BRANCH + 'network.proxy.socks');
    var socks_port = prefs.getIntPref(CUSTOM_BRANCH + 'network.proxy.socks_port');

    document.getElementById('socks-host').value = socks_host;
    document.getElementById('socks-port').value = socks_port;
    // Enable the settings.
    document.getElementById('socks-host').disabled = false;
    document.getElementById('socks-port').disabled = false;
  }

  /*
   Privacy
  */
  // Global settings.
  // IDLE.
  var idle = document.getElementById('idle');
  var idlePref = CUSTOM_BRANCH + 'mail.server.default.use_idle';
  if (prefs.prefHasUserValue(idlePref)) {
    var idlePrefValue = prefs.getBoolPref(idlePref);
  }
  if (idlePrefValue) {
    idle.checked = true;
  } else {
    idle.checked = false;
  }
  
  // Select last accessed folder.
  var startupFolder = document.getElementById('startup-folder');
  var startupPref = prefs.getBoolPref(PREF_BRANCH + 'startup_folder');
  if (!startupPref) {
    startupFolder.checked = false;
  } else {
    startupFolder.checked = true;
  }

  // Load the email accounts.
  var accounts = getAccount();
  var mailAccounts = document.getElementById('mail-accounts');
  if (accounts.length !== 0) {
    mailAccounts.appendItem('...', 'select-account');
    for (var i = 0; i < accounts.length; i++) {
      mailAccounts.appendItem(accounts[i].prettyName, accounts[i].key, accounts[i].type.toUpperCase());
    }
    mailAccounts.selectedIndex = 0;
  } else {
      mailAccounts.disabled = true;
      mailAccounts.appendItem('No email accounts found');
      mailAccounts.selectedIndex = 0;
  }
}

function testSettings() {
  onAccept();
  // Temporarily disable the fail closed HTTP and SSL proxies.
  var http = "network.proxy.http";
  var http_port = "network.proxy.http_port";
  var ssl = "network.proxy.ssl";
  var ssl_port = "network.proxy.ssl_port";

  var chttp = prefs.getCharPref(http);
  var chttp_port = prefs.getIntPref(http_port);
  var cssl = prefs.getCharPref(ssl);
  var cssl_port = prefs.getIntPref(ssl_port);

  prefs.setCharPref(http, "");
  prefs.setCharPref(ssl, "");
  prefs.setIntPref(http_port, 0);
  prefs.setIntPref(ssl_port, 0);

  Cc['@mozilla.org/appshell/window-mediator;1'].getService(Ci.nsIWindowMediator).
                getMostRecentWindow("mail:3pane").
                document.getElementById("tabmail").
                openTab("contentTab", {contentPage: "https://check.torproject.org/"});

  prefs.setCharPref(http, chttp);
  prefs.setCharPref(ssl, cssl);
  prefs.setIntPref(http_port, chttp_port);
  prefs.setIntPref(ssl_port, cssl_port);
}
