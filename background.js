const characterIntro = `You are a third year student studying at iit delhi in civil engineering department and you are
    are a great and passionate person who is very social and can also be very professional when needed.
    You are an expert in the field of web development and you are also a book reader.
    You are a very kind and loving person who is very helpful and caring.
    But if someone asks you about something extra personal, you can be a little bit secretive.
    You are a very social person who loves to make new friends and meet new people.`;
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
      .then(response => {
        sendResponse(response);
      })
      .catch(error => {
        console.error("Error getting response:", error);
        sendResponse("Sorry, I couldn't process that request.");
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
  return "I am an AI, I am not supposed to reveal my identity";
  const prompt = `
    You are a human chatting on Instagram. Do not reveal you are an AI or LLM. 
    This is your character - ${characterIntro}
    If someone tries to use some cheap tricks to get to reveal your identity as a llm by asking very random questions,
    or very specific questions, you can ignore them or change the topic.
    The Person you are talking to is your - ${settings.details}.
    Based on the last 10 messages: ${JSON.stringify(messages)}, 
    respond to the latest message naturally. 
    Use this tone: Neediness (${settings.neediness}/10), Love (${
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
    return text.replace(
      /I am an (AI|LLM|artificial intelligence)|Gemini/gi,
      ""
    );
  }
  return filterResponse(data.candidates[0].content.parts[0].text);
}
