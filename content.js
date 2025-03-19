// content.js
let settings;
let automationTimer;

// function submitMessage(text) {
//   console.log("Sending message:", text);
//   const input = document.querySelector("div[contenteditable='true']");
//   const button = document.querySelector("button[type='submit']");
//   if (input && button) {
//     input.innerText = text; // Use innerText for contenteditable div

//     // Trigger input event to ensure the UI updates
//     const inputEvent = new Event('input', { bubbles: true });
//     input.dispatchEvent(inputEvent);

//     // Small delay to ensure the UI registers the input
//     setTimeout(() => {
//       button.click();
//     }, 100);
//   } else {
//     console.log("No input or button found");
//   }
// }

function sendInstagramMessage(text) {
  // Find the contenteditable div
  const chatInput = document.querySelector('[aria-label="Message"]');
  if (!chatInput) {
    console.error("Chat input not found");
    return false;
  }

  // Focus the input
  chatInput.focus();

  // Clear any existing content first
  chatInput.innerHTML = "";

  // Create and dispatch appropriate events
  // 1. First simulate typing by dispatching input events
  const inputEvent = new InputEvent("input", {
    bubbles: true,
    cancelable: true,
    inputType: "insertText",
    data: text,
  });

  // Create a text node and paragraph for the message
  const paragraph = document.createElement("p");
  paragraph.className = "xat24cr xdj266r xdpxx8g";
  paragraph.setAttribute("dir", "ltr");

  const span = document.createElement("span");
  span.className = "x3jgonx";
  span.setAttribute("data-lexical-text", "true");
  span.textContent = text;

  paragraph.appendChild(span);
  chatInput.appendChild(paragraph);

  // Dispatch the input event
  chatInput.dispatchEvent(inputEvent);

  // Wait a bit to ensure the content is registered
  setTimeout(() => {
    const enterEvent = new KeyboardEvent("keydown", {
      key: "Enter",
      code: "Enter",
      keyCode: 13,
      which: 13,
      bubbles: true,
      cancelable: true,
      composed: true, // This helps the event cross the shadow DOM boundary if needed
    });

    chatInput.dispatchEvent(enterEvent);
  }, 100);

  return true;
}

function startAutomation() {
  console.log("Starting Automation at content.js");
  if (!settings || !settings.status) {
    console.log(
      "Master Switch is off or settings not initialized, returning..."
    );
    return;
  }

  let lastMessageCount = 0;

  function getLastMessages() {
    // Implement proper message retrieval logic here
    // This is a placeholder - you'll need to replace this with actual DOM parsing
    const messageElements = document.querySelectorAll(".message-container"); // Adjust selector to match Instagram's message containers
    const messages = [];

    if (messageElements.length > 0) {
      // Get the last 10 messages or fewer if there aren't 10
      const count = Math.min(10, messageElements.length);
      for (
        let i = messageElements.length - count;
        i < messageElements.length;
        i++
      ) {
        messages.push(messageElements[i].textContent);
      }
    }

    return messages.length > 0 ? messages : ["hi"]; // Return actual messages or fallback
  }

  function checkAndRespond() {
    const messages = getLastMessages();
    console.log("Checking and Responding, message count:", messages.length);

    if (messages.length > lastMessageCount) {
      console.log("New message detected");
      lastMessageCount = messages.length;
      getResponse(messages);
    }
  }

  if (settings.upfront) {
    getResponse(getLastMessages());
  } else {
    checkAndRespond();
  }

  // Clear existing timer if it exists
  if (automationTimer) {
    clearInterval(automationTimer);
  }

  // Set up new interval
  if (settings.status) {
    const interval = Math.max(3000, settings.interval || 10000); // Ensure minimum interval of 5 seconds
    console.log(`Setting automation interval to ${interval} milliseconds`);
    automationTimer = setInterval(checkAndRespond, interval);
  }
}

function getResponse(messages) {
  console.log("Requesting response from background script");
  chrome.runtime.sendMessage(
    { action: "getResponse", messages: messages || [] },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error:", chrome.runtime.lastError);
        return;
      }
      if (response) {
        console.log("Response received:", response.substring(0, 50) + "...");
        sendInstagramMessage(response);
      } else {
        console.error("No response received from background script");
      }
    }
  );
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleAutomation") {
    console.log("Settings received:", message.settings);
    settings = message.settings;

    // Clear existing timer if turning off
    if (!message.settings.status && automationTimer) {
      clearInterval(automationTimer);
      automationTimer = null;
      console.log("Automation turned off");
    } else if (message.settings.status) {
      startAutomation();
    }
  }
});

// // Initialize by checking for existing settings
// chrome.storage.local.get("settings", (result) => {
//   if (result.settings) {
//     settings = result.settings;
//     if (settings.status) {
//       console.log("Initializing automation with stored settings");
//       startAutomation();
//     }
//   }
// });
