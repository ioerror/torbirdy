function startup() {
  // Set the time zone to UTC.
  var env = Components.classes["@mozilla.org/process/environment;1"].
                            getService(Components.interfaces.nsIEnvironment);
  env.set('TZ', 'UTC');

  var myPanel = document.getElementById("my-panel");
  myPanel.label = "Tor Enabled";
  myPanel.style.color = "green";
}

function onClickHandler(event) {
  switch(event.which) {
    case 1:
      alert("Torbutton for Thunderbird is currently enabled and is helping protect your anonymity.\n" +
              "\nTo disable Torbutton, go to Tools > Add-ons.");
      break;
  }
}

window.addEventListener("load", startup, false);
