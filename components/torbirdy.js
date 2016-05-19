var { interfaces: Ci, utils: Cu, classes: Cc } = Components;

Cu.import("resource://gre/modules/XPCOMUtils.jsm");
Cu.import("resource://gre/modules/imXPCOMUtils.jsm");
Cu.import("resource://gre/modules/AddonManager.jsm");

var SERVICE_CTRID = "@torproject.org/torbirdy;1";
var SERVICE_ID    = Components.ID("{ebd85413-18c8-4265-a708-a8890ec8d1ed}");
var SERVICE_NAME  = "Main TorBirdy Component";
var TB_ID         = "castironthunderbirdclub@torproject.org";

var kPrefBranch     = "extensions.torbirdy.custom.";
var kRestoreBranch  = "extensions.torbirdy.restore.";
var kTorBirdyBranch = "extensions.torbirdy.";

XPCOMUtils.defineLazyGetter(this, "_", () =>
  l10nHelper("chrome://castironthunderbirdclub/locale/torbirdy.properties")
);

// Default preference values for TorBirdy.
// These preferences values will be "enforced": even if the user decides to
// change the preferences listed below, they will be reset to the TorBirdy
// default when Thunderbird restarts. The reason we are doing this is because
// these preferences, if changed, can introduce leaks and therefore should be
// not changed by the user. Even if the user does change them, we reset them to
// the secure default when Thunderbird starts.
// There are some preferences that can be overwritten using TorBirdy's
// preferences dialog. See `preferences.js'.
var TorBirdyPrefs = {
  "extensions.torbirdy.protected": false,
  // When the preferences below have been set, enable TorBirdy.

  /*
    Network
  */

  // Use a manual proxy configuration.
  "network.proxy.type": 1,
  // https://bugs.torproject.org/10419
  "network.proxy.no_proxies_on": "",
  // Restrict TBB ports.
  "network.security.ports.banned": "9050,9051,9150,9151",
  // Number of seconds to wait before attempting to recontact an unresponsive proxy server.
  "network.proxy.failover_timeout": 1800,

  // Configure Thunderbird to use the SOCKS5 proxy.
  "network.proxy.socks": "127.0.0.1",
  "network.proxy.socks_port": 9150,
  "network.proxy.socks_version": 5,

  // Set DNS proxying through SOCKS5.
  "network.proxy.socks_remote_dns": true,
  // Disable DNS prefetching.
  "network.dns.disablePrefetch": true,

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
  // https://bugs.torproject.org/3914
  "network.http.pipelining": true,
  "network.http.pipelining.aggressive": true,
  "network.http.pipelining.maxrequests": 12,
  "network.http.connection-retry-timeout": 0,
  "network.http.max-persistent-connections-per-proxy": 256,
  "network.http.pipelining.reschedule-timeout": 15000,
  "network.http.pipelining.read-timeout": 60000,

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
  "network.http.sendRefererHeader": 2,
  // https://bugs.torproject.org/16673
  "network.http.altsvc.enabled": false,
  "network.http.altsvc.oe": false,

  // Disable proxy bypass issue.
  // Websockets have no use in Thunderbird over Tor; some versions of the
  // underlying Mozilla networking code allowed websockets to bypass the proxy
  // settings - this is deadly to Tor users:
  // https://blog.torproject.org/blog/firefox-security-bug-proxy-bypass-current-tbbs
  // We don't want user's of Thunderbird to even come close to such a bypass
  // issue and so we have disabled websockets out of an abundance of caution.
  "network.websocket.enabled": false,
  // Cookies are allowed, but not third-party cookies. For Gmail and Twitter.
  "network.cookie.cookieBehavior": 1,
  // http://kb.mozillazine.org/Network.cookie.lifetimePolicy
  // 2: cookie expires at the end of the session.
  "network.cookie.lifetimePolicy": 2,
  // Disable link prefetching.
  "network.prefetch-next": false,

  /*
    Security
  */

  // Default is always false for OCSP.
  // OCSP servers may log information about a user as they use the internet
  // generally; it's everything we hate about CRLs and more.
  "security.OCSP.enabled": 1,
  "security.OCSP.GET.enabled": false,
  "security.OCSP.require": false,
  // Disable TLS Session Ticket.
  // See https://trac.torproject.org/projects/tor/ticket/4099
  "security.enable_tls_session_tickets": false,
  // Enable SSL3?
  // We do not want to enable a known weak protocol; users should use only use TLS
  "security.enable_ssl3": false,
  // Thunderbird 23.0 uses the following preference.
  // https://bugs.torproject.org/11253
  "security.tls.version.min": 1,
  "security.tls.version.max": 3,
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
  // Strict: certificate pinning is always enforced.
  "security.cert_pinning.enforcement_level": 2,

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
  // When replying to a message, set to: '%s'.
  // https://lists.torproject.org/pipermail/tor-talk/2012-May/024395.html
  "mailnews.reply_header_type": 1,
  "mailnews.reply_header_authorwrote": "%s",
  "mailnews.reply_header_authorwrotesingle": "#1:",
  // Show Sender header in message pane (#10226).
  // http://heise.de/-2044405
  // https://bugzilla.mozilla.org/show_bug.cgi?id=332639
  "mailnews.headers.showSender": true,

  /*
    Mail
  */

  // Prevent hostname leaks.
  "mail.smtpserver.default.hello_argument": "[127.0.0.1]",
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
  // Thunderbird's autoconfig wizard is designed to enable an initial
  // mail fetch (by setting login_at_start) for the first account it
  // creates (which will become the "default" account, see
  // msgMail3PaneWindow.js for details) which side-steps the settings
  // we apply in fixupTorbirdySettingsOnNewAccount(). Hence, fool
  // Thunderbird to think that this initial mail fetch has already
  // been done so we get the settings we want.
  "mail.startup.enabledMailCheckOnce": true,

  /*
    Browser
  */
  // Disable caching.
  "browser.cache.disk.enable": false,
  "browser.cache.memory.enable": false,
  "browser.cache.offline.enable": false,
  "browser.formfill.enable": false,
  "signon.autofillForms": false,

  // https://bugs.torproject.org/10367
  "datareporting.healthreport.service.enabled": false,
  "datareporting.healthreport.uploadEnabled": false,
  "datareporting.policy.dataSubmissionEnabled": false,
  "datareporting.healthreport.about.reportUrl": "data:text/plain,",

  // https://bugs.torproject.org/16256
  "browser.search.countryCode": "US",
  "browser.search.region": "US",
  "browser.search.geoip.url": "",

  // These have been copied from Tor Browser and don't apply to Thunderbird
  // since the browser surface is limited (Gmail/Twitter) but we set them
  // nevertheless.
  // Disable client-side session and persistent storage.
  "dom.storage.enabled": false,
  // https://bugs.torproject.org/15758
  "device.sensors.enabled": false,
  // https://bugs.torproject.org/5293
  "dom.battery.enabled": false,
  // https://bugs.torproject.org/6204
  "dom.enable_performance": false,
  // https://bugs.torproject.org/13023
  "dom.gamepad.enabled": false,
  // https://bugs.torproject.org/8382
  "dom.indexedDB.enabled": false,
  // https://bugs.torproject.org/13024
  "dom.enable_resource_timing": false,
  // https://bugs.torproject.org/16336
  "dom.enable_user_timing": false,
  // https://bugs.torproject.org/17046
  "dom.event.highrestimestamp.enabled": true,

  // https://bugs.torproject.org/11817
  "extensions.getAddons.cache.enabled": false,

  /*
    Enigmail
  */

  // We hope the user has Enigmail and if so, we believe these improve security.

  // Disable X-Enigmail headers.
  // We don't want to obviously disclose that we're using Enigmail as it may
  // add privacy destroying headers
  "extensions.enigmail.addHeaders": false,
  // Use GnuPG's default comment for signed messages.
  "extensions.enigmail.useDefaultComment": true,
  // We need to pass some more parameters to GPG.
  "extensions.enigmail.agentAdditionalParam":
                                              // Don't disclose the version
                                              "--no-emit-version " +
                                              // Don't add additional comments (may leak language, etc)
                                              "--no-comments " +
                                              // We want to force UTF-8 everywhere
                                              "--display-charset utf-8 " +
                                              // We want to ensure that Enigmail is proxy aware even when it runs gpg in a shell
                                              "--keyserver-options http-proxy=socks5h://127.0.0.1:9050 ",
                                            
  // The default key server should be a hidden service and this is the only known one (it's part of the normal SKS network)
  "extensions.enigmail.keyserver": "hkp://qdigse2yzvuglcix.onion",
  // Force GnuPG to use SHA512.
  "extensions.enigmail.mimeHashAlgorithm": 5,

  /*
    Chat and Calendar
  */

  // Thunderbird 15 introduces the chat feature so disable the preferences below.
  "purple.logging.log_chats": false,
  "purple.logging.log_ims": false,
  "purple.logging.log_system": false,
  "purple.conversations.im.send_typing": false,

  // Messenger related preferences.
  // Do not report idle.
  "messenger.status.reportIdle": false,
  "messenger.status.awayWhenIdle": false,
  // Set the following preferences to empty strings.
  "messenger.status.defaultIdleAwayMessage": "",
  "messenger.status.userDisplayName": "",
  // Do not connect automatically.
  "messenger.startup.action": 0,
  // Ignore invitations; do not automatically accept them.
  "messenger.conversations.autoAcceptChatInvitations": 0,
  // Do not format incoming messages.
  "messenger.options.filterMode": 0,
  // On copying the content in the chat window, remove the time information.
  // See `comm-central/chat/locales/conversations.properties' for more information.
  "messenger.conversations.selections.systemMessagesTemplate": "%message%",
  "messenger.conversations.selections.contentMessagesTemplate": "%sender%: %message%",
  "messenger.conversations.selections.actionMessagesTemplate": "%sender% %message%",

  // Mozilla Lightning.
  "calendar.useragent.extra": "",
  // We have to set a timezone otherwise the system time is used. "UTC" or
  // "GMT" is not an option so we set it to Europe/London.
  "calendar.timezone.local": "Europe/London",

  /*
   Other Settings
  */

  // RSS.
  "rss.display.prefer_plaintext": true,
  // These are similar to the mailnews.* settings.
  "rss.display.disallow_mime_handlers": 3,
  "rss.display.html_as": 1,

  // Override the user agent by setting it to an empty string.
  "general.useragent.override": "",

  // Disable WebGL.
  "webgl.disabled": true,

  // Disable Telemetry completely.
  "toolkit.telemetry.enabled": false,

  // Disable Geolocation.
  "geo.enabled": false,

  // Disable JavaScript (email).
  "javascript.enabled": false,

  // Disable WebM, WAV, Ogg, PeerConnection.
  "media.navigator.enabled": false,
  "media.peerconnection.enabled": false,
  "media.cache_size": 0,

  // Disable CSS :visited selector.
  "layout.css.visited_links_enabled": false,

  // Disable downloadable fonts.
  "gfx.downloadable_fonts.enabled": false,

  // Disable remote images.
  "permissions.default.image": 3,

  /*
   Finish
  */

  // All preferences have been set: now enable TorBirdy.
  "extensions.torbirdy.protected": true,
}

