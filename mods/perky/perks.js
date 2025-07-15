(function() {
var abs = Math.abs, ceil = Math.ceil, floor = Math.floor, log = Math.log, max = Math.max, min = Math.min, pow = Math.pow, round = Math.round, sqrt = Math.sqrt;
var jobless = false;
var disabledPerks = [];
///
// HTML manipulation utilities
///
var $ = function (selector) { 
    const temp = document.querySelector("div.perkyMain " + selector); 
    if (temp == null) throw Error("Couldn't find selector " + selector);
    return temp;
};
var $$ = function (selector) { 
    const temp = [].slice.apply(document.querySelectorAll("div.perkyMain " + selector)); 
    if (temp == null) throw Error("Couldn't find selector " + selector);
    return temp;
};

///
// Read/write notations for big numbers
///
var notations = [
    [],
    ('KMBTQaQiSxSpOcNoDcUdDdTdQadQidSxdSpdOdNdVUvDvTvQavQivSxvSpvOvNvTgUtgDtgTtgQatg' +
        'QitgSxtgSptgOtgNtgQaaUqaDqaTqaQaqaQiqaSxqaSpqaOqaNqaQiaUqiDqiTqiQaqiQiqiSxqiSpqi' +
        'OqiNqiSxaUsxDsxTsxQasxQisxSxsxSpsxOsxNsxSpaUspDspTspQaspQispSxspSpspOspNspOgUog' +
        'DogTogQaogQiogSxogSpogOogNogNaUnDnTnQanQinSxnSpnOnNnCtUc').split(/(?=[A-Z])/),
    [],
    ('a b c d e f g h i j k l m n o p q r s t u v w x y z' +
        ' aa ab ac ad ae af ag ah ai aj ak al am an ao ap aq ar as at au av aw ax ay az' +
        ' ba bb bc bd be bf bg bh bi bj bk bl bm bn bo bp bq br bs bt bu bv bw bx by bz' +
        ' ca cb cc cd ce cf cg ch ci cj ck cl cm cn co cp cq cr cs ct cu cv cw cx').split(' '),
    'KMBTQaQiSxSpOcNoDcUdDdTdQadQidSxdSpdOdNdVUvDvTvQavQivSxvSpvOvNvTg'.split(/(?=[A-Z])/),
    [],
];

var last_perks = null;

function remove(elem) {
    elem.parentNode.removeChild(elem);
}
function show_alert(style, message) {
    console.log(message);
    // TODO: make a message popup on error
    //$('#alert').innerHTML += "<p class=".concat(style, ">\n\t\t\t<span class=badge onclick='remove(this.parentNode)'>\u00D7</span>\n\t\t\t").concat(message, "\n\t\t</p>");
}
function create_share(callback) {
    var share_string = localStorage.notation + ':';
    share_string += $$('input,select').map(function (field) { return field.value.replace(':', ''); }).join(':');
    var long_url = location.href.replace(/[#?].*/, '');
    long_url += '?' + LZString.compressToEncodedURIComponent(share_string);
    callback(long_url);
}
function exit_share() {
    history.pushState({}, '', 'perks.html');
    $('textarea').removeEventListener('click', exit_share);
    $$('[data-saved]').forEach(function (field) { return field.value = localStorage[field.id] || field.value; });
}
function load_share(str) {
    var values = LZString.decompressFromEncodedURIComponent(str).split(':');
    var notation = localStorage.notation;
    localStorage.notation = values.shift();
    $$('input,select').forEach(function (field) { return field.value = values.shift(); });
    $('textarea').addEventListener('click', exit_share);
    $('form').submit();
    localStorage.notation = notation || 1;
}
function prettify(number) {
    if (number < 0)
        return '-' + prettify(-number);
    if (number < 10000)
        return +number.toPrecision(4) + '';
    if (localStorage.notation === '0') // scientific
        return number.toExponential(2).replace('+', '');
    var unit = 0;
    while (number >= 999.5) {
        number /= 1000;
        ++unit;
    }
    var suffixes = notations[localStorage.notation || 1];
    var suffix = unit > suffixes.length ? "e".concat(3 * unit) : suffixes[unit - 1];
    return +number.toPrecision(3) + suffix;
}
function parse_suffixes(str) {
    str = str.toString();
    str = str.replace(/\*.*|[^--9+a-z]/gi, '');
    var suffixes = notations[localStorage.notation === '3' ? 3 : 1];
    for (var i = suffixes.length; i > 0; --i)
        str = str.replace(new RegExp(suffixes[i - 1] + '$', 'i'), "E".concat(3 * i));
    return +str;
}
function input(id) {
    return parse_suffixes($('#' + id).value);
}
function check_input(field) {
    var ok = isFinite(parse_suffixes(field.value));
    var notation = localStorage.notation === '3' ? 'alphabetic ' : '';
    field.setCustomValidity(ok ? '' : "Invalid ".concat(notation, "number: ").concat(field.value));
}
window.addEventListener('error', function (ev) {
    if (typeof ev.error == 'string') {
        show_alert('ko', ev.error);
        return;
    }
    if (ev.message == 'Script error.')
        return;
    create_share(function (url) { return show_alert('ko', "Oops! It\u2019s not your fault, but something went wrong. You can go pester the dev on\n\t<a href=https://github.com/Grimy/Grimy.github.io/issues/new>GitHub</a> or\n\t<a href=https://www.reddit.com/message/compose/?to=Grimy_>Reddit</a>, they\u2019ll fix it.\n\tIf you do, please include the following data:<br>\n\t<tt>".concat(url, "<br>").concat(ev.filename, " l").concat(ev.lineno || 0, "c").concat(ev.colno || 0, " ").concat(ev.message, "</tt>.")); });
});
///
// Handling Trimps save data
///
var p_game;
function mastery(name) {
    if (!p_game.talents[name])
        throw "unknown mastery: " + name;
    return p_game.talents[name].purchased;
}
function toggle_spoilers() {
    $$('[data-hide]').forEach(function (elem) {
        elem.style.display = +localStorage.hze >= +elem.getAttribute('data-hide') ? '' : 'none';
    });
}
function set_hze(zone) {
    if (!(+localStorage.hze > zone)) {
        localStorage.hze = zone;
        toggle_spoilers();
    }
}
function handle_paste(ev, read_save, main, data) {
    var save_string;
    
    if (ev == null || ev.clipboardData == null)
        if (data != null) save_string = data.replace(/\s/g, '');
        else return;
    else save_string = ev.clipboardData.getData("text/plain").replace(/\s/g, '');

    try {
        p_game = JSON.parse(LZString.decompressFromBase64(save_string));
        console.log(p_game);
        var min_version = 4.9;
        var max_version = 4.91;
        if (p_game.global.version > max_version + 0.009)
            show_alert('warning', "This calculator only supports up to v".concat(max_version, " of Trimps, but your save is from v").concat(p_game.global.version, ". Results may be inaccurate."));
        else if (p_game.global.version < min_version)
            show_alert('warning', "Trimps v".concat(min_version, " is out! Your save is still on v").concat(p_game.global.version, ", so you should refresh the p_game\u2019s page."));
    }
    catch (_a) {
        if (p_game && p_game.Looting)
            throw 'This is a perk string. You have to export your save (from the main screen), not your perks.';
        throw 'Your clipboard did not contain a valid Trimps save. Open the p_game, click “Export” then “Copy to Clipboard”, and try again.';
    }

    // disallows reapplication of perks
    if (p_game)
        for (var perk in p_game.portal)
            if (!isNaN(p_game.portal[perk].level) && p_game.portal[perk].level != null) p_game.portal[perk].level += p_game.portal[perk].levelTemp;
    
    localStorage.save = save_string;
    localStorage.notation = p_game.options.menu.standardNotation.enabled;
    disabledPerks = [];
    jobless = p_game.global.ShieldEquipped.name == "Job";
    set_hze(p_game.global.highestLevelCleared + 1);
    read_save();
    main();
}
function get_paste_back() {
    $('#save').value = localStorage.save;
    $('#save').onfocus = null;
    $('#save').focus();
    $('#save').select();
}
document.addEventListener("DOMContentLoaded", toggle_spoilers);
document.addEventListener("DOMContentLoaded", function () {
    var version = '2.4';
    if (version > localStorage.version)
        show_alert('ok', "Welcome to Trimps tools v".concat(version, "! See what\u2019s new in the <a href=changelog.html>changelog</a>."));
    localStorage.version = version;
    if (location.search)
        load_share(location.search.substr(1));
    $$('[data-saved]').forEach(function (field) {
        if (field.type === 'checkbox') {
            field.checked = localStorage[field.id] === 'true';
            field.addEventListener('change', function () { return localStorage[field.id] = field.checked; });
        }
        else {
            field.value = localStorage[field.id] || field.value;
            field.addEventListener('change', function () { return localStorage[field.id] = field.value; });
        }
    });
}, false);


var Perk = /** @class */ (function () {
    function Perk(base_cost, cost_increment, scaling, max_level, cost_exponent) {
        if (max_level === void 0) { max_level = Infinity; }
        if (cost_exponent === void 0) { cost_exponent = 1.3; }
        this.base_cost = base_cost;
        this.cost_increment = cost_increment;
        this.scaling = scaling;
        this.max_level = max_level;
        this.cost_exponent = cost_exponent;
        this.locked = true;
        this.level = 0;
        this.min_level = 0;
        this.cost = 0;
        this.gain = 0;
        this.bonus = 1;
        this.cost = this.base_cost;
    }
    Perk.prototype.levellable = function (he_left) {
        return !this.locked &&
            this.level < this.max_level &&
            this.cost * max(1, floor(this.level / 1e12)) <= he_left;
    };
    Perk.prototype.level_up = function (amount) {
        this.level += amount;
        this.bonus = this.scaling(this.level);
        if (this.cost_increment) {
            var spent = amount * (this.cost + this.cost_increment * (amount - 1) / 2);
            this.cost += amount * this.cost_increment;
            return spent;
        }
        else {
            var spent = this.cost;
            this.cost = ceil(this.level / 2 + this.base_cost * pow(this.cost_exponent, this.level));
            return spent;
        }
    };
    Perk.prototype.spent = function (log) {
        if (log === void 0) { log = false; }
        if (this.cost_increment)
            return this.level * (this.base_cost + this.cost - this.cost_increment) / 2;
        var total = 0;
        for (var x = 0; x < this.level; ++x)
            total += ceil(x / 2 + this.base_cost * pow(this.cost_exponent, x));
        return total;
    };
    Perk.prototype.log_ratio = function () {
        return this.cost_increment ? (this.scaling(1) - this.scaling(0)) / this.bonus
            : log(this.scaling(this.level + 1) / this.bonus);
    };
    return Perk;
}());
function validate_fixed() {
    try {
        parse_perks($('#fixed').value, 'l');
        $('#fixed').setCustomValidity('');
    }
    catch (err) {
        $('#fixed').setCustomValidity(err);
    }
}
var presets = {
    early: ['5', '4', '3'],
    broken: ['7', '3', '1'],
    mid: ['16', '5', '1'],
    corruption: ['25', '7', '1'],
    magma: ['35', '4', '3'],
    z280: ['42', '6', '1'],
    z400: ['88', '10', '1'],
    z450: ['500', '50', '1'],
    spire: ['0', '1', '1'],
    nerfed: ['0', '4', '3'],
    tent: ['5', '4', '3'],
    scientist: ['0', '1', '3'],
    carp: ['0', '0', '0'],
    trapper: ['0', '7', '1'],
    coord: ['0', '40', '1'],
    trimp: ['0', '99', '1'],
    metal: ['0', '7', '1'],
    c2: ['0', '7', '1'],
    income: ['0', '0', '0'],
    unesscented: ['0', '1', '0'],
    nerfeder: ['0', '1', '0'],
};
function select_preset(name, manually) {
    var _a;
    if (manually === void 0) { manually = true; }
    delete localStorage['weight-he'];
    delete localStorage['weight-atk'];
    delete localStorage['weight-hp'];
    delete localStorage['weight-xp'];
    _a = presets[name], $('#weight-he').value = _a[0], $('#weight-atk').value = _a[1], $('#weight-hp').value = _a[2];
    $('#weight-xp').value = floor((+presets[name][0] + +presets[name][1] + +presets[name][2]) / 5).toString();
}
function auto_preset() {
    var _a = presets[$('#preset').value], he = _a[0], atk = _a[1], hp = _a[2];
    var xp = floor((+he + +atk + +hp) / 5).toString();
    $('#weight-he').value = localStorage['weight-he'] || he;
    $('#weight-atk').value = localStorage['weight-atk'] || atk;
    $('#weight-hp').value = localStorage['weight-hp'] || hp;
    $('#weight-xp').value = localStorage['weight-xp'] || xp;
}
function handle_respec(respec) {
    var owned = p_game ? p_game.resources.helium.owned : 0;
    $('#helium').value = (input('helium') + owned * (respec ? -1 : 1)).toString();
}
function update_dg() {
    var max_zone = input('zone') / 2 + 115;
    var eff = 500e6 + 50e6 * p_game.generatorUpgrades.Efficiency.upgrades;
    var capa = 3 + 0.4 * p_game.generatorUpgrades.Capacity.upgrades;
    var max_fuel = p_game.permanentGeneratorUpgrades.Storage.owned ? capa * 1.5 : capa;
    var supply = 230 + 2 * p_game.generatorUpgrades.Supply.upgrades;
    var overclock = p_game.generatorUpgrades.Overclocker.upgrades;
    overclock = overclock && (1 - 0.5 * pow(0.99, overclock - 1));
    var burn = p_game.permanentGeneratorUpgrades.Slowburn.owned ? 0.4 : 0.5;
    var cells = mastery('magmaFlow') ? 18 : 16;
    var accel = mastery('quickGen') ? 1.03 : 1.02;
    var hs2 = mastery('hyperspeed2') ? (p_game.global.highestLevelCleared + 1) / 2 : 0;
    var bs = 0.5 * mastery('blacksmith') + 0.25 * mastery('blacksmith2') + 0.15 * mastery('blacksmith3');
    bs *= p_game.global.highestLevelCleared + 1;
    var housing = 0;
    var fuel = 0;
    var time = 0;
    function tick(mult) {
        housing += mult * eff * sqrt(min(capa, fuel));
        fuel = max(0, fuel - burn);
    }
    for (var zone = 230; zone <= max_zone; ++zone) {
        fuel += cells * (0.01 * min(zone, supply) - 2.1);
        var tick_time = ceil(60 / pow(accel, floor((zone - 230) / 3)));
        time += zone > bs ? 28 : zone > hs2 ? 20 : 15;
        while (time >= tick_time) {
            time -= tick_time;
            tick(1);
        }
        while (fuel > max_fuel)
            tick(overclock);
        housing *= 1.009;
    }
    while (fuel >= burn)
        tick(1);
    $("#dg").value = prettify(housing);
}
function read_save() {
    // Auto-fill for the lazy (z20 is default)
    $('#zone').value = max(p_game.stats.highestVoidMap.valueTotal || p_game.global.highestLevelCleared, 20);
    var zone = input('zone');
    if (!localStorage.preset) {
        $$('#preset > *').forEach(function (option) {
            option.selected = parseInt(option.innerHTML.replace('z', '')) < p_game.global.highestLevelCleared;
        });
        auto_preset();
    }
    // let xp_ratio = 1 + p_game.stats.bestFluffyExp.valueTotal / p_game.global.fluffyExp;
    // let he_ratio = 1 + p_game.global.bestHelium / p_game.global.totalHeliumEarned;
    // xp_ratio = log(xp_ratio) * input('weight-atk');
    // he_ratio = log(he_ratio) * 0.8 * input('weight-atk') +
    // log(he_ratio) / log(1.3) * log((1 + 0.25 / (1 + 0.25 * p_game.portal.Cunning.level)) * (1 + 0.6 / (1 + 0.6 * p_game.portal.Curious.level))) * input('weight-xp');
    // console.log("suggested XP weight:", input('weight-he') * xp_ratio / he_ratio);
    // He / unlocks
    var helium = p_game.global.heliumLeftover;
    for (var perk in p_game.portal)
        helium += (p_game.portal[perk].heliumSpent || 0);
    var unlocks = Object.keys(p_game.portal).filter(function (perk) { 
        return !p_game.portal[perk].locked && p_game.portal[perk].level !== undefined && !disabledPerks.includes(perk); 
    });
    if (!p_game.global.canRespecPerks)
        unlocks = unlocks.map(function (perk) { return perk + '>' + (p_game.portal[perk].level || 0); });
    // Income
    var tt = mastery('turkimp2') ? 1 : mastery('turkimp') ? 0.4 : 0.25;
    var prod = 1 + tt;
    var loot = 1 + 0.333 * tt;
    var spires = min(floor((zone - 101) / 100), p_game.global.spiresCompleted);
    loot *= zone < 100 ? 0.7 : 1 + (mastery('stillRowing') ? 0.3 : 0.2) * spires;
    var chronojest = 27 * p_game.unlocks.imps.Jestimp + 15 * p_game.unlocks.imps.Chronoimp;
    var cache = zone < 60 ? 0 : zone < 85 ? 7 : zone < 160 ? 10 : zone < 185 ? 14 : 20;
    for (var _i = 0, _a = (p_game.global.StaffEquipped.mods || []); _i < _a.length; _i++) {
        var mod = _a[_i];
        if (mod[0] === 'MinerSpeed')
            prod *= 1 + 0.01 * mod[1];
        else if (mod[0] === 'metalDrop')
            loot *= 1 + 0.01 * mod[1];
    }
    if (jobless)
        prod = 0;
    else
        chronojest += (mastery('mapLoot2') ? 5 : 4) * cache;
    // Fill the fields
    update_dg();
    console.log(helium);
    $('#helium').value = helium + ($('#respec').checked ? 0 : p_game.resources.helium.owned);
    $('#unlocks').value = unlocks.join(',');
    $('#whipimp').checked = p_game.unlocks.imps.Whipimp;
    $('#magnimp').checked = p_game.unlocks.imps.Magnimp;
    $('#tauntimp').checked = p_game.unlocks.imps.Tauntimp;
    $('#venimp').checked = p_game.unlocks.imps.Venimp;
    $('#chronojest').value = prettify(chronojest);
    $('#prod').value = prettify(prod);
    $('#loot').value = prettify(loot);
    $('#breed-timer').value = prettify(mastery('patience') ? 45 : 30);
}
function parse_inputs() {
    var preset = $('#preset').value;
    if (preset == 'trapper' && (!p_game || p_game.global.challengeActive != 'Trapper'))
        throw 'This preset requires a save currently running Trapper². Start a new run using “Trapper² (initial)”, export, and try again.';
    var result = {
        total_he: input('helium'),
        zone: parseInt($('#zone').value),
        perks: parse_perks($('#fixed').value, $('#unlocks').value),
        weight: {
            helium: input('weight-he'),
            attack: input('weight-atk'),
            health: input('weight-hp'),
            xp: input('weight-xp'),
            trimps: input('weight-trimps'),
            income: 0,
        },
        fluffy: {
            xp: p_game ? p_game.global.fluffyExp : 0,
            prestige: p_game ? p_game.global.fluffyPrestige : 0,
        },
        mod: {
            storage: 0.125,
            soldiers: 0,
            dg: preset == 'nerfed' ? 0 : input('dg'),
            tent_city: preset == 'tent',
            whip: $('#whipimp').checked,
            magn: $('#magnimp').checked,
            taunt: $('#tauntimp').checked,
            ven: $('#venimp').checked,
            chronojest: input('chronojest'),
            prod: input('prod'),
            loot: input('loot'),
            breed_timer: input('breed-timer'),
        }
    };
    if (preset == 'nerfed') {
        result.total_he = 99990000;
        result.zone = 200;
        result.mod.dg = 0;
    }
    if (preset == 'trapper') {
        result.mod.soldiers = p_game.resources.trimps.owned;
        result.mod.prod = 0;
        result.perks.Pheromones.max_level = 0;
        result.perks.Anticipation.max_level = 0;
    }
    if (preset == 'spire') {
        result.mod.prod = result.mod.loot = 0;
        result.perks.Overkill.max_level = 0;
        if (p_game)
            result.zone = p_game.global.world;
    }
    if (preset == 'carp') {
        result.mod.prod = result.mod.loot = 0;
        result.weight.trimps = 1e6;
    }
    if (preset == 'metal')
        result.mod.prod = 0;
    if (preset == 'trimp')
        result.mod.soldiers = 1;
    if (preset == 'nerfed')
        result.perks.Overkill.max_level = 1;
    if (preset == 'scientist')
        result.perks.Coordinated.max_level = 0;
    if (preset == 'income')
        result.weight = { income: 3, trimps: 3, attack: 1, helium: 0, health: 0, xp: 0 };
    if (preset == 'unesscented') {
        result.total_he = 0;
        result.zone = 181;
    }
    if (preset == 'nerfeder') {
        result.total_he = 999900000;
        result.zone = 300;
    }
    var max_zone = p_game ? p_game.global.highestLevelCleared : 999;
    if (preset.match(/trimp|coord/) && result.zone >= (max_zone * 2 / 3))
        show_alert('warning', 'Your target zone seems too high for this c², try lowering it.');
    if (preset == 'spire' && p_game && p_game.global.world != 100 * (2 + p_game.global.lastSpireCleared))
        show_alert('warning', 'This preset is meant to be used mid-run, when you’re done farming for the Spire.');
    return result;
}
function display(results) {
    var he_left = results[0], perks = results[1];
    
    var perk_size = p_game ? p_game.options.menu.smallPerks.enabled : 0;
    var size = $('#perks').clientWidth / (5 + perk_size);
    $('#test-text').innerText = "Level: ".concat(prettify(12345678), " (+").concat(prettify(1234567), ")");
    var level_text = size > $('#test-text').clientWidth ? 'Level: ' : '';
    $('#results').style.opacity = '1';
    $('#info').innerText = localStorage.more ? 'Less info' : 'More info';
    $('#he-left').innerHTML = prettify(he_left) + ' Helium Left Over';
    $('#perks').innerHTML = Object.keys(perks).filter(function (name) { return !perks[name].locked; }).map(function (name) {
        var _a = perks[name], level = _a.level, max_level = _a.max_level;
        var diff = p_game ? level - p_game.portal[name].level : 0;
        var diff_text = diff ? " (".concat(diff > 0 ? '+' : '-').concat(prettify(abs(diff)), ")") : '';
        var style = diff > 0 ? 'adding' : diff < 0 ? 'remove' : level >= max_level ? 'capped' : '';
        var disabled = disabledPerks.includes(name) ? 'disabled' : '';
        style += [' large', ' small', ' tiny'][perk_size];
        return "<div class='perk ".concat(style, " ").concat(disabled, " ").concat(localStorage.more, "' onclick='swap_visibility(this)'>")
            + "<b>".concat(name.replace('_', ' '), "</b><br>")
            + "".concat(level_text, "<b>").concat(prettify(level)).concat(diff_text, "</b><br><span class=more>")
            + "Price: ".concat(level >= max_level ? '∞' : prettify(perks[name].cost), "<br>")
            + "Spent: ".concat(prettify(perks[name].spent()), "</span></div>");
    }).join('');
    for (var name_1 in perks)
        perks[name_1] = perks[name_1].level;
    //$('#perkstring').value = LZString.compressToBase64(JSON.stringify(perks));
}

function perky_perks() {
    var portalPerks = optimize(parse_inputs())[1];
    if (portalPerks != null) {
        var levelDif = Object.keys(portalPerks).filter(function (name) { return !portalPerks[name].locked; }).map(name => {
            var _a = portalPerks[name], level = _a.level, max_level = _a.max_level;
            var diff = p_game ? level - p_game.portal[name].level : 0;
            return [name, diff];
        });
        //console.log(levelDif);
        return levelDif;
    }
    return null;
}

function swap_visibility(perk) {
    var perkName = perk.children.item(0).innerText.replace(' ', '_');

    if (!perk.classList.contains("disabled")) {
        if (!disabledPerks.includes(perkName)) disabledPerks.push(perkName);
    }
    else {
        var ind = disabledPerks.indexOf(perkName);
        if (ind > -1) {
            disabledPerks.splice(ind, 1);
        }
    }
    perk.classList.toggle("disabled");
    //refresh
    perky_main();
}

document.addEventListener("DOMContentLoaded", validate_fixed, false);
document.addEventListener("DOMContentLoaded", auto_preset, false);
function perky_main() {
    display(optimize(parse_inputs()));
}
function toggle_info() {
    localStorage.more = localStorage.more ? '' : 'more';
    $$('.perk').forEach(function (elem) { return elem.classList.toggle('more'); });
    $('#info').innerText = localStorage.more ? 'Less info' : 'More info';
}
function parse_perks(fixed, unlocks) {
    var add = function (x) { return function (level) { return 1 + x * 0.01 * level; }; };
    var mult = function (x) { return function (level) { return pow(1 + x * 0.01, level); }; };
    var perks = {
        Looting_II: new Perk(100e3, 10e3, add(0.25)),
        Carpentry_II: new Perk(100e3, 10e3, add(0.25)),
        Motivation_II: new Perk(50e3, 1e3, add(1)),
        Power_II: new Perk(20e3, 500, add(1)),
        Toughness_II: new Perk(20e3, 500, add(1)),
        Capable: new Perk(1e8, 0, function (l) { return 1; }, 10, 10),
        Cunning: new Perk(1e11, 0, add(25)),
        Curious: new Perk(1e14, 0, add(160)),
        Classy: new Perk(1e17, 0, mult(4.5678375), 75),
        Overkill: new Perk(1e6, 0, add(500), 30),
        Resourceful: new Perk(50e3, 0, mult(-5)),
        Coordinated: new Perk(150e3, 0, mult(-2)),
        Siphonology: new Perk(100e3, 0, function (l) { return pow(1 + l, 0.1); }, 3),
        Anticipation: new Perk(1000, 0, add(6), 10),
        Resilience: new Perk(100, 0, mult(10)),
        Meditation: new Perk(75, 0, add(1), 7),
        Relentlessness: new Perk(75, 0, function (l) { return 1 + 0.05 * l * (1 + 0.3 * l); }, 10),
        Carpentry: new Perk(25, 0, mult(10)),
        Artisanistry: new Perk(15, 0, mult(-5)),
        Range: new Perk(1, 0, add(1), 10),
        Agility: new Perk(4, 0, mult(-5), 20),
        Bait: new Perk(4, 0, add(100)),
        Trumps: new Perk(3, 0, add(20)),
        Pheromones: new Perk(3, 0, add(10)),
        Packrat: new Perk(3, 0, add(20)),
        Motivation: new Perk(2, 0, add(5)),
        Power: new Perk(1, 0, add(5)),
        Toughness: new Perk(1, 0, add(5)),
        Looting: new Perk(1, 0, add(5)),
    };
    if (unlocks == '*')
        unlocks = Object.keys(perks).join(',');
    if (!unlocks.match(/>/))
        unlocks = unlocks.replace(/(?=,|$)/g, '>0');

    var _loop_1 = function (item) {
        var m = item.match(/(\S+) *([<=>])=?(.*)/);
        if (!m)
            throw 'Enter a list of perk levels, such as “power=42, toughness=51”.';
        var tier2 = m[1].match(/2$|II$/i);
        var name_2 = m[1].replace(/[ _]?(2|II)/i, '').replace(/^OK/i, 'O').replace(/^Looty/i, 'L');
        var regex = new RegExp("^".concat(name_2, "[a-z]*").concat(tier2 ? '_II' : '', "$"), 'i');
        var matches = Object.keys(perks).filter(function (p) { return p.match(regex); });

        if (matches.length > 1)
            throw "Ambiguous perk abbreviation: ".concat(m[1], ".");
        if (matches.length < 1)
            throw "Unknown perk: ".concat(m[1], ".");

        var level = parse_suffixes(m[3]);
        if (!isFinite(level))
            throw "Invalid number: ".concat(m[3], ".");
        
        perks[matches[0]].locked = false;
        if (m[2] != '>')
            perks[matches[0]].max_level = level;
        if (m[2] != '<')
            perks[matches[0]].min_level = level;
    };

    for (var disabledInd in disabledPerks) {
        var disabled = disabledPerks[disabledInd];
        var perkLevel = p_game.portal[disabled].level;
        
        fixed += ((fixed.length == 0) ? "" : ",") + disabled + "=" + perkLevel;
    }
    for (var _i = 0, _a = (unlocks + ',' + fixed).split(/,/).filter(function (x) { return x; }); _i < _a.length; _i++) {
        var item = _a[_i];
        _loop_1(item);
    }
    return perks;
}
function optimize(params) {
    var total_he = params.total_he, zone = params.zone, fluffy = params.fluffy, perks = params.perks, weight = params.weight, mod = params.mod;
    var he_left = total_he;
    var Looting_II = perks.Looting_II, Carpentry_II = perks.Carpentry_II, Motivation_II = perks.Motivation_II, Power_II = perks.Power_II, Toughness_II = perks.Toughness_II, Capable = perks.Capable, Cunning = perks.Cunning, Curious = perks.Curious, Classy = perks.Classy, Overkill = perks.Overkill, Resourceful = perks.Resourceful, Coordinated = perks.Coordinated, Siphonology = perks.Siphonology, Anticipation = perks.Anticipation, Resilience = perks.Resilience, Meditation = perks.Meditation, Relentlessness = perks.Relentlessness, Carpentry = perks.Carpentry, Artisanistry = perks.Artisanistry, Range = perks.Range, Agility = perks.Agility, Bait = perks.Bait, Trumps = perks.Trumps, Pheromones = perks.Pheromones, Packrat = perks.Packrat, Motivation = perks.Motivation, Power = perks.Power, Toughness = perks.Toughness, Looting = perks.Looting;
    for (var _i = 0, _a = ['whip', 'magn', 'taunt', 'ven']; _i < _a.length; _i++) {
        var name_3 = _a[_i];
        mod[name_3] = pow(1.003, zone * 99 * 0.03 * mod[name_3]);
    }
    var books = pow(1.25, zone) * pow(zone > 100 ? 1.28 : 1.2, max(zone - 59, 0));
    var gigas = max(0, min(zone - 60, zone / 2 - 25, zone / 3 - 12, zone / 5, zone / 10 + 17, 39));
    var base_housing = pow(1.25, 5 + min(zone / 2, 30) + gigas);
    var mystic = zone >= 25 ? floor(min(zone / 5, 9 + zone / 25, 15)) : 0;
    var tacular = (20 + zone - zone % 5) / 100;
    var base_income = 600 * mod.whip * books;
    var base_helium = pow(zone - 19, 2);
    var max_tiers = zone / 5 + +((zone - 1) % 10 < 5);
    var exponents = {
        cost: pow(1.069, 0.85 * (zone < 60 ? 57 : 53)),
        attack: pow(1.19, 13),
        health: pow(1.19, 14),
        block: pow(1.19, 10),
    };
    var equip_cost = {
        attack: 211 * (weight.attack + weight.health) / weight.attack,
        health: 248 * (weight.attack + weight.health) / weight.health,
        block: 5 * (weight.attack + weight.health) / weight.health,
    };
    // Number of ticks it takes to one-shot an enemy.
    function ticks() {
        return 1 + +(Agility.bonus > 0.9) + ceil(10 * Agility.bonus);
    }
    function moti() {
        return Motivation.bonus * Motivation_II.bonus * Meditation.bonus;
    }
    var looting = function () { return Looting.bonus * Looting_II.bonus; };
    function gem_income() {
        var drag = moti() * mod.whip;
        var loot = looting() * mod.magn * 0.75 * 0.8;
        var chronojest = mod.chronojest * drag * loot / 30;
        return drag + loot + chronojest;
    }
    // Max population
    var trimps = mod.tent_city ? function () {
        var carp = Carpentry.bonus * Carpentry_II.bonus;
        var territory = Trumps.bonus;
        return 10 * (mod.taunt + territory * (mod.taunt - 1) * 111) * carp;
    } : function () {
        var carp = Carpentry.bonus * Carpentry_II.bonus;
        var bonus = 3 + log(base_housing * gem_income() / Resourceful.bonus) / log(1.4);
        var territory = Trumps.bonus * zone;
        return 10 * (base_housing * bonus + territory) * carp * mod.taunt + mod.dg * carp;
    };
    function income(ignore_prod) {
        var storage = mod.storage * Resourceful.bonus / Packrat.bonus;
        var loot = looting() * mod.magn / ticks();
        var prod = ignore_prod ? 0 : moti() * mod.prod;
        var chronojest = mod.chronojest * 0.1 * prod * loot;
        return base_income * (prod + loot * mod.loot + chronojest) * (1 - storage) * trimps();
    }
    function equip(stat) {
        var cost = equip_cost[stat] * Artisanistry.bonus;
        var levels = 1.136;
        var tiers = log(1 + income() / cost) / log(exponents.cost);
        if (tiers > max_tiers + 0.45) {
            levels = log(1 + pow(exponents.cost, tiers - max_tiers) * 0.2) / log(1.2);
            tiers = max_tiers;
        }
        return levels * pow(exponents[stat], tiers);
    }
    // Number of buildings of a given kind that can be built with the current income.
    // cost: base cost of the buildings
    // exp: cost increase for each new level of the building
    function building(cost, exp) {
        cost *= 4 * Resourceful.bonus;
        return log(1 + income(true) * (exp - 1) / cost) / log(exp);
    }
    // Number of zones spent in the Magma
    function magma() {
        return max(zone - 229, 0);
    }
    // function mancers() {
    // let tributes = building(10000, 1.05);
    // let mancers = log(loot * pow(1.05, tributes) / 1e62) / log(1.01);
    // return magma() ? 1 + 0.6 * (1 - pow(0.9999, mancers)) : 1;
    // }
    // Breed speed
    function breed() {
        var nurseries = building(2e6, 1.06) / (1 + 0.1 * min(magma(), 20));
        var potency = 0.0085 * (zone >= 60 ? 0.1 : 1) * pow(1.1, floor(zone / 5));
        return potency * pow(1.01, nurseries) * Pheromones.bonus * mod.ven;
    }
    // Number of Trimps sent at a time, pre-gators
    var group_size = [];
    for (var coord = 0; coord <= log(1 + he_left / 500e3) / log(1.3); ++coord) {
        var ratio_1 = 1 + 0.25 * pow(0.98, coord);
        var available_coords = zone - 1 + (magma() ? 100 : 0);
        var result = 1;
        for (var i = 0; i < available_coords; ++i)
            result = ceil(result * ratio_1);
        group_size[coord] = result;
    }
    // Strength multiplier from coordinations
    function soldiers() {
        var ratio = 1 + 0.25 * Coordinated.bonus;
        var pop = (mod.soldiers || trimps()) / 3;
        if (mod.soldiers > 1)
            pop += 36000 * Bait.bonus;
        var unbought_coords = max(0, log(group_size[Coordinated.level] / pop) / log(ratio));
        return group_size[0] * pow(1.25, -unbought_coords);
    }
    // Fracional number of Amalgamators expected
    function gators() {
        if (zone < 230 || mod.soldiers > 1 || jobless)
            return 0;
        var ooms = log(trimps() / group_size[Coordinated.level]) / log(10);
        return max(0, (ooms - 7 + floor((zone - 215) / 100)) / 3);
    }
    // Total attack
    function attack() {
        var attack = (0.15 + equip('attack')) * pow(0.8, magma());
        attack *= Power.bonus * Power_II.bonus * Relentlessness.bonus;
        attack *= Siphonology.bonus * Range.bonus * Anticipation.bonus;
        attack *= fluffy.attack[Capable.level];
        attack *= (p_game && mastery('amalg')) ? Math.pow(1.5, gators()) : 1 + 0.5 * gators();
        return soldiers() * attack;
    }
    // Total survivability (accounts for health and block)
    function health() {
        var health = (0.6 + equip('health')) * pow(0.8, magma());
        health *= Toughness.bonus * Toughness_II.bonus * Resilience.bonus;
        // block
        var gyms = building(400, 1.185);
        var trainers = jobless ? 0 : (gyms * log(1.185) - log(1 + gyms)) / log(1.1) + 25 - mystic;
        var block = 0.04 * gyms * pow(1 + mystic / 100, gyms) * (1 + tacular * trainers);
        // target number of attacks to survive
        var attacks = 60;
        if (zone < 70 || jobless) { // no geneticists
            // number of ticks needed to repopulate an army
            var timer = log(1 + soldiers() * breed() / Bait.bonus) / log(1 + breed());
            attacks = timer / ticks();
        }
        else { // geneticists
            var fighting = min(group_size[Coordinated.level] / trimps(), 1 / 3);
            var target_speed = fighting > 1e-9 ?
                (pow(0.5 / (0.5 - fighting), 0.1 / mod.breed_timer) - 1) * 10 :
                fighting / mod.breed_timer;
            var geneticists = log(breed() / target_speed) / -log(0.98);
            health *= pow(1.01, geneticists);
            health *= pow(1.332, gators());
        }
        health /= attacks;
        if (zone < 60)
            block += equip('block');
        else
            block = min(block, 4 * health);
        return soldiers() * (block + health);
    }
    var xp = function () { return Cunning.bonus * Curious.bonus * Classy.bonus; };
    var agility = function () { return 1 / Agility.bonus; };
    var helium = function () { return base_helium * looting() + 45; };
    var overkill = function () { return Overkill.bonus; };
    var stats = { agility: agility, helium: helium, xp: xp, attack: attack, health: health, overkill: overkill, trimps: trimps, income: income };
    function score() {
        var result = 0;
        for (var i in weight) {
            if (!weight[i])
                continue;
            var stat = stats[i]();
            if (!isFinite(stat))
                throw Error(i + ' is ' + stat);
            result += weight[i] * log(stat);
        }
        return result;
    }
    function recompute_marginal_efficiencies() {
        var baseline = score();
        for (var name_4 in perks) {
            var perk = perks[name_4];
            if (perk.cost_increment || !perk.levellable(he_left))
                continue;
            perk.level_up(1);
            perk.gain = score() - baseline;
            perk.level_up(-1);
        }
        for (var _i = 0, _a = ['Looting', 'Carpentry', 'Motivation', 'Power', 'Toughness']; _i < _a.length; _i++) {
            var name_5 = _a[_i];
            perks[name_5 + '_II'].gain = perks[name_5].gain * perks[name_5 + '_II'].log_ratio() / perks[name_5].log_ratio();
        }
    }
    function solve_quadratic_equation(a, b, c) {
        var delta = b * b - 4 * a * c;
        return (-b + sqrt(delta)) / (2 * a);
    }
    function spend_he(perk, budget) {
        perk.gain /= perk.log_ratio();
        if (perk.cost_increment) {
            var ratio_2 = (1 + perk.level) / (1000 + Looting_II.level + Carpentry_II.level + Motivation_II.level + Power_II.level + Toughness_II.level);
            budget *= 0.5 * Math.pow(ratio_2, 2);
            var x = solve_quadratic_equation(perk.cost_increment / 2, perk.cost - perk.cost_increment / 2, -budget);
            he_left -= perk.level_up(floor(max(min(x, perk.max_level - perk.level), 1, perk.level / 1e12)));
        }
        else {
            budget = Math.pow(budget, 0.5);
            do
                he_left -= perk.level_up(1);
            while (perk.cost < budget && perk.level < perk.max_level);
        }
        perk.gain *= perk.log_ratio();
    }
    mod.loot *= 20.8; // TODO: check that this is correct
    weight.agility = (weight.helium + weight.attack) / 2;
    weight.overkill = 0.25 * weight.attack * (2 - pow(0.9, weight.helium / weight.attack));
    if (zone > 90 && mod.soldiers <= 1 && Bait.min_level == 0)
        Bait.max_level = 0;
    // Fluffy
    fluffy.attack = [];
    var potential = log(0.003 * fluffy.xp / pow(5, fluffy.prestige) + 1) / log(4);
    for (var cap = 0; cap <= 10; ++cap) {
        var level = min(floor(potential), cap);
        var progress = level == cap ? 0 : (pow(4, potential - level) - 1) / 3;
        fluffy.attack[cap] = 1 + pow(5, fluffy.prestige) * 0.1 * (level / 2 + progress) * (level + 1);
    }
    // Minimum levels on perks
    console.time();
    for (var name_6 in perks) {
        var perk = perks[name_6];
        if (perk.cost_increment)
            he_left -= perk.level_up(perk.min_level);
        else
            while (perk.level < perk.min_level)
                he_left -= perk.level_up(1);
    }
    var ratio = 0.25;
    while (Capable.levellable(he_left * ratio)) {
        he_left -= Capable.level_up(1);
        ratio = Capable.level <= floor(potential) && zone > 300 && weight.xp > 0 ? 0.25 : 0.01;
    }
    if (zone <= 300 || potential >= Capable.level)
        weight.xp = 0;
    if (he_left < 0)
        throw (p_game && p_game.global.canRespecPerks) ?
            "You don’t have enough Helium to afford your Fixed Perks." :
            "You don’t have a respec available.";
    // Main loop
    var sorted_perks = Object.keys(perks).map(function (name) { return perks[name]; }).filter(function (perk) { return perk.levellable(he_left); });
    var reference_he = he_left;
    for (var x = 0.999; x > 1e-12; x *= x) {
        var he_target = reference_he * x;
        recompute_marginal_efficiencies();
        sorted_perks.sort(function (a, b) { return b.gain / b.cost - a.gain / a.cost; });
        while (he_left > he_target && sorted_perks.length) {
            var best = sorted_perks.shift();
            if (!best.levellable(he_left))
                continue;
            spend_he(best, he_left - he_target);
            // sorted_perks.splice(sorted_perks.findIndex(p => p.gain / p.cost > best.gain / best.cost), 0, best);
            var i = 0;
            while (sorted_perks[i] && sorted_perks[i].gain / sorted_perks[i].cost > best.gain / best.cost)
                i++;
            sorted_perks.splice(i, 0, best);
        }
    }
    if (he_left + 1 < total_he / 1e12 && Toughness_II.level > 0) {
        --Toughness_II.level;
        he_left += Toughness_II.cost;
    }
    console.timeEnd();
    return [he_left, perks];

}

function upd_dg_from_zone() {
    if (p_game) update_dg();
}

    // allowing mods.js to USE the functions
    window.perky_read_save = read_save;
    window.perky_main = perky_main;
    window.perky_handle_paste = handle_paste;
    window.perky_upd_dg_from_zone = upd_dg_from_zone;
    window.perky_handle_respec = handle_respec;
    window.perky_select_preset = select_preset;
    window.perky_validate_fixed = validate_fixed;
    window.perky_check_input = check_input;
    window.perky_toggle_info = toggle_info;
    window.perky_perks = perky_perks;
    window.swap_visibility = swap_visibility;
})();