# gameCities

Game Cities Telegram Bot

most popular commands in git:

git init //create a new repository
git add . //add all files in project folder to commit
git commit -m "first commit" //make a commit
git remote add origin https://github.com/Amenemhat/ManualTrade.git //push an existing repository
git push -u origin master //push an existing repository
git clone https://github.com/Amenemhat/gameCities -b master --no-tags //clone an existing repository
git branch gameCitiesInDev //create new local branch
git push origin --delete branch_name //delete origin branch
git branch -d gameCitiesInDev //delete branch
git branch //get list of branches
git checkout gameCitiesInDev //toggle between branches
git push origin HEAD //send selected branch to git
git pull origin gameCitiesInDev //Download all from selected branch

//======================================================================//

// Telegram API
let TelegramBot = require("node-telegram-bot-api");

if (!process.env.TELEGRAM_TOKEN) {
throw new Error("TELEGRAM_TOKEN env variable is missing");
}

// https://core.telegram.org/bots/api#getupdates
let bot = new TelegramBot(process.env.TELEGRAM_TOKEN, { polling: true });

bot.on("polling_error", m => console.log(m));

bot.onText(/\/echo (.+)/, function(msg, match) {
let fromId = msg.from.id;
console.log("fromId: " + fromId);
let resp = match[1];
bot.sendMessage(fromId, resp);
console.log(resp);
});
