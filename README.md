# ChatGPT Chatbot for LINE on Firebase

## Overview

This project integrates ChatGPT (using OpenAI's API) into a LINE chatbot deployed on Firebase. This chatbot can respond to text messages from LINE users and manage conversation history.

## Prerequisites

- Node.js
- npm
- Firebase CLI
- ngrok
- OpenAI API Key
- LINE Developer Account

## Setup

1. **Clone the Repository**

   ```bash
   git clone <repository_url>
   cd <repository_folder>
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Set Environment Variables**

    Create a `.env` file and set the following variables:
    - `OPENAI_SECRET_KEY`
    - `CHANNEL_ACCESS_TOKEN`
    - `CHANNEL_SECRET`

4. **Initialize Firebase**

   ```bash
   firebase init
   ```

   Follow the prompts to configure your Firebase project.

## Local Development

1. **Start the Development Server**

    ```bash
    firebase serve --only functions
    ```

2. **Expose Local Server using Ngrok**

    Open a new terminal and run:

    ```bash
    ngrok http 5001
    ```

    Note: Replace `5001` with the port number your Firebase functions are running on.

3. **Configure Webhook URL on LINE**

    - Go to your LINE Developer console.
    - Update the webhook URL to the forwarding URL provided by ngrok (e.g., `https://<your_ngrok_id>.ngrok.io/<project_path>/webhook`).

## Usage

Send text messages to your LINE bot. It will generate responses using the ChatGPT model and reply.

## Debugging

To check the chat history or any variables:

- Use `console.log()` in your functions to log values.
- Use the Firebase Functions logs to view real-time logs.

## License

TBD

---

Feel free to add more sections or details as you find necessary.