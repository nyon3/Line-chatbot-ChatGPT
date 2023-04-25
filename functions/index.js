const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const line = require("@line/bot-sdk");
const {Configuration, OpenAIApi} = require("openai");

const runtimeOpts = {
  secrets: ["OPENAI_SECRET_KEY", "CHANNEL_ACCESS_TOKEN", "CHANNEL_SECRET"],
};

const configuration = new Configuration({
  apiKey: `${process.env.OPENAI_SECRET_KEY}`,
});
const openai = new OpenAIApi(configuration);
admin.initializeApp();

const app = express();
const config = {
  channelAccessToken: `${process.env.CHANNEL_ACCESS_TOKEN}`,
  channelSecret: `${process.env.CHANNEL_SECRET}`,
};
const client = new line.Client(config);

// eslint-disable-next-line no-undef
app.get("/", (req, res) => {
  // eslint-disable-next-line max-len
  res.send(`Hello from Firebase!!!`);
});

app.post("/webhook", async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.json({message: "success"});
  } catch (error) {
    console.error(error);
    res.status(500).end();
  }
});

// eslint-disable-next-line require-jsdoc
async function getAIResponse(prompt) {
  // eslint-disable-next-line no-async-promise-executor
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [
        {role: "system", content: "あなたは英会話の先生です、英会話を学び始めた初心者向けに簡単に英吾を教えてください。"},
        {role: "user", content: prompt},
      ],
    });
    return completion.data.choices[0].message.content;
  } catch (error) {
    console.error(error);
    return null;
  }
}
// eslint-disable-next-line require-jsdoc
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


// eslint-disable-next-line no-undef
exports.api = functions.runWith(runtimeOpts).https.onRequest(app);
