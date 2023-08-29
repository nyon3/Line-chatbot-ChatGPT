const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const line = require("@line/bot-sdk");
const {Configuration, OpenAIApi} = require("openai");

// Define runtime options for Firebase Functions
const runtimeOpts = {
  secrets: ["OPENAI_SECRET_KEY", "CHANNEL_ACCESS_TOKEN", "CHANNEL_SECRET"],
};

// Create a new OpenAI configuration object
const configuration = new Configuration({
  apiKey: `${process.env.OPENAI_SECRET_KEY}`,
});

// Create a new OpenAI API object using the configuration
const openai = new OpenAIApi(configuration);

// Initialize the Firebase Admin SDK
admin.initializeApp();

// Create a new Express app
const app = express();

// Define configuration options for the LINE SDK
const config = {
  channelAccessToken: `${process.env.CHANNEL_ACCESS_TOKEN}`,
  channelSecret: `${process.env.CHANNEL_SECRET}`,
};

// Create a new LINE client using the configuration
const client = new line.Client(config);

// Define a route for the root URL
app.get("/", (req, res) => {
  res.send(`Hello from Firebase!!!`);
});

// Define a route for the LINE webhook
app.post("/webhook", async (req, res) => {
  try {
    // Handle each event in parallel
    await Promise.all(req.body.events.map(handleEvent));
    res.json({message: "success"});
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

// Define the maximum number of tokens allowed in a message
const maxTokens = 4096;

// Define an array to store the conversation history
const conversationHistory = [];

// Define a system prompt to use in the conversation
const systemPrompt = "あなたは役に立つAIロボ";

/**
 * Counts the number of tokens in a given message.
 * Tokens are considered to be separated by spaces.
 *
 * @param {string} message - The message to tokenize.
 * @return {number} - The number of tokens in the message.
 */
function countTokens(message) {
  return message.split("").length;
}

/**
 * Summarizes the conversation history using ChatGPT.
 *
 * @async
 * @param {Array} history - The conversation history to summarize.
 * @return {Promise<Array>} - An array containing a summarized system message.
 */
async function summarizeConversation(history) {
  try {
    const messages = [...history];
    messages.unshift(
        {role: "system", content: systemPrompt},
        {
          role: "assistant",
          content:
          "これまでの会話をアタナだけがわかるように、できるだけ手短に要約してください",
        },
    );

    const summary = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    });

    return [
      {role: "system", content: summary.data.choices[0].message.content},
    ];
  } catch (error) {
    console.error(error);
  }
}

/**
 * Generates an AI response to a given prompt using ChatGPT.
 *
 * @async
 * @param {string} prompt - The user's prompt.
 * @return {Promise<string|null>} - A promise that resolves to the AI response.
 */
async function getAIResponse(prompt) {
  try {
    // Add the new user message to the conversation history
    conversationHistory.push({role: "user", content: prompt});

    // Check if the conversation history exceeds the token limit
    const tokenCount = conversationHistory.reduce(
        (acc, msg) => acc + countTokens(msg.content),
        0,
    );

    let messages = [];
    if (tokenCount > maxTokens) {
      // If so, summarize the conversation, and begin a new conversation
      messages = await summarizeConversation(conversationHistory);
      conversationHistory.length = 0; // Clear the existing history
      conversationHistory.push(...messages); // Add the summary to the history
    } else {
      messages = [...conversationHistory];
    }
    messages.unshift({role: "system", content: systemPrompt});

    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages,
    });

    // Add the new assistant message to the conversation history
    conversationHistory.push({
      role: "assistant",
      content: completion.data.choices[0].message.content,
    });
    console.log("Updated chat history: " + JSON.stringify(conversationHistory, null, 2));

    return completion.data.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return null;
  }
}

/**
 * Handles an event from the LINE webhook.
 *
 * @async
 * @function handleEvent
 * @param {Object} event - The event object.
 * @return {Promise<Object|null>} - A promise that resolves to the response
 */
async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") {
    return Promise.resolve(null);
  }

  try {
    const inputText = event.message.text;
    const aiResponse = await getAIResponse(inputText);

    if (aiResponse === null) {
      return Promise.resolve(null);
    }
    const response = await client.replyMessage(event.replyToken, {
      type: "text",
      text: aiResponse,
    });
    return response;
  } catch (error) {
    console.error(error);
    return Promise.resolve(null);
  }
}

// Export the Express app as a Firebase Function
exports.api = functions.runWith(runtimeOpts).https.onRequest(app);
