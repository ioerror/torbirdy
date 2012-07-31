// Import the required util components.
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

// Log level #defines.
VERB=1;
DEBUG=2;
INFO=3;
NOTE=4;
WARN=5;

const SERVICE_CTRID = "@torproject.org/torbirdy;1";
const SERVICE_ID    = Components.ID("{ebd85413-18c8-4265-a708-a8890ec8d1ed}");
const SERVICE_NAME  = "Main TorBirdy component";
const TORBIRDY_ID   = "castironthunderbirdclub@torproject.org";
const PREF_BRANCH   = "extensions.torbirdy.custom.";

// Default preference values for TorBirdy.
const PREFERENCES = {
  "extensions.torbirdy.protected": false,
  // When the preferences below have been set, then only enable TorBirdy.
  // Generate our own custom time-independent message-ID.
  "mailnews.custom_message_id": true,
  "mailnews.header.custom_message_id": "",
  // Remove the date header.
  "mailnews.local_date_header_generation": false,

  /*
    Network
  */

  // Use a manual proxy configuration.
  "network.proxy.type": 1,
  // Number of seconds to wait before attempting to recontact an unresponsive proxy server.
  "network.proxy.failover_timeout": 1800,

  // Configure Thunderbird to use the SOCKS5 proxy.
  "network.proxy.socks": "127.0.0.1",
  "network.proxy.socks_port": 9050,
  "network.proxy.socks_version": 5,
  "network.proxy.no_proxies_on": "localhost, 127.0.0.1",

  // Set DNS proxying through SOCKS5.
  "network.proxy.socks_remote_dns": true,

  // Anything that would cause another proxy type to be used, we'll make them
  // fail closed with the following - if it can fail closed, that is!
  "network.proxy.ssl": "127.0.0.1",
  "network.proxy.ssl_port": 8118,
  "network.proxy.http": "127.0.0.1",
  "network.proxy.http_port": 8118,
  "network.proxy.ftp": "127.0.0.1",
  "network.proxy.ftp_port": 8118,

  // https://lists.torproject.org/pipermail/tor-talk/2011-September/021398.html
  // "Towards a Tor-safe Mozilla Thunderbird"
  // These options enable a warning that tagnaq suggests.

  // Warn when an application is to be launched.
  "network.protocol-handler.warn-external.http": true,
  "network.protocol-handler.warn-external.https": true,
  "network.protocol-handler.warn-external.ftp": true,
  "network.protocol-handler.warn-external.file": true,
  "network.protocol-handler.warn-external-default": true,

  // Likely privacy violations
  // https://blog.torproject.org/blog/experimental-defense-website-traffic-fingerprinting
  // https://trac.torproject.org/projects/tor/ticket/3914
  "network.http.pipelining": true,
  "network.http.spdy.enabled": false,
  "network.http.pipelining.ssl": true,
  "network.http.proxy.pipelining": true,
  "network.http.pipelining.maxrequests": 12,
  "network.http.sendRefererHeader": 0,

  // Disable proxy bypass issue.
  "network.websocket.enabled": false,
  // No cookies are allowed.
  "network.cookie.cookieBehavior": 2,
  // Disable link prefetching.
  "network.prefetch-next": false,

  /*
    Security
  */

  "security.OCSP.enabled": 1,
  // Default is always false for OCSP - it's broken crap
  "security.OCSP.require": false,
  // Disable TLS Session Ticket.
  // See https://trac.torproject.org/projects/tor/ticket/4099
  "security.enable_tls_session_tickets": false,
  // Enable SSL3.
  "security.enable_ssl3": false,
  // Display a dialog warning the user when entering an insecure site from a secure one.
  "security.warn_entering_weak": true,
  // Display a dialog warning the user when submtting a form to an insecure site.
  "security.warn_submit_insecure": true,
  // Enable SSL FalseStart.
  "security.ssl.enable_false_start": true,
  // Reject all connection attempts to servers using the old SSL/TLS protocol.
  "security.ssl.require_safe_negotiation": true,
  // Warn when connecting to a server that uses an old protocol version.
  "security.ssl.treat_unsafe_negotiation_as_broken": true,

  /*
    Mailnews
  */

  // Suggestions from the JAP team on how they'd configure thunderbird
  // http://anonymous-proxy-servers.net/en/help/thunderbird.html

  // Disable the start page.
  "mailnews.start_page.enabled": false,
  // Set UTF-8 as the default charset.
  "mailnews.send_default_charset": "UTF-8",
  // Send plain text with hard line breaks as entered.
  "mailnews.send_plaintext_flowed": false,
  // Display a message as plain text, even if there is a HTML version.
  "mailnews.display.prefer_plaintext": true,
  // Don't display HTML.
  "mailnews.display.disallow_mime_handlers": 1,
  // Convert HTML to text and then back again.
  "mailnews.display.html_as": 1,
  // Disable plugin support.
  "mailnews.message_display.allow_plugins": false,
  // Don't convert to our local date. This may matter in a reply, etc.
  "mailnews.display.original_date": true,
  // Wrap a line at this 72 characters.
  "mailnews.wraplength": 72,
  // When replying to a message, set to: '%s'.
  // https://lists.torproject.org/pipermail/tor-talk/2012-May/024395.html
  "mailnews.reply_header_type": 1,
  "mailnews.reply_header_authorwrote": "%s",

  /*
    Mail
  */

  // Prevent hostname leaks.
  "mail.smtpserver.default.hello_argument": "127.0.0.1",
  // Compose messages in plain text (by default).
  "mail.html_compose": false,
  "mail.identity.default.compose_html": false,
  // Send message as plain text.
  "mail.default_html_action": 1,
  // Disable Thunderbird's 'Get new account' wizard.
  "mail.provider.enabled": false,
  // Don't ask to be the default client.
  "mail.shell.checkDefaultClient": false,
  "mail.shell.checkDefaultMail": false,
  // Disable inline attachments.
  "mail.inline_attachments": false,
  // Do not IDLE (disable push mail).
  "mail.server.default.use_idle": false,
  /*
    Enigmail
  */

  // We hope the user has Enigmail and if so, we believe these improve security.

  // Disable X-Enigmail headers.
  "extensions.enigmail.addHeaders": false,
  // Use GnuPG's default comment for signed messages.
  "extensions.enigmail.useDefaultComment": true,
  // XXX: TODO --hidden-recipient should be used for each person but perhaps
  // --throw-keyids will be an OK stopgap?
  "extensions.enigmail.agentAdditionalParam": "--no-emit-version " +
                                              "--no-comments " +
                                              "--throw-keyids " +
                                              "--display-charset utf-8 " +
                                              "--keyserver-options http-proxy=http://127.0.0.1:8118 " +
                                              "--keyserver hkp://2eghzlv2wwcq7u7y.onion",

  // Prefer plain text for RSS.
  "rss.display.prefer_plaintext": true,

  // Assume that the local Tor supports Prop 171
  // How can we set a username and password for the network.proxy.socks property?
  // XXX TODO

  // Override the user agent by setting it to an empty string.
  "general.useragent.override": "",

  // Make sure Thunderbird updates are enabled.
  "app.update.enabled": true,

  // Force GnuPG to use SHA512.
  "extensions.enigmail.mimeHashAlgorithm": 5,

  // Disable WebGL.
  "webgl.disabled": true,

  // Disable Telemetry.
  "toolkit.telemetry.enabled": false,

  // Disable Geolocation.
  "geo.enabled": false,

  // Disable JavaScript (email).
  "javascript.enabled": false,

  // Disable client-side session and persistent storage.
  "dom.storage.enabled": false,
  // Do not run plugins out-of-process.
  "dom.ipc.plugins.java.enabled": false,
  // Disable changing of images via JavaScript.
  "dom.disable_image_src_set": true,

  // Disable media files (WebM, WAV, Ogg).
  "media.webm.enabled": false,
  "media.wave.enabled": false,
  "media.ogg.enabled": false,

  // Disable CSS :visited selector.
  "layout.css.visited_links_enabled": false,

  // Disable downloadable fonts.
  "gfx.downloadable_fonts.enabled": false,

  // Disable remote images.
  "permissions.default.image": 2,

  // All preferences have been set: now enable TorBirdy.
  "extensions.torbirdy.protected": true,
}

