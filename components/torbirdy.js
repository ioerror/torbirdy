// Import the required util components.
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

const Ci = Components.interfaces;
const Cc = Components.classes;
const Cr = Components.results;

const SERVICE_CTRID   = "@torproject.org/torbirdy;1";
const SERVICE_ID      = Components.ID("{ebd85413-18c8-4265-a708-a8890ec8d1ed}");
const SERVICE_NAME    = "Main TorBirdy component";
const TORBIRDY_ID     = "castironthunderbirdclub@torproject.org";
const PREF_BRANCH     = "extensions.torbirdy.custom.";
const RESTORE_BRANCH  = "extensions.torbirdy.restore.";
const TORBIRDY_BRANCH = "extensions.torbirdy.";

// Default preference values for TorBirdy.
// These preferences values will be "enforced": even if the user decides to
// change the preferences listed below, they will be reset to the TorBirdy
// default when Thunderbird restarts. The reason we are doing this is because
// these preferences, if changed, can introduce leaks and therefore should be
// not changed by the user. Even if the user does change them, we reset them to
// the secure default when Thunderbird starts.
// There are some preferences that can be overwritten using TorBirdy's
// preferences dialog. See `preferences.js'.
const TORBIRDYPREFS = {
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
  // We do not fully understand the privacy issues of the SPDY protocol
  // We have no reason to believe that anyone would actually use it with
  // Thunderbird but we fail closed to keep users safe out of an abundance of
  // caution.
  "network.http.spdy.enabled": false,
  // We want pipelined requests and a bunch of them, as is explained in the
  // experimental-defense-website-traffic-fingerprinting blog post by Torbutton
  // author Mike Perry.
  "network.http.pipelining.ssl": true,
  "network.http.proxy.pipelining": true,
  "network.http.pipelining.maxrequests": 12,
  "network.http.sendRefererHeader": 0,

  // Disable proxy bypass issue.
  // Websockets have no use in Thunderbird over Tor; some versions of the
  // underlying Mozilla networking code allowed websockets to bypass the proxy
  // settings - this is deadly to Tor users:
  // https://blog.torproject.org/blog/firefox-security-bug-proxy-bypass-current-tbbs
  // We don't want user's of Thunderbird to even come close to such a bypass
  // issue and so we have disabled websockets out of an abundance of caution.
  "network.websocket.enabled": false,
  // No cookies are allowed.
  "network.cookie.cookieBehavior": 2,
  // Disable link prefetching.
  "network.prefetch-next": false,

  /*
    Security
  */

  // Default is always false for OCSP - it's broken crap
  // Why is it broken, you might ask?
  // Moxie Marlinspike, a hero to all humans everywhere, defeated it with the
  // number '3' at Defcon/Blackhat 2009 His paper:
  // http://www.thoughtcrime.org/papers/ocsp-attack.pdf His software to perform
  // the attack is here: http://thoughtcrime.org/software/sslsniff/ Furthermore
  // - OCSP servers may log information about a user as they use the internet
  // generally; it's everything we hate about CRLs and more
  "security.OCSP.enabled": 1,
  "security.OCSP.require": false,
  // Disable TLS Session Ticket.
  // See https://trac.torproject.org/projects/tor/ticket/4099
  "security.enable_tls_session_tickets": false,
  // Enable SSL3?
  // We do not want to enable a known weak protocol; users should use only use TLS
  "security.enable_ssl3": false,
  // Display a dialog warning the user when entering an insecure site from a secure one.
  "security.warn_entering_weak": true,
  // Display a dialog warning the user when submtting a form to an insecure site.
  "security.warn_submit_insecure": true,
  // Enable SSL FalseStart.
  // This should be safe and improve TLS performance
  "security.ssl.enable_false_start": true,
  // Reject all connection attempts to servers using the old SSL/TLS protocol.
  "security.ssl.require_safe_negotiation": true,
  // Warn when connecting to a server that uses an old protocol version.
  "security.ssl.treat_unsafe_negotiation_as_broken": true,
  // Disable 'extension blocklist' which might leak the OS information.
  // See https://trac.torproject.org/projects/tor/ticket/6734
  "extensions.blocklist.enabled": false,

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
  // Don't display HTML, inline images and some other uncommon content.
  // From: http://www.bucksch.org/1/projects/mozilla/108153/
  "mailnews.display.disallow_mime_handlers": 3,
  // Convert HTML to text and then back again.
  "mailnews.display.html_as": 1,
  // Disable plugin support.
  "mailnews.message_display.allow_plugins": false,
  // Don't convert to our local date. This may matter in a reply, etc.
  "mailnews.display.original_date": true,
  // Wrap a line at 72 characters.
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
  // We would like these options to be a single shared option we can toggle but
  // we require some discussions with upstream and then they would need a new
  // release. It's not actually clear how we could or even if we should then
  // depend on a specific Enigmail version. Either way, we want to save the
  // user who would shoot themselves in the privacy-foot.

  // Disable X-Enigmail headers.
  // We don't want to obviously disclose that we're using Enigmail as it may
  // add privacy destroying headers
  "extensions.enigmail.addHeaders": false,
  // Use GnuPG's default comment for signed messages.
  "extensions.enigmail.useDefaultComment": true,
  // Confirm before sending a signed/encrypted message.
  "extensions.enigmail.confirmBeforeSend": true,
  // XXX: TODO --hidden-recipient should be used for each person but perhaps
  // --throw-keyids will be an OK stopgap?
  "extensions.enigmail.agentAdditionalParam":
                                              // Don't disclose the version
                                              "--no-emit-version " +
                                              // Don't add additional comments (may leak language, etc)
                                              "--no-comments " +
                                              // Don't include keyids that may disclose the sender or any other non-obvious keyids
                                              "--throw-keyids " +
                                              // We want to force UTF-8 everywhere
                                              "--display-charset utf-8 " +
                                              // We want to ensure that Enigmail is proxy aware even when it runs gpg in a shell
                                              "--keyserver-options http-proxy=http://127.0.0.1:8118 ",
                                            
  // The default key server should be a hidden service and this is the only known one (it's part of the normal SKS network)                                        
  "extensions.enigmail.keyserver": "hkp://2eghzlv2wwcq7u7y.onion",

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

  // Thunderbird 15 introduces the chat feature so disable the preferences below.
  "purple.logging.log_chats": false,
  "purple.logging.log_ims": false,
  "purple.logging.log_system": false,
  "purple.conversations.im.send_typing": false,

  // Messenger related preferences.
  "messenger.status.reportIdle": false,
  "messenger.status.defaultIdleAwayMessage": "",
  "messenger.status.userDisplayName": "",
  "messenger.startup.action": 0,

  // All preferences have been set: now enable TorBirdy.
  "extensions.torbirdy.protected": true,
}

