export {dict,set_lang,getDictValue};

let dict = {
    "en": {
        "Please enter a valid email":"Please enter a valid email",
        "Login":"Login",
        "Forgot ":"Forgot password?",
        "password?":"password?",
        "Username:":"Username:",
        "Password:":"Password:",
        "Language:":"Language:",
        "Russian":"Russian",
        "English":"English",
        "InfoDesk": "InfoDesk",
        "Couldn't synchronized bucket list": "Couldn't synchronized bucket list",
        "Settings": "Settings",
        "Favourites":"Favourites",
        "My Photos":"My Photos",
        "My Records":"My Records",
        "Import":"Import",
        "Regestry":"Regestry",
        "Data Sources:": "Data Sources:",
        "Maps:":"Maps:",
        "Draggable Marker:":"Draggable Marker:",
        "Enter E-mail":"Enter E-mail",
        "Enter Password":"Enter Password",
        "Enter Username":"Enter Username",
        "Use Drag'n'Drop":"Use Drag'n'Drop",
        "Zoom":"Zoom",
        "Search":"Search",
        "Location":"Location",
        "Draggable Marker:":"Draggable Marker:",
        "Photos":"Photos",
        "Audio":"Audio",
        "Wiki":"Wiki",
        "Info":"Info",
        "Hotels":"Hotels",
        "Finance":"Finance",
        "Sighseeings":"Sighseeings",
        "Food":"Food",
        "Fashion":"Fashion",
        "Grocery":"Grocery",
        "Museums":"Museums",
        "Entertainment":"Entertainment",
        "Auto":"Auto",
        "Bikes":"Bikes",
        "Quest":"Quest",
        "Pass":"Pass",
        "The Way To MEGA":"The Way To MEGA",
        "Hunting":"Hunting season for flyers is opened"
    },
    "ru" : {
        "Please enter a valid email":"Введите адрес e-mail",
        "Login":"Логин",
        "Forgot ":"Забыли пароль?",
        "password?":"пароль?",
        "Username:":"Имя пользователя:",
        "Password:":"Пароль:",
        "Language:":"Выбор языка:",
        "Russian":"Русский",
        "English":"Английский",
        "InfoDesk": "ИнфоДеск",
        "Couldn't synchronized bucket list": "Список целей не был синхронизирован",
        "Settings": "Настройки",
        "Favourites":"Любимое",
        "My Photos":"Мои фотки",
        "My Records":"Мои записи",
        "Import":"Импорт",
        "Regestry":"Регистрация",
        "Data Sources:": "Источники данных:",
        "Maps:":"Карты:",
        "Draggable Marker:":"Подвижный маркер:",
        "Enter E-mail":"Ведите e-mail",
        "Enter Password":"Введите пароль",
        "Enter Username":"Введите имя пользователя",
        "Use Drag'n'Drop":"Используйте перетаскиваение",
        "Zoom":"Масштаб",
        "Search":"Поиск",
        "Location":"Местоположение",
        "Draggable Marker:":"Подвижный маркер:",
        "Photos":"Фотки",
        "Audio":"Аудио",
        "Wiki":"Вики",
        "Info":"Информация",
        "Hotels":"Гостиницы",
        "Finance":"Финансы",
        "Sighseeings":"Достопримечательности",
        "Food":"Еда",
        "Fashion":"Мода",
        "Grocery":"Продукты",
        "Museums":"Музеи",
        "Entertainment":"Развлечения",
        "Auto":"Авто",
        "Bikes":"Велосипеды",
        "Quest":"Квест",
        "Pass":"Пройди",
        "The Way To MEGA":"Дорога в МЕГУ",
        "Hunting":"Открыт сезон охоты на летающие скидки"
    }
};

// Function for swapping dictionaries
var set_lang = function (dictionary) {
    $("[data-translate]").text(function () {
        var key = $(this).data("translate");
        if (dictionary.hasOwnProperty(key)) {
            return dictionary[key];
        }
    });

    $("input[title]").attr("title",function () {
        var key = $(this).attr("title");
        if (dictionary.hasOwnProperty(key)) {
            return dictionary[key];
        }
    });

    $("input[placeholder]").attr("placeholder",function () {
        var key = $(this).attr("placeholder");
        if (dictionary.hasOwnProperty(key)) {
            return dictionary[key];
        }
    });

};

function getDictValue(lang, key){
    return dict[lang][key];
}