// Constructor for component init.
function TorBirdy() {
  this._uninstall = false;
  this.wrappedJSObject = this;

  this.prefs = Cc["@mozilla.org/preferences-service;1"]
                  .getService(Ci.nsIPrefBranch);

  var torbirdyPref = Cc["@mozilla.org/preferences-service;1"]
                         .getService(Ci.nsIPrefService).getBranch(PREF_BRANCH);
  this.customPrefs = torbirdyPref.getChildList("", {});

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

  // This is a hack to cause Thunderbird to instantiate us ASAP!
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
    for (var i = 0; i < this.customPrefs.length; i++) {
      this.prefs.clearUserPref(PREF_BRANCH + this.customPrefs[i]);
    }
    // Other misc. preferences.
    this.prefs.clearUserPref("extensions.torbirdy.proxy");
    this.prefs.clearUserPref("extensions.torbirdy.proxy.type");
  },

  setPrefs: function() {
    // If custom values are set for specific preferences, override the defaults with them.
    // For each preference, get the type and then set the property.
    for (var i = 0; i < this.customPrefs.length; i++) {
      var typePref = this.prefs.getPrefType(this.customPrefs[i]);
      // String.
      if (typePref === 32) {
        var value = this.prefs.getCharPref(PREF_BRANCH + this.customPrefs[i]);
      }
      // Int.
      if (typePref === 64) {
        var value = this.prefs.getIntPref(PREF_BRANCH + this.customPrefs[i]);
      }
      // Bool.
      if (typePref === 128) {
        var value = this.prefs.getBoolPref(PREF_BRANCH + this.customPrefs[i]);
      }
      PREFERENCES[this.customPrefs[i]] = value;
    }

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