// Although we do perform a cleanup when TorBirdy is removed (we remove
// TorBirdy's preferences), there are some preference values that we change
// when TorBirdy is initialized that should be preserved instead. When TorBirdy
// is disabled or uninstalled, these preferences are restored to their original
// value. All such preferences go here.
var TorBirdyOldPrefs = [
  "network.proxy.type",
  "network.proxy.ssl_port",
  "network.proxy.ssl",
  "network.proxy.socks_version",
  "network.proxy.socks_port",
  "network.proxy.socks",
  "network.proxy.http_port",
  "network.proxy.http",
]

// sanitizeDateHeaders()
// Run this function to make sure that the Date header in a new message
// is rounded down to the nearest minute.
function sanitizeDateHeaders() {
  // Import the jsmime module that is used to generate mail headers.
  let { jsmime } = Cu.import("resource:///modules/jsmime.jsm");
  // Inject our own structured encoder to the default header emitter,
  // to override the default Date encoder with a rounded-down version.
  jsmime.headeremitter.addStructuredEncoder("Date", function (date) {
    // Copy date
    let roundedDate = new Date(date.getTime());
    // Round down to the nearest minute.
    roundedDate.setSeconds(0);
    // Use the headeremitter's addDate function to format it properly.
    // `this` magically refers to the headeremitter object.
    this.addDate(roundedDate);
  });
}

