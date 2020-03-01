exports.session = class Session {
  constructor(chatId = 0) {
    this.chatId = chatId;
    this.spentCities = new Set();
  }
};
//  1. Отправить сообщение: Привет начинаем игру
exports.start = function(session, sessionIndex, bot) {
  let startMessage =
    "Начинаем игру. \nЯ называю город, а ты должен в ответ назвать любой город \nначинающийся на последнюю букву моего города.\nГорода не должны повторятся.";

  bot.sendMessage(session[sessionIndex].chatId, startMessage); //TypeError: Cannot read property 'chatId' of undefined

  let randCity = randomCity(cities);
  lastLetter = lastValidLetter(randCity);
  console.log("88 " + randCity + " буква: " + lastLetter);

  session[sessionIndex].spentCities.add(randCity);
  console.log(session[sessionIndex].spentCities);

  bot.sendMessage(session[sessionIndex].chatId, firstSymbToUpperCase(randCity));
  return;
};

exports.main = function(chatId, city) {
  let cities = [
    "Архангельск",
    "Борисполь",
    "Воронеж",
    "Гюмри",
    "Донецк",
    "Енакиево",
    "Жуковский",
    "Запорожье",
    "Изюм",
    "Йошкар-Ола",
    "Киев",
    "Лондон",
    "Москва",
    "Николаев",
    "Орёл",
    "Париж",
    "Ростов",
    "Селидово",
    "Трускавец",
    "Уфа",
    "Флоренция",
    "Харьков",
    "Цюрих",
    "Челябинск",
    "Шанхай",
    "Щёлково",
    "Ыгдыр",
    "Электросталь",
    "Юрмала",
    "Ялта"
  ];
  cities = cities.map(item => item.toLowerCase());
  city = city.toLowerCase();

  if (
    helpers.validMessage(chatId, city) &&
    checkCityInDB(chatId, city, lastLetter, cities)
  ) {
    spentCities.add(city);
    let sCity = selectCityByLetter(lastValidLetter(city), cities);
    //4. Если не осталось городов то писать «Я проиграл»
    if (sCity == -1 || sCity == undefined) {
      bot.sendMessage(
        chatId,
        "Игра окончена, я проиграл! \nГорода которые были названы:\n" +
          [...spentCities].join(", ")
      );
      bot.sendMessage(chatId, "Давай сыграем еще!");
      helpers.session(false);
      return;
    } else {
      spentCities.add(sCity);
      console.log(spentCities);
      lastLetter = lastValidLetter(sCity);
      //3. Ответить городом
      bot.sendMessage(chatId, helpers.firstSymbToUpperCase(sCity));
    }
  }
};

exports.lastValidLetter = function(str) {
  let lastLetter = str[str.length - 1];
  let invalidLetters = ["ь", "Ъ"];
  let i = 2;

  while (invalidLetters.includes(lastLetter) || str.length == i) {
    lastLetter = str[str.length - i];
    i++;
  }
  return lastLetter;
};

exports.selectCityByLetter = function(letter, cities) {
  let findCities = cities.filter(
    item => item[0] == letter && !spentCities.has(item)
  );
  //Условие ниже не срабатывает.. когда фильтр ничего не находит он должен вернуть пустой массив,
  //но проверка на пустой массив почему-то не срабатывает
  if (findCities == [] || findCities == undefined || findCities == NaN) {
    console.log("151 Город не найден");
    return -1;
  } else return helpers.randomCity(findCities);
};

exports.checkCityInDB = function(chatId, city, lastLetter, cities) {
  if (lastLetter != city[0]) {
    bot.sendMessage(
      chatId,
      "Нужно назвать город на букву " + lastLetter.toUpperCase()
    );
    return false;
  }
  //5. Если пользователь вводит город который уже вводил — ответить «нельзя повторять»
  if (spentCities.has(city)) {
    bot.sendMessage(chatId, "Этот город уже был назван!");
    return false;
  }
  return true;
};

exports.randomCity = function(arrCities) {
  return arrCities[helpers.getRandomInt(arrCities.length)];
};