// Although we do perform a cleanup when TorBirdy is removed (we remove
// TorBirdy's preferences), there are some preference values that we change
// when TorBirdy is initialized that should be preserved instead. When TorBirdy
// is disabled or uninstalled, these preferences are restored to their original
// value. All such preferences go here.
const TORBIRDY_OLDPREFS = [
  "network.proxy.type",
  "network.proxy.ssl_port",
  "network.proxy.ssl",
  "network.proxy.socks_version",
  "network.proxy.socks_port",
  "network.proxy.socks",
  "network.proxy.http_port",
  "network.proxy.http",
]

// Constructor for component init.
function TorBirdy() {
  this._uninstall = false;
  this.wrappedJSObject = this;

  this.prefs = Cc["@mozilla.org/preferences-service;1"]
                  .getService(Ci.nsIPrefBranch);

  var torbirdyPref = Cc["@mozilla.org/preferences-service;1"]
                         .getService(Ci.nsIPrefService).getBranch(PREF_BRANCH);
  this.customPrefs = torbirdyPref.getChildList("", {});

  var oldPrefs = Cc["@mozilla.org/preferences-service;1"]
                           .getService(Ci.nsIPrefService).getBranch(RESTORE_BRANCH);
  this.restorePrefs = oldPrefs.getChildList("", {});

  this.acctMgr = Cc["@mozilla.org/messenger/account-manager;1"]
                  .getService(Ci.nsIMsgAccountManager);

  var observerService = Cc["@mozilla.org/observer-service;1"]
                           .getService(Ci.nsIObserverService);
  observerService.addObserver(this, "quit-application-granted", false);

  var appInfo = Cc["@mozilla.org/xre/app-info;1"]
                   .getService(Ci.nsIXULAppInfo);
  var versionChecker = Cc["@mozilla.org/xpcom/version-comparator;1"]
                          .getService(Ci.nsIVersionComparator);

  var pluginsHost = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
  this.plugins = pluginsHost.getPluginTags({});

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

  this.setAccountPrefs();
  this.setPrefs();

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
    // Clear the Thunderbird preferences we changed.
    for (var each in TORBIRDYPREFS) {
      this.prefs.clearUserPref(each);
    }

    // Restore the older proxy preferences that were set before TorBirdy.
    dump("Restoring proxy settings\n");
    for (var i = 0; i < TORBIRDY_OLDPREFS.length; i++) {
      var oldPref = TORBIRDY_OLDPREFS[i];
      var setValue = RESTORE_BRANCH + oldPref;
      var type = this.prefs.getPrefType(setValue);
      if (type === 32) {
        this.prefs.setCharPref(oldPref, this.prefs.getCharPref(setValue));
      }
      if (type === 64) {
        this.prefs.setIntPref(oldPref, this.prefs.getIntPref(setValue));
      }
      if (type === 128) {
        this.prefs.setBoolPref(oldPref, this.prefs.getBoolPref(setValue));
      }
    }

    // Enable plugins.
    for(var i = 0; i < this.plugins.length; i++) {
        this.plugins[i].disabled = false;
    }

    // Now clear all TorBirdy preferences.
    var clearPrefs = Cc["@mozilla.org/preferences-service;1"]
                             .getService(Ci.nsIPrefService).getBranch(TORBIRDY_BRANCH).getChildList("", {});
    for (var i = 0; i < clearPrefs.length; i++) {
        this.prefs.clearUserPref(TORBIRDY_BRANCH + clearPrefs[i]);
    }
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
      TORBIRDYPREFS[this.customPrefs[i]] = value;
    }

    for (var each in TORBIRDYPREFS) {
      if (typeof TORBIRDYPREFS[each] === "boolean") {
        this.prefs.setBoolPref(each, TORBIRDYPREFS[each]);
      }
      if (typeof TORBIRDYPREFS[each] === "number") {
        this.prefs.setIntPref(each, TORBIRDYPREFS[each]);
      }
      if (typeof TORBIRDYPREFS[each] === "string") {
        this.prefs.setCharPref(each, TORBIRDYPREFS[each]);
      }
    }
  },

  setAccountPrefs: function() {
    if (this.prefs.getBoolPref("extensions.torbirdy.first_run")) {
      // Save the current proxy settings so that the settings can be restored in case
      // TorBirdy is uninstalled or disabled. (TORBIRDY_OLDPREFS)
      for (var i = 0; i < TORBIRDY_OLDPREFS.length; i++) {
        var oldPref = TORBIRDY_OLDPREFS[i];
        var type = this.prefs.getPrefType(oldPref);
        // String.
        if (type === 32) {
          if (this.prefs.prefHasUserValue(oldPref)) {
            var pref = this.prefs.getCharPref(oldPref);
            this.prefs.setCharPref(RESTORE_BRANCH + oldPref, pref);
          }
        }
        // Int.
        if (type === 64) {
          if (this.prefs.prefHasUserValue(oldPref)) {
            var pref = this.prefs.getIntPref(oldPref);
            this.prefs.setIntPref(RESTORE_BRANCH + oldPref, pref);
          }
        }
        // Bool.
        if (type === 128) {
          if (this.prefs.prefHasUserValue(oldPref)) {
            var pref = this.prefs.getBoolPref(oldPref);
            this.prefs.setBoolPref(RESTORE_BRANCH + oldPref, pref);
          }
        }
      }

      // Clear the existing HTTP and SSL proxies.
      // We restore these when TorBirdy is uninstalled.
      this.prefs.setCharPref("network.proxy.http", "");
      this.prefs.setIntPref("network.proxy.http_port", 0);
      this.prefs.setCharPref("network.proxy.ssl", "");
      this.prefs.setIntPref("network.proxy.ssl_port", 0);

      // Disable all plugins.
      for(var i = 0; i < this.plugins.length; i++) {
          this.plugins[i].disabled = true;
      }

      // For only the first run (after that the user can configure the account if need be):
      //    Iterate through all accounts and disable automatic checking of emails.
      var accounts = this.acctMgr.accounts;
      for (var i = 0; i < accounts.Count(); i++) {
        var account = accounts.QueryElementAt(i, Ci.nsIMsgAccount).incomingServer;
        account.downloadOnBiff = false;
        account.loginAtStartUp = false;
        account.doBiff = false;

        // Depending on the account type, set the ports.
        if (account.type === "imap") {
          account.port = 993;
        }
        if (account.type === "pop3") {
          account.port = 995;
        }
        if (account.type === "nntp") {
          account.port = 563;
        }
        // SSL.
        // For nsIMsgIncomingServer, socketType 3 is SSL, as compared to the
        // manual account configuration wizard (emailwizard.js), where it is 2.
        account.socketType = 3;
      }
    }
    this.prefs.setBoolPref("extensions.torbirdy.first_run", false);
  },

}

if (XPCOMUtils.generateNSGetFactory)
  var NSGetFactory = XPCOMUtils.generateNSGetFactory([TorBirdy]);
else
  var NSGetModule = XPCOMUtils.generateNSGetModule([TorBirdy]);
