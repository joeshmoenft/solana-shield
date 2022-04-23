async function enableShield() {
    console.log('Clicked Enable Shield');
    document.querySelector("#shield-status").innerHTML = "Shield <span class='green'>Enabled</span>";
    document.getElementById("enable-shield").style.visibility = "hidden";
    document.getElementById("disable-shield").style.visibility = "visible";

    let res = await fetch('activate/', {method: 'POST'});
}

async function disableShield() {
    console.log('Clicked Disable Shield');
    document.querySelector("#shield-status").innerHTML = "Shield <span class='red'>Disabled</span>";
    document.getElementById("disable-shield").style.visibility = "hidden";
    document.getElementById("enable-shield").style.visibility = "visible";

    let res = await fetch('deactivate/', {method: 'POST'});
}

async function getShieldStatus() {
  let res = await fetch('status/', {method: 'GET'});
  let shield_status = await res.text();
  if (shield_status == "activated") {
    document.getElementById("enable-shield").style.visibility = "hidden";
    document.getElementById("disable-shield").style.visibility = "visible";
    document.querySelector("#shield-status").innerHTML = "Shield <span class='green'>" + shield_status + "</span>";
  } else if (shield_status == "deactivated") {
    document.getElementById("disable-shield").style.visibility = "hidden";
    document.getElementById("enable-shield").style.visibility = "visible";
    document.querySelector("#shield-status").innerHTML = "Shield <span class='red'>" + shield_status + "</span>";
  }
}

window.onload = function() {
  getShieldStatus();
  document.querySelector("#enable-shield").addEventListener("click", enableShield);
  document.querySelector("#disable-shield").addEventListener("click", disableShield);
};