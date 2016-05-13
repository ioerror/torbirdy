Components.utils.import("resource://gre/modules/Preferences.jsm");

if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

if (!org.torbirdy.nntpwizard) org.torbirdy.nntpwizard = new function() {
  var pub = {};

  pub.fixNntpPort = function(account) {
    let key = account.incomingServer.key;

    let pref_spec = [
      // Set the port to 563 and connection security to SSL/TLS (NNTPS).
      ['mail.server.%serverkey%.port', 563],
      ['mail.server.%serverkey%.socketType', 3]
    ];

    for each (var [pref_template, value] in pref_spec) {
      let pref = pref_template.replace("%serverkey%", key);
      Preferences.set(pref, value);
    }
  };

  // This is from mailnews/base/prefs/content/AccountWizard.xul : FinishAccount().
  FinishAccount = function() {
    try {
      var pageData = GetPageData();

      var accountData= gCurrentAccountData;

      if (!accountData)
      {
        accountData = new Object;
        // Time to set the smtpRequiresUsername attribute
        if (!serverIsNntp(pageData))
          accountData.smtpRequiresUsername = true;
      }

      // we may need local folders before account is "Finished"
      // if it's a pop3 account which defers to Local Folders.
      verifyLocalFoldersAccount();

      PageDataToAccountData(pageData, accountData);

      FixupAccountDataForIsp(accountData);

      // we might be simply finishing another account
      if (!gCurrentAccount)
        gCurrentAccount = createAccount(accountData);

      // transfer all attributes from the accountdata
      finishAccount(gCurrentAccount, accountData);

      setupCopiesAndFoldersServer(gCurrentAccount, getCurrentServerIsDeferred(pageData), accountData);

      if (gCurrentAccount.incomingServer.canBeDefaultServer)
        EnableCheckMailAtStartUpIfNeeded(gCurrentAccount);

      if (!document.getElementById("downloadMsgs").hidden) {
        // skip the default biff, we will load messages manually if needed
        window.opener.gLoadStartFolder = false;
        if (document.getElementById("downloadMsgs").checked) {
          window.opener.gNewAccountToLoad = gCurrentAccount; // load messages for new POP account
        }
      }

      pub.fixNntpPort(gCurrentAccount);

      // in case we crash, force us a save of the prefs file NOW
      try {
        MailServices.accounts.saveAccountInfo();
      }
      catch (ex) {
        dump("Error saving account info: " + ex + "\n");
      }
      window.close();
      if(top.okCallback)
      {
        var state = true;
        //dump("finish callback");
        top.okCallback(state);
      }
    }
    catch(ex) {
      dump("FinishAccount failed, " + ex +"\n");
    }
  };

  return pub;
};
