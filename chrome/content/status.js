/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
*/
window.addEventListener("load", function(e) {
  startup();
}, false);

function startup() {
  var myPanel = document.getElementById("my-panel");
  myPanel.label = "Tor Enabled";
  myPanel.style.color = "green";
}

function onClickHandler(event) {
  switch(event.which) {
    case 1:
      alert("Torbutton for Thunderbird is currently enabled and is helping protect your anonymity.\n\nTo disable Torbutton, go to Tools > Add-ons.");
      break;
  }
}
