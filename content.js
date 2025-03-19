// content.js
let settings;
let automationTimer;
let lastMessage;
let myLastMessage;
let lastMessageFromOther = true; // Track if the last message was from the other person

function sendInstagramMessage(text) {
  // Find the contenteditable div
  myLastMessage = text; // Store what our bot is sending
  lastMessageFromOther = false; // Mark that the last activity was our message

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

  function getLastMessages() {
    // Implement proper message retrieval logic here
    // This is a placeholder - you'll need to replace this with actual DOM parsing
    const messageElements = document.getElementsByClassName(
      "html-div xdj266r x11i5rnm xat24cr x1mh8g0r xexx8yu x4uap5 x18d9i69 xkhd6sd xeuugli x1vjfegm"
    ); // Adjust selector to match Instagram's message containers
    const messages = [];

    if (messageElements.length > 0) {
      // Get the last 10 messages or fewer if there aren't 10
      const count = Math.min(10, messageElements.length);
      for (
        let i = messageElements.length - count;
        i < messageElements.length;
        i++
      ) {
        if (messageElements[i] && messageElements[i].textContent) {
          messages.push(messageElements[i].textContent);
        }
      }
    }

    return messages; // Return actual messages
  }

  function checkAndRespond() {
    const messages = getLastMessages();
    console.log("Checking and Responding, Messages", messages);

    if (messages.length > 0) {
      const latestMessage = messages[messages.length - 1];

      // Check if the latest message is our own message
      const isOurMessage =
        latestMessage.replaceAll(
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu,
          ""
        ) ===
        myLastMessage?.replaceAll(
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu,
          ""
        );

      console.log("Latest message:", latestMessage);
      console.log(
        "Our last message:",
        myLastMessage?.replaceAll(
          /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu,
          ""
        )
      );
      console.log("Is our message:", isOurMessage);
      console.log("Last message from other:", lastMessageFromOther);

      // Only respond if the latest message is different from our last message
      // AND either it's the first message or the last message was from the other person
      if (latestMessage !== lastMessage && !isOurMessage) {
        console.log("New message from other person detected");
        lastMessage = latestMessage;
        lastMessageFromOther = true;
        getResponse(messages);
      } else if (!lastMessageFromOther) {
        console.log(
          "Waiting for response from other person - we sent the last message"
        );
      }
    }
  }

  // Clear existing timer if it exists
  if (automationTimer) {
    clearInterval(automationTimer);
  }

  // Set up new interval
  if (settings.status) {
    const interval = Math.max(8000, settings.interval || 10000); // Ensure minimum interval of 8 seconds
    console.log(`Setting automation interval to ${interval} milliseconds`);
    automationTimer = setInterval(checkAndRespond, interval);
  }
}

function getResponse(messages) {
  // Only get a response if the last message was from the other person
  if (!lastMessageFromOther) {
    console.log("Not requesting response because we sent the last message");
    return;
  }

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
        myLastMessage = response;
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