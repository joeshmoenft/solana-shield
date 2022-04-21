// Store for all of the jobs in progress
let jobs = {};

async function enableShield() {
    console.log('Clicked Enable Shield');
    document.querySelector("#shield-status").innerHTML = "Shield <span class='green'>Enabled</span>";
    document.getElementById("enable-shield").style.visibility = "hidden";
    document.getElementById("disable-shield").style.visibility = "visible";

    let res = await fetch('job/', {method: 'POST'});
    let job = await res.json();

}

async function disableShield() {
    console.log('Clicked Disable Shield');
    document.querySelector("#shield-status").innerHTML = "Shield <span class='red'>Disabled</span>";
    document.getElementById("disable-shield").style.visibility = "hidden";
    document.getElementById("enable-shield").style.visibility = "visible";

    let res = await fetch('job/stop', {method: 'POST'});
    jobs = {};
}

  // Attach click handlers and kick off background processes
  window.onload = function() {
  document.querySelector("#enable-shield").addEventListener("click", enableShield);
  document.querySelector("#disable-shield").addEventListener("click", disableShield);

};