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

    this.prefs.clearUserPref("network.proxy.socks_remote_dns");
    this.prefs.clearUserPref("network.proxy.socks");
    this.prefs.clearUserPref("network.proxy.socks_port");
    this.prefs.clearUserPref("network.proxy.socks_version");
    this.prefs.clearUserPref("network.proxy.no_proxies_on");
    this.prefs.clearUserPref("network.proxy.type");
    this.prefs.clearUserPref("network.proxy.failover_timeout");

    this.prefs.clearUserPref("network.proxy.ssl");
    this.prefs.clearUserPref("network.proxy.ssl_port");
    this.prefs.clearUserPref("network.proxy.http");
    this.prefs.clearUserPref("network.proxy.http_port");
    this.prefs.clearUserPref("network.proxy.ftp");
    this.prefs.clearUserPref("network.proxy.ftp_port");

    this.prefs.clearUserPref("general.useragent.override");

    this.prefs.clearUserPref("app.update.enabled");

    this.prefs.clearUserPref("mail.smtpserver.default.hello_argument");

    this.prefs.clearUserPref("mail.html_compose");
    this.prefs.clearUserPref("mail.identity.default.compose_html");
    this.prefs.clearUserPref("mail.default_html_action");
    this.prefs.clearUserPref("mailnews.wraplength");

    this.prefs.clearUserPref("network.protocol-handler.warn-external.http");
    this.prefs.clearUserPref("network.protocol-handler.warn-external.https");
    this.prefs.clearUserPref("network.protocol-handler.warn-external.ftp");
    this.prefs.clearUserPref("network.protocol-handler.warn-external.file");
    this.prefs.clearUserPref("network.protocol-handler.warn-external-default");

    this.prefs.clearUserPref("extensions.enigmail.addHeaders");
    this.prefs.clearUserPref("extensions.enigmail.useDefaultComment");

    this.prefs.clearUserPref("extensions.enigmail.agentAdditionalParam");
    this.prefs.clearUserPref("extensions.enigmail.mimeHashAlgorithm");

    this.prefs.clearUserPref("network.cookie.cookieBehavior");
    this.prefs.clearUserPref("mailnews.start_page.enabled");
    this.prefs.clearUserPref("mailnews.send_default_charset");
    this.prefs.clearUserPref("mailnews.send_plaintext_flowed");
    this.prefs.clearUserPref("mailnews.display.prefer_plaintext");
    this.prefs.clearUserPref("mailnews.display.disallow_mime_handlers");
    this.prefs.clearUserPref("mailnews.display.html_as");
    this.prefs.clearUserPref("rss.display.prefer_plaintext");
    this.prefs.clearUserPref("mail.inline_attachments");

    this.prefs.clearUserPref("mailnews.display.original_date");

    this.prefs.clearUserPref("network.websocket.enabled");
    this.prefs.clearUserPref("webgl.disabled");

    this.prefs.clearUserPref("toolkit.telemetry.enabled");

    this.prefs.clearUserPref("network.prefetch-next");
    this.prefs.clearUserPref("network.http.spdy.enabled");

    this.prefs.clearUserPref("network.http.pipelining");
    this.prefs.clearUserPref("network.http.pipelining.ssl");
    this.prefs.clearUserPref("network.http.proxy.pipelining");
    this.prefs.clearUserPref("network.http.pipelining.maxrequests");
    this.prefs.clearUserPref("network.http.sendRefererHeader");

    this.prefs.clearUserPref("security.OCSP.enabled");
    this.prefs.clearUserPref("security.OCSP.require");
    this.prefs.clearUserPref("security.enable_tls_session_tickets");
    this.prefs.clearUserPref("security.enable_ssl3");
    this.prefs.clearUserPref("security.warn_entering_weak");
    this.prefs.clearUserPref("security.warn_submit_insecure");
    this.prefs.clearUserPref("security.ssl.enable_false_start");
    this.prefs.clearUserPref("security.ssl.require_safe_negotiation");
    this.prefs.clearUserPref("security.ssl.treat_unsafe_negotiation_as_broken");

    this.prefs.clearUserPref("mail.provider.enabled");

    this.prefs.clearUserPref("mail.shell.checkDefaultClient");
    this.prefs.clearUserPref("mail.shell.checkDefaultMail");

    this.prefs.clearUserPref("geo.enabled");
    this.prefs.clearUserPref("javascript.enabled");

    this.prefs.clearUserPref("dom.storage.enabled");
    this.prefs.clearUserPref("dom.ipc.plugins.java.enabled");
    this.prefs.clearUserPref("dom.disable_image_src_set");

    this.prefs.clearUserPref("media.webm.enabled");
    this.prefs.clearUserPref("media.wave.enabled");
    this.prefs.clearUserPref("media.ogg.enabled");

    this.prefs.clearUserPref("mailnews.message_display.allow_plugins");

    this.prefs.clearUserPref("layout.css.visited_links_enabled");
    this.prefs.clearUserPref("gfx.downloadable_fonts.enabled");

    this.prefs.clearUserPref("permissions.default.image");
    this.prefs.clearUserPref("extensions.torbirdy.protected");
  },

  setPrefs: function() {
    this.prefs.setBoolPref("extensions.torbirdy.protected", false);
    /*
    Default preference values for Torbutton for Thunderbird.
    */

    // Network settings.
    this.prefs.setBoolPref("network.proxy.socks_remote_dns", true);
    this.prefs.setCharPref("network.proxy.socks", "127.0.0.1");
    this.prefs.setIntPref("network.proxy.socks_port", 9050);
    this.prefs.setIntPref("network.proxy.socks_version", 5);
    this.prefs.setCharPref("network.proxy.no_proxies_on", "localhost, 127.0.0.1");
    this.prefs.setIntPref("network.proxy.type", 1);
    this.prefs.setIntPref("network.proxy.failover_timeout", 1800);

    // Anything that would cause another proxy type to be used, we'll make them
    // fail closed with the following - if it can fail closed, that is!
    this.prefs.setCharPref("network.proxy.ssl", "127.0.0.1");
    this.prefs.setIntPref("network.proxy.ssl_port", 8118);
    this.prefs.setCharPref("network.proxy.http", "127.0.0.1");
    this.prefs.setIntPref("network.proxy.http_port", 8118);
    this.prefs.setCharPref("network.proxy.ftp", "127.0.0.1");
    this.prefs.setIntPref("network.proxy.ftp_port", 8118);

    // Assume that the local Tor supports Prop 171
    // How can we set a username and password for the network.proxy.socks property?
    // XXX TODO

    // Override the user agent (empty string).
    this.prefs.setCharPref("general.useragent.override", "");

    // Enable automatic updates.
    this.prefs.setBoolPref("app.update.enabled", true);

    // Prevent hostname leaks.
    this.prefs.setCharPref("mail.smtpserver.default.hello_argument", "127.0.0.1");

    // Disable HTML email composing.
    this.prefs.setBoolPref("mail.html_compose", false);
    this.prefs.setBoolPref("mail.identity.default.compose_html", false);
    this.prefs.setIntPref("mail.default_html_action", 1);
    this.prefs.setIntPref("mailnews.wraplength", 72);

    // https://lists.torproject.org/pipermail/tor-talk/2011-September/021398.html
    // "Towards a Tor-safe Mozilla Thunderbird"
    // These options enable a warning that tagnaq suggests.
    this.prefs.setBoolPref("network.protocol-handler.warn-external.http", true);
    this.prefs.setBoolPref("network.protocol-handler.warn-external.https", true);
    this.prefs.setBoolPref("network.protocol-handler.warn-external.ftp", true);
    this.prefs.setBoolPref("network.protocol-handler.warn-external.file", true);
    this.prefs.setBoolPref("network.protocol-handler.warn-external-default", true);

    // We hope the user has Enigmail and if so, we believe these improve security.
    this.prefs.setBoolPref("extensions.enigmail.addHeaders", false);
    this.prefs.setBoolPref("extensions.enigmail.useDefaultComment", true);
    // XXX: TODO --hidden-recipient should be used for each person but perhaps
    // --throw-keyids will be an OK stopgap?
    this.prefs.setCharPref("extensions.enigmail.agentAdditionalParam", "--no-emit-version --no-comments --throw-keyids --display-charset utf-8 --keyserver-options http-proxy=http://127.0.0.1:8118 --keyserver hkp://2eghzlv2wwcq7u7y.onion");
    this.prefs.setIntPref("extensions.enigmail.mimeHashAlgorithm", 5);

    // Suggestions from the JAP team on how they'd configure thunderbird
    // http://anonymous-proxy-servers.net/en/help/thunderbird.html
    this.prefs.setIntPref("network.cookie.cookieBehavior", 2);
    this.prefs.setBoolPref("mailnews.start_page.enabled", false);
    this.prefs.setCharPref("mailnews.send_default_charset", "UTF-8");
    this.prefs.setBoolPref("mailnews.send_plaintext_flowed", false);
    this.prefs.setBoolPref("mailnews.display.prefer_plaintext", true);
    this.prefs.setIntPref("mailnews.display.disallow_mime_handlers", 1);
    this.prefs.setIntPref("mailnews.display.html_as", 1);
    this.prefs.setBoolPref("rss.display.prefer_plaintext", true);
    this.prefs.setBoolPref("mail.inline_attachments", false);

    // Don't convert to our local date - this may matter in a reply, etc
    this.prefs.setBoolPref("mailnews.display.original_date", true);

    // Proxy bypass issues - disable them below:
    this.prefs.setBoolPref("network.websocket.enabled", false);
    this.prefs.setBoolPref("webgl.disabled", true);

    // Disable Telemetry.
    this.prefs.setBoolPref("toolkit.telemetry.enabled", false);

    // Likely privacy violations
    this.prefs.setBoolPref("network.prefetch-next", false);
    this.prefs.setBoolPref("network.http.spdy.enabled", false);

    // https://blog.torproject.org/blog/experimental-defense-website-traffic-fingerprinting
    // https://trac.torproject.org/projects/tor/ticket/3914
    this.prefs.setBoolPref("network.http.pipelining", true);
    this.prefs.setBoolPref("network.http.pipelining.ssl", true);
    this.prefs.setBoolPref("network.http.proxy.pipelining", true);
    this.prefs.setIntPref("network.http.pipelining.maxrequests", 12);
    this.prefs.setIntPref("network.http.sendRefererHeader", 0);

    // misc security prefs
    this.prefs.setIntPref("security.OCSP.enabled", 1);
    // Default is always false for OCSP - it's broken crap
    this.prefs.setBoolPref("security.OCSP.require", false);
    this.prefs.setBoolPref("security.enable_tls_session_tickets", false);
    this.prefs.setBoolPref("security.enable_ssl3", false);
    this.prefs.setBoolPref("security.warn_entering_weak", true);
    this.prefs.setBoolPref("security.warn_submit_insecure", true);
    this.prefs.setBoolPref("security.ssl.enable_false_start", true);
    this.prefs.setBoolPref("security.ssl.require_safe_negotiation", true);
    this.prefs.setBoolPref("security.ssl.treat_unsafe_negotiation_as_broken", true);

    // Disable Thunderbird's 'Get new account' wizard
    this.prefs.setBoolPref("mail.provider.enabled", false);

    // Don't ask to be the default client.
    this.prefs.setBoolPref("mail.shell.checkDefaultClient", false);
    this.prefs.setBoolPref("mail.shell.checkDefaultMail", false);

    this.prefs.setBoolPref("geo.enabled", false);
    this.prefs.setBoolPref("javascript.enabled", false);

    // DOM specific.
    this.prefs.setBoolPref("dom.storage.enabled", false);
    this.prefs.setBoolPref("dom.ipc.plugins.java.enabled", false);
    this.prefs.setBoolPref("dom.disable_image_src_set", true);

    // Disable media files.
    this.prefs.setBoolPref("media.webm.enabled", false);
    this.prefs.setBoolPref("media.wave.enabled", false);
    this.prefs.setBoolPref("media.ogg.enabled", false);

    this.prefs.setBoolPref("mailnews.message_display.allow_plugins", false);

    this.prefs.setBoolPref("layout.css.visited_links_enabled", false);
    this.prefs.setBoolPref("gfx.downloadable_fonts.enabled", false);

    // Disable remote images.
    this.prefs.setIntPref("permissions.default.image", 2);

    // Now enabled TorBirdy.
    this.prefs.setBoolPref("extensions.torbirdy.protected", true);
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
