let settings;
function getSettings() {
  settings = {
    prompt: document.getElementById("prompt").value,
    details: document.getElementById("details").value,
    neediness: document.getElementById("neediness").value,
    love: document.getElementById("love").value,
    professionalism: document.getElementById("professionalism").value,
    interval: document.getElementById("interval").value * 1000, // Convert to seconds
    upfront: document.getElementById("upfront").checked,
    status: document.getElementById("status").checked,
  };
}
function initial() {
  getSettings();
  document.getElementById("status").checked =
    localStorage.getItem("status") === "true";
  settings.status = document.getElementById("status").checked;
}
initial();
document.getElementById("status").addEventListener("click", () => {
  getSettings();
  localStorage.setItem("status", settings.status);
  console.log("Sending Settings from popup.js");
  chrome.runtime.sendMessage({ action: "toggleAutomation", settings });
});
