//  PerkyMod
//  mods.js
//  Copyright (C) 2025 WheatPole


const perkyDiv = document.createElement('div');
perkyDiv.setAttribute("id", "perky");
perkyDiv.setAttribute("class", "perkyDiv");

const perkyBtn = document.createElement('button');
perkyBtn.setAttribute("class", "noselect pointer perkyButton thing");
perkyBtn.setAttribute("id", "Perky");
perkyBtn.setAttribute("onclick", "openPerky()");

const inner = '<span class="thingName">Open Perky</span>';
perkyBtn.innerHTML = inner;

const htmlButton = 
'<button onmouseover="tooltip(\'Perky\',null, null, \'Implementation of Perky\')" onmouseout="tooltip(\'hide\')"'
'class="pointer thing detailed changingOff" id="Perky"'
'onclick="openPerky()">'
	'<span class="thingName">Perky</span>'
'</button>';

perkyDiv.appendChild(perkyBtn);

document.getElementById('portalWrapper').appendChild(perkyDiv);

const perkyScript = document.createElement("script");
perkyScript.setAttribute("type", "text/javascript");
perkyScript.setAttribute("src", "mods/perky/perks.js");
document.body.appendChild(perkyScript);

function openPerky() {
	const elem = document.getElementById("tooltipDiv");

	const buttons = "<div id='abLevelButtons'><button aria-label='Close' id='abCloseBtn' onclick='cancelTooltip()' class='icomoon icon-close'></button></div>";
	const perkyHTML = buildPerky();
	var text = "<div class='noselect'>" + buttons + perkyHTML + "</div>";
	tooltip('confirm', null, 'update', text, '', 'Perky', 'Close', false, true);

	//swapping tooltip sizes (trimps moment)
	elem.style.top = "0%";
	elem.style.left = "5%";
	swapClass('tooltipExtra', 'tooltipExtraBiggest', elem);

  const applyButton = document.createElement("button");
  applyButton.setAttribute("id", "applyPerksBtn");
  applyButton.setAttribute("class", "btn btn-info");
  applyButton.setAttribute("onclick", "applyPerkyPerks()");
  applyButton.setAttribute("role", "button");
  applyButton.setAttribute("tabindex", "1");
  applyButton.innerHTML = "Apply Perks";

  document.getElementById("confirmTipCost").appendChild(applyButton);

  // autofill input field
  const inputField = document.querySelector("div.perkyMain #save");

  const saveText = save(true);
  inputField.value = saveText;
  perky_handle_paste(null, perky_read_save, perky_main, saveText);
}

function applyPerkyPerks() {
  if (portalUniverse == 1) {
    console.log(game.portal);
    console.log(typeof(game.portal));
    var newPerks = perky_perks();
    if (newPerks) {
      console.log(newPerks);
      newPerks.sort((a, b) => {
        return a[1] - b[1];
      });
      for (var i = 0; i < newPerks.length; i++) {
        var name = newPerks[i][0], diff = newPerks[i][1];

        if (diff < 0) 
          game.global.removingPerks = true;
        else if (diff > 0)
          game.global.removingPerks = false;
        else continue;
        
        game.global.buyAmt = Math.abs(diff);
        console.log(name + " " + diff);
        buyPortalUpgrade(name);
      }
      game.global.buyAmt = 1;
    }
  }
  cancelTooltip();
}

