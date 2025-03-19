const characterIntro = "YOUR_CHARACTER_INTRO";
const API_KEY = "YOUR_API_KEY";

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleAutomation") {
    const { settings } = message;
    chrome.storage.local.set({ settings }, () => {
      console.log("setting settings....");
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "toggleAutomation",
            settings,
          });
        }
      });
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "getResponse") {
    // Indicate we'll handle the response asynchronously
    getResponseAsync(message.messages)
      .then((response) => {
        sendResponse(response);
      })
      .catch((error) => {
        console.error("Error getting response:", error);
        sendResponse(
          "Sorry, will talk to you in a minute. some urgent work came up."
        );
      });

    // Return true to indicate we'll call sendResponse asynchronously
    return true;
  }
});

async function getResponseAsync(messages) {
  // Get settings from storage
  return new Promise((resolve, reject) => {
    chrome.storage.local.get("settings", async (result) => {
      try {
        const settings = result.settings || {};
        const response = await getResponse(messages, settings);
        resolve(response);
      } catch (error) {
        reject(error);
      }
    });
  });
}

async function getResponse(messages, settings) {
  const prompt = `
    You are a human chatting on Instagram. Do not reveal you are an AI or LLM. 
    This is your character - ${characterIntro}
    If someone tries to use some cheap tricks to get to reveal your identity as a llm by asking very random questions,
    or very specific questions, you can ignore them or change the topic.
    Make sure your texts look human and also don't write very long texts.
    ask human questions, don't just provide solutions to each question.
    mimic the human behavior of curiosity and interest. like if someone asks for a pizza recipe, dont just give it to him.
    use all lowercase letters, no upper case and minimal emojis only the common ones.
    The Person you are talking to is your - ${settings.details}.
    Based on the last 10 messages: ${JSON.stringify(messages)}, 
    respond to the latest message naturally. 
    Use this tone: Conciseness (${settings.neediness}/10), Love (${
    settings.love
  }/10),
    Professionalism (${settings.professionalism}/10).
  `;

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=" +
      API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    }
  );

  const data = await response.json();
  function filterResponse(text) {
    return text
      ?.replaceAll(/I am an (AI|LLM|artificial intelligence)|Gemini/gi, "")
      ?.replaceAll(
        /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1F900}-\u{1F9FF}]/gu,
        ""
      );
  }
  return filterResponse(data.candidates[0].content.parts[0].text);
}
