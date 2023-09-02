import { DODExpertSkill } from "./skill.mjs"

import { CastSpellDialog} from "../dialogs/CastSpellDialog.mjs"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class DODExpertSpell extends DODExpertSkill {

  constructor(target, args) {
    super(target, args);
    
  }

  /**
   * Augment the basic Item data model with additional dynamic data.
   */
  prepareData() {
    // As with the actor class, items are documents that can have their data
    // preparation methods overridden (such as prepareBaseData()).
    this.img = "systems/dodexpert/media/skill.svg";
    super.prepareData();
  }

  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
   getRollData() {
    // If present, return the actor's roll data.
    if ( !this.actor ) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  async use(event) {


    this.castSpellDialog = new CastSpellDialog({skill: this} );
    this.castSpellDialog.render(true, { 
      renderData: {} 
    });
  }

  _onCreate(data, options, userId) {
  }

}
