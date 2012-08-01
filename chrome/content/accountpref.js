// Per-account configuration dialog.
var account = window.arguments[0];

function onLoad() {
  var nameLabel = document.getElementById("account-name");
  var startup = document.getElementById("check-startup");

  var dobiff = document.getElementById("check-new");
  var biffminutes = document.getElementById("check-minutes");

  nameLabel.value = account.prettyName;

  if (account.loginAtStartUp) {
    startup.checked = true;
  } else {
    startup.checked = false;
  }

  if (account.doBiff) {
    dobiff.checked = true;
    biffminutes.disabled = false;
    biffminutes.value = account.biffMinutes;
  } else {
    dobiff.checked = false;
    biffminutes.disabled = true;
  }
}

function onAccept() {
  var startup = document.getElementById("check-startup");
  var dobiff = document.getElementById("check-new");
  var biffminutes = document.getElementById("check-minutes");

  if (startup.checked) {
    account.loginAtStartUp = true;
  } else {
    account.loginAtStartUp = false;
  }

  if (dobiff.checked) {
    account.doBiff = true;
    account.biffMinutes = biffminutes.value;
  } else {
    account.doBiff = false;
  }
}

function onToggleCheck() {
  var biffminutes = document.getElementById("check-minutes");
  if (biffminutes.disabled) {
    biffminutes.disabled = false;
  } else {
    biffminutes.disabled = true;
  }
}
