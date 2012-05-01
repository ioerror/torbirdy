/* -*- Mode: javascript; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
*/
window.addEventListener("load", function(e) {
  startup();
}, false);

function startup() {
  var myPanel = document.getElementById("my-panel");
  myPanel.label = "Tor Enabled";
  myPanel.style.color = "red";
}

function onClickHandler(event) {
    switch(event.which) {
        case 1:
            alert("Go to Tools > Add-ons to disable Torbutton for Thunderbird.");
            break;
    }
}
