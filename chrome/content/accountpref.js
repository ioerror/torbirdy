if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

if (!org.torbirdy.accountprefs) org.torbirdy.accountprefs = {

  account: window.arguments[0],

  onLoad: function() {
    var nameLabel = document.getElementById("torbirdy-account-name");
    this.startup = document.getElementById("torbirdy-check-startup");
    this.dobiff = document.getElementById("torbirdy-check-new");
    this.biffminutes = document.getElementById("torbirdy-check-minutes");
    nameLabel.value = this.account.prettyName;

    if (this.account.loginAtStartUp) {
      this.startup.checked = true;
    } else {
      this.startup.checked = false;
    }

    if (this.account.doBiff) {
      this.dobiff.checked = true;
      this.biffminutes.disabled = false;
      this.biffminutes.value = this.account.biffMinutes;
    } else {
      this.dobiff.checked = false;
      this.biffminutes.disabled = true;
      this.biffminutes.value = this.account.biffMinutes;
    }
  },

  onAccept: function() {
    if (this.startup.checked) {
      this.account.loginAtStartUp = true;
    } else {
      this.account.loginAtStartUp = false;
    }

    if (this.dobiff.checked) {
      this.account.doBiff = true;
      this.account.biffMinutes = this.biffminutes.value;
    } else {
      this.account.doBiff = false;
    }
  },

  onToggleCheck: function() {
    if (this.biffminutes.disabled) {
      this.biffminutes.disabled = false;
    } else {
      this.biffminutes.disabled = true;
    }
  }

};
