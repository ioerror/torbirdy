if (!org) var org = {};
if (!org.torbirdy) org.torbirdy = {};

org.torbirdy.firstrun = new function() {
  var pub = {};

  pub.onLoad = function() {
    var strings = document.getElementById("torbirdy-strings-firstrun");

    var description = document.getElementById("torbirdy-firstrun-info");
    description.textContent = strings.getString("torbirdy.firstrun");

    var torbirdyWebsite = strings.getString("torbirdy.website");
    var website = document.getElementById("torbirdy-website");
    website.value = torbirdyWebsite;
  };

  return pub;
};
