import { magiskolor } from "../spells.mjs";


import { abilityList } from "../constants.mjs";

const skillsList = [

  {
    "id": "FDT",
    "name": "Finna dolda ting",
    "cost": "2",
    "ability": "INT",
    "bc": true,
    "type": "A"
  },
  {
    "id": "UTF",
    "name": "Upptäcka fara",
    "cost": "4",
    "ability": "PSY",
    "bc": true,
    "type": "A"
  },
  {
    "id": "smyga",
    "name": "Smyga",
    "cost": "2",
    "ability": "SMI",
    "bc": true,
    "type": "A"
  },
  {
    "id": "hoppa",
    "name": "Hoppa",
    "cost": "1",
    "ability": "SMI",
    "bc": true,
    "type": "A"
  },
  {
    "id": "klattra",
    "name": "Klättra",
    "cost": "1",
    "ability": "SMI",
    "bc": true,
    "type": "A"
  },
  {
    "id": "lyssna",
    "name": "Lyssna",
    "cost": "2",
    "ability": "INT",
    "bc": true,
    "type": "A"
  }
];

function autocomplete(sheet, inp, arr) {
  /*the autocomplete function takes two arguments,
  the text field element and an array of possible autocompleted values:*/
  var currentFocus;
  /*execute a function when someone writes in the text field:*/
  inp.addEventListener("input", function (e) {
    var a, b, i, val = this.value;
    /*close any already open lists of autocompleted values*/
    closeAllLists();
    currentFocus = -1;
    /*create a DIV element that will contain the items (values):*/
    a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    /*append the DIV element as a child of the autocomplete container:*/
    this.parentNode.appendChild(a);
    /*for each item in the array...*/
    const matchingSkills = sheet.findMatchingSkills(val);
    for (i = 0; i < matchingSkills.length; i++) {
      const matchingSkill = matchingSkills[i];
      /*create a DIV element for each matching element:*/
      b = document.createElement("DIV");
      b.innerHTML += matchingSkill.name;
      b.innerHTML += " (";
      b.innerHTML += matchingSkill.ability;
      b.innerHTML += ") Kostnad:";
      b.innerHTML += matchingSkill.cost;
      b.innerHTML += " ";
      b.innerHTML += matchingSkill.type + '-färdighet';
      b.addEventListener("click", function (e) {
        /*insert the value for the autocomplete text field:*/
        inp.value = matchingSkill.name;
        closeAllLists();
        sheet.selectSkill(matchingSkill);
      });
      a.appendChild(b);
    }
  });
  /*execute a function presses a key on the keyboard:*/
  inp.addEventListener("keydown", function (e) {
    var x = document.getElementById(this.id + "autocomplete-list");
    if (x) x = x.getElementsByTagName("div");
    if (e.keyCode == 40) {
      /*If the arrow DOWN key is pressed,
      increase the currentFocus variable:*/
      currentFocus++;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 38) { //up
      /*If the arrow UP key is pressed,
      decrease the currentFocus variable:*/
      currentFocus--;
      /*and and make the current item more visible:*/
      addActive(x);
    } else if (e.keyCode == 13) {
      /*If the ENTER key is pressed, prevent the form from being submitted,*/
      e.preventDefault();
      if (currentFocus > -1) {
        /*and simulate a click on the "active" item:*/
        if (x) x[currentFocus].click();
      }
    }
  });
  function addActive(x) {
    /*a function to classify an item as "active":*/
    if (!x) return false;
    /*start by removing the "active" class on all items:*/
    removeActive(x);
    if (currentFocus >= x.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = (x.length - 1);
    /*add class "autocomplete-active":*/
    x[currentFocus].classList.add("autocomplete-active");
  }
  function removeActive(x) {
    /*a function to remove the "active" class from all autocomplete items:*/
    for (var i = 0; i < x.length; i++) {
      x[i].classList.remove("autocomplete-active");
    }
  }
  function closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != inp) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }
}


/**
/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DODExpertItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return mergeObject(super.defaultOptions, {
      classes: ["dodexpert", "sheet", "item"],
      width: 520,
      height: 480,
      tabs: [{ navSelector: ".sheet-tabs", contentSelector: ".sheet-body", initial: "description" }]
    });
  }

  /** @override */
  get template() {
    const path = "systems/dodexpert/templates/item";
    // Return a single sheet for all item types.
    // return `${path}/item-sheet.html`;

    // Alternatively, you could use the following return statement to do a
    // unique item sheet by type, like `weapon-sheet.html`.
    return `${path}/item-${this.item.type}-sheet.html`;
  }

  /* -------------------------------------------- */

  /** @override */
  getData() {
    // Retrieve base data structure.
    const context = super.getData();

    // Use a safe clone of the item data for further operations.
    const itemData = context.item;

    // Retrieve the roll data for TinyMCE editors.
    context.rollData = {};
    let actor = this.object?.parent ?? null;
    if (actor) {
      context.rollData = actor.getRollData();
    }

    // Add the actor's data to context.data for easier access, as well as flags.
    context.system = itemData.system;
    context.flags = itemData.flags;

    context.abilityList = abilityList;
    context.magiskolor = magiskolor;
    console.info('Editing item:', context);
    return context;
  }

  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);



    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;

    html.find('.skill-selector').change(this._onSkillSelected.bind(this));
    autocomplete(this, document.getElementById("skill-input"), skillsList);

    //this.skillInputElement = document.getElementById("skill-input");
    //    this.skillInputElement = html.find('#skill-input');
    //    this.skillInputElement.keyup(this._onSkillInput.bind(this));
    //this.skillInputElement.addEventListener("input", this._onSkillInput.bind(this));
  }

  async _onSkillInput(event) {
    const val = this.skillInputElement.value;
    const matchingSkills = this.findMatchingSkills(val);
    const t = this;
    console.info('onSkillInput:' + val);
    var x = document.getElementsByClassName("autocomplete-items");
    this.closeAllLists();
    const a = document.createElement("DIV");
    a.setAttribute("id", this.id + "autocomplete-list");
    a.setAttribute("class", "autocomplete-items");
    this.skillInputElement.parentNode.appendChild(a);
    for (let i = 0; i < matchingSkills.length; i++) {
      /*create a DIV element for each matching element:*/
      const matchingSkill = matchingSkills[i];
      const b = document.createElement("DIV");
      /*make the matching letters bold:*/
      b.innerHTML += matchingSkill.name;
      b.addEventListener("click", function (e) {
        console.info('Select:' + matchingSkill.name);
        e.preventDefault();
        t.closeAllLists();
        t._onSkillSelected(e);
      });
      a.appendChild(b);
    }
  }

  findMatchingSkills(inp) {
    return skillsList.filter(sk => sk.name.indexOf(inp) >= 0);
  }

  async selectSkill(skill) {
    console.info('selectSkill:', skill);
  }

  async _onSkillSelected(event) {
    console.log('_onSkillSelected', event);
    const value = event.target.value;
    console.log('_onSkillSelected value=' + value);

  }

  closeAllLists(elmnt) {
    /*close all autocomplete lists in the document,
    except the one passed as an argument:*/
    var x = document.getElementsByClassName("autocomplete-items");
    for (var i = 0; i < x.length; i++) {
      if (elmnt != x[i] && elmnt != this.skillInputElement) {
        x[i].parentNode.removeChild(x[i]);
      }
    }
  }

}
