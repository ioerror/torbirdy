// Import the required util components
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

// Log Level #defines
VERB=1;
DEBUG=2;
INFO=3;
NOTE=4;
WARN=5;

const SERVICE_CTRID = "@torproject.org/torbirdy;1";
const SERVICE_ID    = Components.ID("{ebd85413-18c8-4265-a708-a8890ec8d1ed}"); // As defined in chrome.manifest
const SERVICE_NAME  = "Main TorBirdy component";
const TORBIRDY_ID = "castironthunderbirdclub@torproject.org";

// Default preference values for Torbutton for Thunderbird.
const PREFERENCES = {
  "extensions.torbirdy.protected": false,

  // Network settings.
  "network.proxy.socks_remote_dns": true,
  "network.proxy.socks": "127.0.0.1",
  "network.proxy.socks_port": 9050,
  "network.proxy.socks_version": 5,
  "network.proxy.no_proxies_on": "localhost, 127.0.0.1",
  "network.proxy.type": 1,
  "network.proxy.failover_timeout": 1800,

  // Anything that would cause another proxy type to be used, we'll make them
  // fail closed with the following - if it can fail closed, that is!
  "network.proxy.ssl": "127.0.0.1",
  "network.proxy.ssl_port": 8118,
  "network.proxy.http": "127.0.0.1",
  "network.proxy.http_port": 8118,
  "network.proxy.ftp": "127.0.0.1",
  "network.proxy.ftp_port": 8118,

  // Assume that the local Tor supports Prop 171
  // How can we set a username and password for the network.proxy.socks property?
  // XXX TODO

  // Override the user agent (empty string).
  "general.useragent.override": "",

  // Enable automatic updates.
  "app.update.enabled": true,

  // Prevent hostname leaks.
  "mail.smtpserver.default.hello_argument": "127.0.0.1",

  // Disable HTML email composing.
  "mail.html_compose": false,
  "mail.identity.default.compose_html": false,
  "mail.default_html_action": 1,
  "mailnews.wraplength": 72,

  // https://lists.torproject.org/pipermail/tor-talk/2011-September/021398.html
  // "Towards a Tor-safe Mozilla Thunderbird"
  // These options enable a warning that tagnaq suggests.
  "network.protocol-handler.warn-external.http": true,
  "network.protocol-handler.warn-external.https": true,
  "network.protocol-handler.warn-external.ftp": true,
  "network.protocol-handler.warn-external.file": true,
  "network.protocol-handler.warn-external-default": true,

  // We hope the user has Enigmail and if so, we believe these improve security.
  "extensions.enigmail.addHeaders": false,
  "extensions.enigmail.useDefaultComment": true,
  // XXX: TODO --hidden-recipient should be used for each person but perhaps
  // --throw-keyids will be an OK stopgap?
  "extensions.enigmail.agentAdditionalParam": "--no-emit-version " +
                                               "--no-comments " +
                                               "--throw-keyids " +
                                               "--display-charset utf-8 " +
                                               "--keyserver-options http-proxy=http://127.0.0.1:8118 " +
                                               "--keyserver hkp://2eghzlv2wwcq7u7y.onion",
  "extensions.enigmail.mimeHashAlgorithm": 5,

  // Suggestions from the JAP team on how they'd configure thunderbird
  // http://anonymous-proxy-servers.net/en/help/thunderbird.html
  "network.cookie.cookieBehavior": 2,
  "mailnews.start_page.enabled": false,
  "mailnews.send_default_charset": "UTF-8",
  "mailnews.send_plaintext_flowed": false,
  "mailnews.display.prefer_plaintext": true,
  "mailnews.display.disallow_mime_handlers": 1,
  "mailnews.display.html_as": 1,
  "rss.display.prefer_plaintext": true,
  "mail.inline_attachments": false,

  // Don't convert to our local date - this may matter in a reply, etc
  "mailnews.display.original_date": true,

  // Proxy bypass issues - disable them below:
  "network.websocket.enabled": false,
  "webgl.disabled": true,

  // Disable Telemetry.
  "toolkit.telemetry.enabled": false,

  // Likely privacy violations
  "network.prefetch-next": false,
  "network.http.spdy.enabled": false,

  // https://blog.torproject.org/blog/experimental-defense-website-traffic-fingerprinting
  // https://trac.torproject.org/projects/tor/ticket/3914
  "network.http.pipelining": true,
  "network.http.pipelining.ssl": true,
  "network.http.proxy.pipelining": true,
  "network.http.pipelining.maxrequests": 12,
  "network.http.sendRefererHeader": 0,

  // misc security prefs
  "security.OCSP.enabled": 1,
  // Default is always false for OCSP - it's broken crap
  "security.OCSP.require": false,
  "security.enable_tls_session_tickets": false,
  "security.enable_ssl3": false,
  "security.warn_entering_weak": true,
  "security.warn_submit_insecure": true,
  "security.ssl.enable_false_start": true,
  "security.ssl.require_safe_negotiation": true,
  "security.ssl.treat_unsafe_negotiation_as_broken": true,

  // Disable Thunderbird's 'Get new account' wizard
  "mail.provider.enabled": false,

  // Don't ask to be the default client.
  "mail.shell.checkDefaultClient": false,
  "mail.shell.checkDefaultMail": false,

  "geo.enabled": false,
  "javascript.enabled": false,

  // DOM specific.
  "dom.storage.enabled": false,
  "dom.ipc.plugins.java.enabled": false,
  "dom.disable_image_src_set": true,

  // Disable media files.
  "media.webm.enabled": false,
  "media.wave.enabled": false,
  "media.ogg.enabled": false,

  "mailnews.message_display.allow_plugins": false,

  "layout.css.visited_links_enabled": false,
  "gfx.downloadable_fonts.enabled": false,

  // Disable remote images.
  "permissions.default.image": 2,

  // Now enabled TorBirdy.
  "extensions.torbirdy.protected": true,
}