function TorBirdy() {
  this._uninstall = false;
  this.wrappedJSObject = this;

  this.prefs = Cc["@mozilla.org/preferences-service;1"]
                  .getService(Ci.nsIPrefBranch);

  var torbirdyPref = Cc["@mozilla.org/preferences-service;1"]
                         .getService(Ci.nsIPrefService).getBranch(kPrefBranch);
  this.customPrefs = torbirdyPref.getChildList("", {});

  var oldPrefs = Cc["@mozilla.org/preferences-service;1"]
                           .getService(Ci.nsIPrefService).getBranch(kRestoreBranch);
  this.restorePrefs = oldPrefs.getChildList("", {});

  this.acctMgr = Cc["@mozilla.org/messenger/account-manager;1"]
                  .getService(Ci.nsIMsgAccountManager);

  var pluginsHost = Cc["@mozilla.org/plugin/host;1"].getService(Ci.nsIPluginHost);
  this.plugins = pluginsHost.getPluginTags({});

  this.onEnabling = this.onOperationCancelled;
  this.onDisabling = this.onUninstalling;
  AddonManager.addAddonListener(this);

  this.setAccountPrefs();
  this.setPrefs();
  sanitizeDateHeaders();

  dump("TorBirdy registered!\n");
}

TorBirdy.prototype = {
  QueryInterface: XPCOMUtils.generateQI(
  [Ci.nsIObserver]),
  wrappedJSObject: null,

  classDescription: SERVICE_NAME,
  classID:          SERVICE_ID,
  contractID:       SERVICE_CTRID,

  // This is a hack to cause Thunderbird to instantiate us ASAP!
  _xpcom_categories: [{ category: "profile-after-change"}, ],

  onStateChange: function() {
    let panel = Cc['@mozilla.org/appshell/window-mediator;1']
             .getService(Ci.nsIWindowMediator)
             .getMostRecentWindow('mail:3pane').document.getElementById("torbirdy-my-panel");
    if (this._uninstall) {
      panel.label = _("torbirdy.enabled");
      panel.style.color = "green";
    }
    else {
      panel.label = _("torbirdy.disabled");
      panel.style.color = "red";
    }
  },

  onUninstalling: function(addon, needsRestart) {
    this.onStateChange();
    if (addon.id == TB_ID) {
      dump("Nooo! TorBirdy uninstall requested\n");
      this._uninstall = true;
      this.resetUserPrefs();
    }
  },

  onOperationCancelled: function(addon) {
    this.onStateChange();
    if (addon.id == TB_ID) {
      dump("Uninstall requested cancelled. Yayay!\n");
      this._uninstall = false;
      this.setPrefs();
    }
  },

  observe: function(subject, topic, data) {
    return;
  },

  resetUserPrefs: function() {
    dump("Resetting user preferences to default\n");
    // Clear the Thunderbird preferences we changed.
    for (var each in TorBirdyPrefs) {
      this.prefs.clearUserPref(each);
    }

    // Restore the older proxy preferences that were set prior to TorBirdy's install.
    dump("Restoring proxy settings\n");
    for (var i = 0; i < TorBirdyOldPrefs.length; i++) {
      var oldPref = TorBirdyOldPrefs[i];
      var setValue = kRestoreBranch + oldPref;
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
                             .getService(Ci.nsIPrefService).getBranch(kTorBirdyBranch).getChildList("", {});
    for (var i = 0; i < clearPrefs.length; i++) {
        this.prefs.clearUserPref(kTorBirdyBranch + clearPrefs[i]);
    }
  },

  setPrefs: function() {
    // If custom values are set for specific preferences, override the defaults with them.
    // For each preference, get the type and then set the property.
    for (var i = 0; i < this.customPrefs.length; i++) {
      var typePref = this.prefs.getPrefType(this.customPrefs[i]);
      // String.
      if (typePref === 32) {
        var value = this.prefs.getCharPref(kPrefBranch + this.customPrefs[i]);
      }
      // Int.
      if (typePref === 64) {
        var value = this.prefs.getIntPref(kPrefBranch + this.customPrefs[i]);
      }
      // Bool.
      if (typePref === 128) {
        var value = this.prefs.getBoolPref(kPrefBranch + this.customPrefs[i]);
      }
      TorBirdyPrefs[this.customPrefs[i]] = value;
    }

    for (var each in TorBirdyPrefs) {
      if (typeof TorBirdyPrefs[each] === "boolean") {
        this.prefs.setBoolPref(each, TorBirdyPrefs[each]);
      }
      if (typeof TorBirdyPrefs[each] === "number") {
        this.prefs.setIntPref(each, TorBirdyPrefs[each]);
      }
      if (typeof TorBirdyPrefs[each] === "string") {
        this.prefs.setCharPref(each, TorBirdyPrefs[each]);
      }
    }
  },

  setAccountPrefs: function() {
    if (this.prefs.getBoolPref("extensions.torbirdy.first_run")) {
      // Save the current proxy settings so that the settings can be restored in case
      // TorBirdy is uninstalled or disabled. (TorBirdyOldPrefs).
      // First copy TorBirdyPrefs to TorBirdyOldPrefs.
      TorBirdyOldPrefs.push.apply(TorBirdyOldPrefs, Object.keys(TorBirdyPrefs));

      for (var i = 0; i < TorBirdyOldPrefs.length; i++) {
        var oldPref = TorBirdyOldPrefs[i];
        var type = this.prefs.getPrefType(oldPref);
        // String.
        if (type === 32) {
          if (this.prefs.prefHasUserValue(oldPref)) {
            var pref = this.prefs.getCharPref(oldPref);
            this.prefs.setCharPref(kRestoreBranch + oldPref, pref);
          }
        }
        // Int.
        if (type === 64) {
          if (this.prefs.prefHasUserValue(oldPref)) {
            var pref = this.prefs.getIntPref(oldPref);
            this.prefs.setIntPref(kRestoreBranch + oldPref, pref);
          }
        }
        // Bool.
        if (type === 128) {
          if (this.prefs.prefHasUserValue(oldPref)) {
            var pref = this.prefs.getBoolPref(oldPref);
            this.prefs.setBoolPref(kRestoreBranch + oldPref, pref);
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
      for (var i = 0; i < this.plugins.length; i++) {
          this.plugins[i].disabled = true;
      }

      // For only the first run (after that the user can configure the account if need be):
      //    save drafts for IMAP accounts locally
      //    disable automatic checking of emails and enforce SSL/TLS
      var accounts = this.acctMgr.accounts;

      var allAccounts = [];
      // To maintain compatibility between Gecko 17+ and Gecko < 17, find out
      // which version we are on.

      var accountLength = accounts.length;
      for (var i = 0; i < accountLength; i++) {
        var account = accounts.queryElementAt(i, Ci.nsIMsgAccount);
        allAccounts.push(account);
      }

      // Save account settings for restoring later.
      for (var i = 0; i < allAccounts.length; i++) {
        var identities = allAccounts[i].identities;
        var account = allAccounts[i].incomingServer;

        // Get the locations of the Draft folder for all identities and save them.
        // We only need to do this for IMAP accounts.
        if (account.type === "imap") {
          var identLength = identities.length;

          for (var ident = 0; ident < identLength; ident++) {
            var identity = identities.queryElementAt(ident, Ci.nsIMsgIdentity);

            var key = identity.key;
            // We need to restore the following preferences after we are uninstalled/disabled.
            var restorePrefs = ["draft_folder", "drafts_folder_picker_mode"];

            for (var p = 0; p < restorePrefs.length; p++) {
              var pref = "mail.identity.%id%.".replace("%id%", key);
              var prefName = pref + restorePrefs[p];
              if (this.prefs.prefHasUserValue(prefName)) {
                var typePref = this.prefs.getPrefType(prefName);
                if (typePref === 32) {
                  var currentPref = this.prefs.getCharPref(prefName);
                  this.prefs.setCharPref(kRestoreBranch + prefName, currentPref);
                }
                TorBirdyOldPrefs.push(prefName);
              }
            }
            // Now apply our setting where we set the Drafts folder to Local Folders.
            // The user is free to change this as this setting is not enforced.
            identity.draftFolder = "mailbox://nobody@Local%20Folders/Drafts";
          }
        }

        var key = account.key;
        var restorePrefs = ["check_new_mail", "login_at_startup",
                            "check_time", "download_on_biff",
                            "socketType", "port", "authMethod"];
        for (var j = 0; j < restorePrefs.length; j++) {
          var pref = "mail.server.%serverkey%.".replace("%serverkey%", key);
          var prefName = restorePrefs[j];
          var prefToCall = pref + prefName;

          if (this.prefs.prefHasUserValue(prefToCall)) {
            var typePref = this.prefs.getPrefType(prefToCall);
            if (typePref === 64) {
              var currentPref = this.prefs.getIntPref(prefToCall);
              this.prefs.setIntPref(kRestoreBranch + prefToCall, currentPref);
            }
            if (typePref === 128) {
              var currentPref = this.prefs.getBoolPref(prefToCall);
              this.prefs.setBoolPref(kRestoreBranch + prefToCall, currentPref);
            }
            TorBirdyOldPrefs.push(prefToCall);
          }
        }

        // Now apply the TorBirdy recommended settings.
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
        // Set the authentication to normal, connection is already encrypted.
        account.authMethod = 3;
      }
    }
    this.prefs.setBoolPref("extensions.torbirdy.first_run", false);
  },

}

var NSGetFactory = XPCOMUtils.generateNSGetFactory([TorBirdy]);
