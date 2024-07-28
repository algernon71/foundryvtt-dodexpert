
import { abilityList } from "../constants.mjs";

const magicschools = { 
  "E" : { "name": "Elementarmagi"},
  "H" : { "name": "Harmonism"}
};

/**
 * Extend the basic ItemSheet with some very simple modifications
 * @extends {ItemSheet}
 */
export class DODExpertItemSheet extends ItemSheet {

  /** @override */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
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

  async getAllPacks() {
    let items = [];
    await game.packs.reduce(async (items, pack, name) => {
      console.info('pack:'+ name);
      let index = await pack.getIndex({ fields: ["system.schoolId"] });

      index.forEach(item => {
        if (item.system && item.system.schoolId) {
          items.push(item);

        }
      });
    });

    console.info("hello");
    return items;
  }
  /** @override */
  async getData() {
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
    context.magicschools = [magicschools];
    if (context.item.type  === 'spelldef') {

      context.magicschools = await this.getMagicShools();
    }
    console.info('editing item:', context.item);
    return context;
  }

  async getMagicShools() {
    let schools = [];
    const skillsPack = await game.packs.get('dodexpert.skills');

    game.packs.forEach(async gamePack => {
      const index = await gamePack.getIndex({ fields: ["system.schoolId", "system.category"] });
      index.forEach((item, key) => {
        if (item.system && item.system.category && item.system.category == 'MAG') {
          console.info('item:', item);
          schools.push(item);
        }
      });
    });
    return schools;
  }


  /* -------------------------------------------- */

  /** @override */
  activateListeners(html) {
    super.activateListeners(html);



    // Everything below here is only needed if the sheet is editable
    if (!this.isEditable) return;


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