// Constructor for component init
function TorBirdy() {
  this._uninstall = false;
  this.wrappedJSObject = this;

  this.prefs = Cc["@mozilla.org/preferences-service;1"]
                  .getService(Ci.nsIPrefBranch);

  this.acctMgr = Cc["@mozilla.org/messenger/account-manager;1"]
                  .getService(Ci.nsIMsgAccountManager);

  var observerService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
  observerService.addObserver(this, "quit-application-granted", false);

  var appInfo = Cc["@mozilla.org/xre/app-info;1"]
                   .getService(Ci.nsIXULAppInfo);
  var versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"]
                          .getService(Ci.nsIVersionComparator);

  if (versionChecker.compare(appInfo.version, "5.0") >= 0) {
    this.is_tb5 = true;
  }
  else {
    this.is_tb5 = false;
  }

  if (this.is_tb5) {
    Components.utils.import("resource://gre/modules/AddonManager.jsm");
    this.onEnabling = this.onOperationCancelled;
    this.onDisabling = this.onUninstalling;
    AddonManager.addAddonListener(this);
  } else {
    observerService.addObserver(this, "em-action-requested", false);
  }

  this.setPrefs();
  this.setAccountPrefs();

  dump("TorBirdy registered!\n");
}

TorBirdy.prototype = {
  QueryInterface: XPCOMUtils.generateQI(
  [Ci.nsIObserver]),
  wrappedJSObject: null, // Initalized by constructor

  classDescription: SERVICE_NAME,
  classID:          SERVICE_ID,
  contractID:       SERVICE_CTRID,

  // This is a hack to cause Thunderbird to instantiate us asap!
  _xpcom_categories: [{ category: "profile-after-change"}, ],
  observe: function(subject, topic, data) {
    // dump("TorBirdy observes: " + topic + "\n");
    return;
  },

  onUninstalling: function(addon, needsRestart) {
    if (addon.id == TORBIRDY_ID) {
      dump("Nooo! TorBirdy uninstall requested\n");
      this._uninstall = true;
      this.resetUserPrefs();
      }
  },

  onOperationCancelled: function(addon) {
    if (addon.id == TORBIRDY_ID) {
      dump("Uninstall requested cancelled. Yayay!\n");
      this._uninstall = false;
      this.setPrefs();
    }
  },

  observe: function(subject, topic, data) {
    if (topic == "em-action-requested") {
      subject.QueryInterface(Ci.nsIUpdateItem);

      if (subject.id == TORBIRDY_ID) {
        if (data == "item-uninstalled" || data == "item-disabled") {
          dump("Nooo! TorBirdy uninstall requested\n");
          this._uninstall = true;
          this.resetUserPrefs();
        } else if (data == "item-cancel-action") {
          dump("Uninstall requested cancelled. Yayay!\n");
          this._uninstall = false;
          this.setPrefs();
        }
      }
    }
  },

  resetUserPrefs: function() {
    dump("Resetting user preferences to default\n");
    for (var each in PREFERENCES) {
      this.prefs.clearUserPref(each);
    }
  },

  setPrefs: function() {
    for (var each in PREFERENCES) {
      if (typeof PREFERENCES[each] === "boolean") {
        this.prefs.setBoolPref(each, PREFERENCES[each]);
      }
      if (typeof PREFERENCES[each] === "number") {
        this.prefs.setIntPref(each, PREFERENCES[each]);
      }
      if (typeof PREFERENCES[each] === "string") {
        this.prefs.setCharPref(each, PREFERENCES[each]);
      }
    }
  },

  // Iterate through all accounts and disable automatic checking of emails.
  setAccountPrefs: function() {
    var accounts = this.acctMgr.accounts;
    for (var i = 0; i < accounts.Count(); i++) {
      var account = accounts.QueryElementAt(i, Ci.nsIMsgAccount).incomingServer;
      account.downloadOnBiff = false;
      account.loginAtStartUp = false;
      account.doBiff = false;
    }
  },

}

if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([TorBirdy]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([TorBirdy]);
