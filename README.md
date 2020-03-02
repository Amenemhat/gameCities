# gameCities

Game Cities Telegram Bot

most popular commands:
create a new repository on the command line
echo "# ManualTrade" >> README.md
git init
git add README.md
git commit -m "first commit"

push an existing repository from the command line
git remote add origin https://github.com/Amenemhat/ManualTrade.git
git push -u origin master

git clone https://github.com/Amenemhat/gameCities -b master --no-tags

Для удаления внешних веток используйте
git push origin --delete branch_name

Создаем новую ветку
git branch gameCitiesInDev

git add .
git commit -m "Disable city check"

удалить ветку
git branch -d gameCitiesInDev

получить список веток
git branch

переключение между ветками
git checkout gameCitiesInDev

Отправляет выбранную ветку на гит
git push origin HEAD

Download all from selected branch
git pull origin gameCitiesInDev

// Подключаем библиотеку для работы с Telegram API в переменную
let TelegramBot = require("node-telegram-bot-api");

if (!process.env.TELEGRAM_TOKEN) {
throw new Error("TELEGRAM_TOKEN env variable is missing");
}

// Включить опрос сервера. Бот должен обращаться к серверу Telegram, чтобы получать актуальную информацию
// Подробнее: https://core.telegram.org/bots/api#getupdates
let bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

//обработчик события polling_error
bot.on("polling_error", m => console.log(m));

// Написать мне ... (/echo Hello World! - пришлет сообщение с этим приветствием, то есть "Hello World!")
bot.onText(/\/echo (.+)/, function(msg, match) {
let fromId = msg.from.id;
console.log("fromId: " + fromId);
let resp = match[1];
bot.sendMessage(fromId, resp);
console.log(resp);
});