function buildPerky() {
	var txt = `<div class='perkyMain'>

<form class="flexbox" action="javascript:perky_main()">
	
  <div class="filler"></div>
  <fieldset class="box inputs" style="flex: 2 0 320px">
    <legend>Inputs</legend>
    <label title="Export your Trimps save and paste it here.">
	
      <textarea
        id="save"
        onfocus='this.value = ""'
        onpaste="perky_handle_paste(event, perky_read_save, perky_main)"
      ></textarea
      >Import save</label
    ><label title="Check this when respeccing from the View Perks screen."
      ><input
        id="respec"
        type="checkbox"
        onchange="perky_handle_respec(this.checked)"
      />Mid-run respec</label
    ><label
      title="The base zone used in calculations. Set this to a few zone before your planned portalling zone, for example the zone on which you do your Void Maps."
      ><input
        id="zone"
        type="text"
        value="20"
        required
        pattern="\\d{2,3}"
        onchange="perky_upd_dg_from_zone()"
        data-saved=""
      />Target zone</label
    ><label title="Suggested weights for various situations."
      ><select id="preset" onchange="perky_select_preset(this.value)" data-saved>
        <option disabled>— Normal progression —</option>
        <option value="early">z1–59</option>
        <option value="broken">z60–99</option>
        <option value="mid">z100–180</option>
        <option value="corruption">z181–229</option>
        <option value="magma">z230–280</option>
        <option value="z280">z280–400</option>
        <option value="z400">z400–450</option>
        <option value="z450">z450+</option>
        <option disabled>— Special-purpose presets —</option>
        <option value="spire" data-hide="200">Spire respec</option>
        <option value="nerfed">Nerfed feat</option>
        <option value="tent">Tent City feat</option>
        <option value="scientist">Scientist challenge</option>
        <option value="carp" data-hide="65">Trapper² (initial)</option>
        <option value="trapper" data-hide="65">Trapper² (respec)</option>
        <option value="coord" data-hide="65">Coordinate²</option>
        <option value="trimp" data-hide="65">Trimp²</option>
        <option value="metal" data-hide="65">Metal²</option>
        <option value="c2" data-hide="65">Other c²</option>
        <option value="income">Income</option>
        <option value="unesscented">Unesscented</option>
        <option value="nerfeder">Nerfeder</option></select
      >Presets</label
    ><label title="How much you value +1% Helium income."
      ><input
        id="weight-he"
        type="text"
        oninput="perky_check_input(this)"
        required
        data-saved=""
      />Weight: Helium</label
    ><label title="How much you value +1% attack."
      ><input
        id="weight-atk"
        type="text"
        oninput="perky_check_input(this)"
        required
        data-saved=""
      />Weight: Attack</label
    ><label title="How much you value +1% survivability (health and block)."
      ><input
        id="weight-hp"
        type="text"
        oninput="perky_check_input(this)"
        required
        data-saved=""
      />Weight: Health</label
    ><label title="How much you value +1% Fluffy exp gain." data-hide="301"
      ><input
        id="weight-xp"
        type="text"
        oninput="perky_check_input(this)"
        required
        data-saved=""
      />Weight: Fluffy</label
    ><label
      title="A list of perks that you don’t want to change, for example “power=42, carp=31”"
      ><input
        id="fixed"
        type="text"
        oninput="perky_validate_fixed()"
        data-saved=""
      />Fixed perks</label
    >
    <div class="tabs">
      <label
        title="Total Helium Earned, as displayed on the Stats screen"
        ><input
          id="helium"
          type="text"
          required
          oninput="perky_check_input(this)"
        />Total Helium</label
      ><label
        title="Number of trimps generated by your DG (before carpentry)"
        data-hide="230"
        ><input id="dg" type="text" value="0" oninput="perky_check_input(this)" />DG
        housing</label
      ><label title="A comma-separated list of perks you have unlocked"
        ><input
          id="unlocks"
          type="text"
          value="Agility,Bait,Trumps,Pheromones,Packrat,Motivation,Power,Toughness,Looting"
        />Unlocked perks</label
      ><label title="Uncheck this if you didn’t unlock the Whipimp"
        ><input id="whipimp" type="checkbox" checked="" />Whipimp</label
      ><label title="Uncheck this if you didn’t unlock the Magnimp"
        ><input id="magnimp" type="checkbox" checked="" />Magnimp</label
      ><label title="Uncheck this if you didn’t unlock the Tauntimp"
        ><input id="tauntimp" type="checkbox" checked="" />Tauntimp</label
      ><label title="Uncheck this if you didn’t unlock the Venimp"
        ><input id="venimp" type="checkbox" checked="" />Venimp</label
      ><label
        title="Seconds of income per 100 cells cleared. This includes Chronoimp, Jestimp, and caches."
        ><input
          id="chronojest"
          type="text"
          value="42"
          pattern="^\\d*\\.?\\d*"/> Chronojest mod</label
      ><label title="Multiplier for production"
        ><input
          id="prod"
          type="text"
          oninput="perky_check_input(this)"
          value="1"
        />Production mod</label
      ><label title="Multiplier for regular loot"
        ><input
          id="loot"
          type="text"
          oninput="perky_check_input(this)"
          value="1"
        />Loot mod</label
      ><label title="Your usual breed timer" data-hide="70"
        ><input id="breed-timer" type="text" value="30" pattern="^\\d*\\.?\\d*" />Breed
        timer</label
      ><label
        title="How much you value +1% population. WARNING: the effects of population on attack/health are already counted"
        ><input
          id="weight-trimps"
          type="text"
          value="0"
          oninput="perky_check_input(this)"
          data-saved=""
        />Weight: Population</label
      >
    </div>
    <button class="centered" type="submit">Optimize!</button>
  </fieldset>
  <div class="filler"></div>
  <div class="filler"></div>
  <div
    id="results"
    style="opacity: 0; flex: 2 0 640px; margin: 0 auto; white-space: nowrap"
  >
    <div class="flexbox" id="details">
      <h2 id="he-left"></h2>
      <button id="info" type="button" onclick="perky_toggle_info()"></button>
    </div>
    <div class="flexbox" id="perks"></div>

    <p id="disable">Click on a perk to disable it!</p>
  </div>
  <div class="filler"></div>
</form>
<div
  id="test-text"
  style="display: inline-block; visibility: hidden; height: 0"
></div>
</div>`;
	return txt;
}
