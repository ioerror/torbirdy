// Per-account configuration dialog.
var account = window.arguments[0];

function onLoad() {
  var nameLabel = document.getElementById("account-name");
  var startup = document.getElementById("check-startup");
  nameLabel.value = account.prettyName;

  if (account.loginAtStartUp) {
    startup.checked = true;
  } else {
    startup.checked = false;
  }
}

function onAccept() {
  var startup = document.getElementById('check-startup');
  if (startup.checked) {
    account.loginAtStartUp = true;
  } else {
    account.loginAtStartUp = false;
  }
}
