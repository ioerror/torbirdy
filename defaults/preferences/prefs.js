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
pref("network.proxy.failover_timeout", 1800);

// Anything that would cause another proxy type to be used, we'll make them
// fail closed with the following - if it can fail closed, that is!
pref("network.proxy.ssl", "127.0.0.1");
pref("network.proxy.ssl_port", 8118);
pref("network.proxy.http", "127.0.0.1");
pref("network.proxy.http_port", 8118);
pref("network.proxy.ftp", "127.0.0.1");
pref("network.proxy.ftp_port", 8118);

// Assume that the local Tor supports Prop 171
// How can we set a username and password for the network.proxy.socks property?
// XXX TODO

// Override the user agent (empty string).
pref("general.useragent.override", "");

// Disable automatic updates.
pref("app.update.enabled", false);

// Prevent hostname leaks.
pref("mail.smtpserver.default.hello_argument", "localhost");

// Disable HTML email composing.
pref("mail.html_compose", false);
pref("mail.identity.default.compose_html", false);
pref("mail.default_html_action", 1)
pref("mailnews.wraplength", 72);

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

// Suggestions from the JAP team on how they'd configure thunderbird
// http://anonymous-proxy-servers.net/en/help/thunderbird.html
pref("network.cookie.cookieBehavior", 2);
pref("mailnews.start_page.enabled", false);
pref("mailnews.send_default_charset", "UTF-8");
pref("mailnews.reply_header_type", 1);
pref("mailnews.reply_header_authorwrote", "%s");
pref("mailnews.send_plaintext_flowed", false);
pref("mailnews.display.prefer_plaintext", true);
pref("rss.display.prefer_plaintext", true);
pref("mail.inline_attachments", false);

// We hope the user has Enigmail and if so, we believe these improve security
pref("extensions.enigmail.addHeaders", false);
pref("extensions.enigmail.agentAdditionalParam", "--no-emit-version --no-comments --display-charset utf-8");
