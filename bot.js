const express = require("express");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

const TOKEN = "7949634115:AAFtu02mN7gfndchepDt-JMbv_mdI-F-RLI"; // ⚠️ Вставь свой токен сюда
const bot = new TelegramBot(TOKEN, { webHook: true });

// Telegram будет отправлять сюда POST-запросы
bot.setWebHook(`https://telegram-webapp-bot-972v.onrender.com/bot${TOKEN}`);

app.use(cors());
app.use(express.json()); // обязательно для POST-запросов
app.use(express.static("public"));

// Пример хранилища (файл)
const users = {};
function updateUser(id, data) {
  if (!users[id]) users[id] = {};
  Object.assign(users[id], data);
  fs.writeFileSync("public/data.json", JSON.stringify(users, null, 2));
}

// Входящие сообщения от Telegram
app.post(`/bot${TOKEN}`, (req, res) => {
  bot.processUpdate(req.body);
  res.sendStatus(200);
});

// Обработка текстовых сообщений
bot.on("message", (msg) => {
  const id = msg.from.id;
  const username = msg.from.username || "";
  const name = msg.from.first_name + (msg.from.last_name ? " " + msg.from.last_name : "");
  const phone = msg.contact ? msg.contact.phone_number : "";

  updateUser(id, {
    id,
    username,
    name,
    phone,
    avatars: users[id]?.avatars || [],
    usernames: users[id]?.usernames || [],
    phones: users[id]?.phones || [],
  });

  if (!users[id].usernames.includes(username)) users[id].usernames.push(username);
  if (phone && !users[id].phones.includes(phone)) users[id].phones.push(phone);

  bot.sendMessage(id, 'Открой приложение:', {
    reply_markup: {
      inline_keyboard: [[
        {
          text: "Открыть WebApp",
          web_app: { url: "https://telegram-webapp-woad.vercel.app/" }
        }
      ]]
    }
  });
});

bot.on("photo", (msg) => {
  const id = msg.from.id;
  const file_id = msg.photo[msg.photo.length - 1].file_id;
  if (!users[id]) return;

  if (!users[id].avatars.includes(file_id)) {
    users[id].avatars.push(file_id);
    updateUser(id, users[id]);
  }
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});
