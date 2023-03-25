import { magiskolor } from "../spells.mjs";


import { abilityList } from "../constants.mjs";

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


    // Roll handlers, click handlers, etc. would go here.
  }

  async _onSkillSelected(event) {
    console.log('_onSkillSelected', event);
    const value = event.target.value;
    console.log('_onSkillSelected value=' + value);

  }
}
