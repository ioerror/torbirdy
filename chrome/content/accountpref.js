if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

if (!org.torbirdy.accountprefs) org.torbirdy.accountprefs = new function() {
  var pub = {};

  pub.account = window.arguments[0];

  pub.onLoad = function() {
    pub.nameLabel = document.getElementById("torbirdy-account-name");
    pub.startup = document.getElementById("torbirdy-check-startup");
    pub.dobiff = document.getElementById("torbirdy-check-new");
    pub.biffminutes = document.getElementById("torbirdy-check-minutes");
    pub.nameLabel.value = pub.account.prettyName;

    if (pub.account.loginAtStartUp) {
      pub.startup.checked = true;
    } else {
      pub.startup.checked = false;
    }

    if (pub.account.doBiff) {
      pub.dobiff.checked = true;
      pub.biffminutes.disabled = false;
      pub.biffminutes.value = pub.account.biffMinutes;
    } else {
      pub.dobiff.checked = false;
      pub.biffminutes.disabled = true;
      pub.biffminutes.value = pub.account.biffMinutes;
    }
  };

  pub.onAccept = function() {
    if (pub.startup.checked) {
      pub.account.loginAtStartUp = true;
    } else {
      pub.account.loginAtStartUp = false;
    }

    if (pub.dobiff.checked) {
      pub.account.doBiff = true;
      pub.account.biffMinutes = pub.biffminutes.value;
    } else {
      pub.account.doBiff = false;
    }
  };

  pub.onToggleCheck = function() {
    if (pub.biffminutes.disabled) {
      pub.biffminutes.disabled = false;
    } else {
      pub.biffminutes.disabled = true;
    }
  };

  return pub;
};
