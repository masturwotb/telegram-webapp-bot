const express = require("express");
const cors = require("cors");
const TelegramBot = require("node-telegram-bot-api");
const fs = require("fs");
const app = express();
const port = 3000;

const TOKEN = "7949634115:AAFtu02mN7gfndchepDt-JMbv_mdI-F-RLI";
const WEBAPP_URL = "https://telegram-webapp-woad.vercel.app/"; // ✅ Сюда вставляется рабочая ссылка с Vercel

const bot = new TelegramBot(TOKEN, { polling: true });

app.use(cors());
app.use(express.static("public"));

const users = {};

function updateUser(id, data) {
    if (!users[id]) users[id] = {};
    Object.assign(users[id], data);
    fs.writeFileSync("public/data.json", JSON.stringify(users, null, 2));
}

// 👉 ОБРАБОТКА /start
bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    bot.sendMessage(chatId, 'Открой приложение:', {
        reply_markup: {
            inline_keyboard: [[
                {
                    text: "Открыть WebApp",
                    web_app: { url: WEBAPP_URL }
                }
            ]]
        }
    });
});

bot.on("message", async (msg) => {
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
    console.log(`WebApp сервер запущен на http://localhost:${port}`);
});
