const TelegramBot = require("node-telegram-bot-api");

// Create a new bot with your Telegram API token
const bot = new TelegramBot("6234916071:AAHkshbBG8bj5PKdmkCUzDhvwVKHhD2HLSM", {
  polling: true,
});

// Set the chat ID of your channel
const chatId = "-1001627135402";

// Send a message to the channel
bot
  .sendMessage(chatId, "Hello, world!")
  .then(() => {
    console.log("Message sent successfully!");
  })
  .catch((error) => {
    console.error("Error sending message:", error);
  });
