/*
  Default preference values for Torbutton for Thunderbird.
*/

// Network settings.
pref("network.proxy.socks_remote_dns", true);
pref("network.proxy.socks", "127.0.0.1");
pref("network.proxy.socks_port", 9050);
pref("network.proxy.socks_version", 5);
pref("network.proxy.no_proxies_on", "localhost, 127.0.0.1");
pref("network.proxy.type", 1);

// Override the user agent (empty string).
pref("general.useragent.override", "");

// Disable automatic updates.
pref("app.update.enabled", false);

// Prevent hostname leaks.
pref("mail.smtpserver.default.hello_argument", "localhost");

// Disable HTML email composing.
pref("mail.html_compose", false);
pref("mail.identity.default.compose_html", false);
pref("mail.default_html_action", 1);

// https://lists.torproject.org/pipermail/tor-talk/2011-September/021398.html
// "Towards a Tor-safe Mozilla Thunderbird"
// These options enable a warning that tagnaq suggests.
pref("network.protocol-handler.warn-external.http", true);
pref("network.protocol-handler.warn-external.https", true);

// Enigmail specific preferences.
pref("extensions.enigmail.addHeaders", false);
pref("extensions.enigmail.useDefaultComment", true);
pref("extensions.enigmail.agentAdditionalParam", "--no-emit-version");

// Disallow cookies.
pref("network.cookie.cookieBehavior", 2);

// Mailnews.
pref("mailnews.reply_header_type", 1);
pref("mailnews.reply_header_authorwrote", "%s");
pref("mailnews.send_plaintext_flowed", false);
pref("mailnews.wraplength", 72);
pref("mailnews.start_page.enabled", false);
