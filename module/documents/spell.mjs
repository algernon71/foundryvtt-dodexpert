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

  buildNameAttributes() {
    let attr = [];
    if (this.skillDef.system.quick) {
      attr.push('K');
    }

    if (this.skillDef.system.physical) {
      attr.push('F');
    }

    if (this.skillDef.system.ritual) {
      attr.push('R');
    }
    if (attr.length > 0) {
      return '(' + attr.join(',') + ')';
    }
    return '';
  }

  calculateRange() {
    let rangeExpr = this.skillDef.system.range;
    rangeExpr = rangeExpr.replace('rutor', '').replace('x', '*');
    console.info('range:', rangeExpr);
    if (this.skillDef.system.range) {
      let S = this.system.fv;
      return eval(rangeExpr);
    }

    return '';
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
