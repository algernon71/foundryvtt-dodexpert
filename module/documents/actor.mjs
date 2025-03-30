import * as Stats from "../stats.mjs";
import { races, bodyShapes } from "../constants.mjs";

/**
 * Extend the base Actor document by defining a custom roll data structure which is ideal for the Simple system.
 * @extends {Actor}
 */
export class DODExpertActor extends Actor {

  /** @override */
  prepareData() {
    // Prepare data for the actor. Calling the super version of this executes
    // the following, in order: data reset (to clear active effects),
    // prepareBaseData(), prepareEmbeddedDocuments() (including active effects),
    // prepareDerivedData().
    super.prepareData();
  }

  /** @override */
  prepareBaseData() {
    // Data modifications in this step occur before processing embedded
    // documents or derived data.
  }

  _onUpdate(data, options, userId) {
    super._onUpdate(data, options, userId);
    this._displayScrollingDamage(options.dhp);
  }

  /**
   * @override
   * Augment the basic actor data with additional dynamic data. Typically,
   * you'll want to handle most of your calculated/derived data in this step.
   * Data calculated in this step should generally not exist in template.json
   * (such as ability modifiers rather than ability scores) and should be
   * available both inside and outside of character sheets (such as if an actor
   * is queried and has a roll executed directly from it).
   */
  prepareDerivedData() {
    const actorData = this;
    const systemData = actorData.system;
    const flags = actorData.flags.dodexpert || {};

    // Make separate methods for each Actor type (character, npc, etc.) to keep
    // things organized.
    Stats.calculateSecondaryStats(actorData.system);
    this._prepareCharacterData(actorData);
    this._prepareNpcData(actorData);
  }

  getSkill(skillId) {
    for (let i of this.items) {
      if (i.type === 'skill') {
        if (i.system.def_id === skillId) {
          return i;
        }
      }

    }
    return null;

  }
  /**
   * Prepare Character type specific data
   */
  _prepareCharacterData(actorData) {
    if (actorData.type !== 'character') { 
      return ;
    };

    console.info('_prepareCharacterData ' + this._id + ' ' + this.name);

    let itemsToRemove = [];
    for (let i of this.items) {
      switch (i.type) {
        case "skilldef":
          itemsToRemove.push(i);
          break;
      }
    }

    for (let i of itemsToRemove) {
      const skillId = i._id;
      const skill = this.items.get(skillId);
      skill.delete();
      console.info('removed invalid skilldef from actor:', i);
    }


    this.prepareBodyData(actorData);

  }

  /**
   * Prepare NPC type specific data.
   */
  _prepareNpcData(actorData) {
    if (actorData.type !== 'npc') return;

    // Make modifications to data here. For example:
    const systemData = actorData.system;
    this.prepareBodyData(actorData);
  }

  prepareBodyData(actorData) {
    const bodyShape = bodyShapes["humanoid"];

    const health = this.system.health;
    if (health) {
      const kpOffset = Math.floor((this.system.health.max - 5) / 3) - 1;

      if (!this.system.body) {
        this.system.body = {};
      }
      for (let [part, v] of Object.entries(bodyShape.bodyParts)) {
        let bodyPart = this.system.body[part];
        // console.log('Building body part:' + part);
        const partMaxHealth = v.baseKp + kpOffset;
        if (!bodyPart) {
          bodyPart = {
            name: v.name,
            targetName: v.targetName,
            health: {
              max: partMaxHealth,
              value: partMaxHealth
            }
          };
          this.system.body[part] = bodyPart;
        }

        let armorList = this.items.filter(i => i.type == "armor" && i.system.bodyparts[part]);
        if (armorList && armorList.length > 0) {  
          // console.info('Found armor for actor ('+ this.name + ') part( ' + bodyPart.name +  ') : ', armorList);
          armorList.forEach(armor => {
            bodyPart.armor = armor;
            bodyPart.armorName = armor.system.name;
            bodyPart.abs = armor.system.abs;
          });
          this.system.body[part] = bodyPart;

        }
      }
      // console.info('actor ('+ this.name + ') body parts ', this.system.body);

    };
  }
  /**
   * Override getRollData() that's supplied to rolls.
   */
  getRollData() {
    const data = super.getRollData();

    // Prepare character roll data.
    this._getCharacterRollData(data);
    this._getNpcRollData(data);

    return data;
  }

  /**
   * Prepare character roll data.
   */
  _getCharacterRollData(data) {
    if (this.type !== 'character') return;

    // Copy the ability scores to the top level, so that rolls can use
    // formulas like `@str.mod + 4`.
    if (data.abilities) {
      for (let [k, v] of Object.entries(data.abilities)) {
        data[k] = foundry.utils.deepClone(v);
      }
    }

    // Add level for easier access, or fall back to 0.
    if (data.attributes.level) {
      data.lvl = data.attributes.level.value ?? 0;
    }
  }

  /**
   * Prepare NPC roll data.
   */
  _getNpcRollData(data) {
    if (this.type !== 'npc') return;

    // Process additional NPC data here.
  }

  async giveExperience(gerf) {

  }

  async giveHeroPoints(gerf) {

  }

  async applyDamage(amount, bodyPart) {

    const hp = this.system.health;
    if (!hp) return this; // Group actors don't have HP at the moment

    // Deduct damage from temp HP first
    const tmp = parseInt(hp.value) || 0;
    const dt = amount;

    // Remaining goes to health
    const tmpMax = parseInt(hp.max) || 0;
    const dh = Math.clamped(hp.value - (amount - dt), 0, hp.max + tmpMax);

    // Update the Actor
    const updates = {
      "system.health.value": tmp - dt
    };

    // Delegate damage application to a hook
    // TODO replace this in the future with a better modifyTokenAttribute function in the core
    /*
    const allowed = Hooks.call("modifyTokenAttribute", {
      attribute: "attributes.hp",
      value: amount,
      isDelta: false,
      isBar: true
    }, updates);
    */
    return this.update(updates, { dhp: -amount });
  }
  async modifyTokenAttribute(attribute, value, isDelta, isBar) {
    if (attribute === "attributes.hp") {
      const hp = this.system.attributes.hp;
      const delta = isDelta ? (-1 * value) : (hp.value + hp.temp) - value;
      return this.applyDamage(delta);
    }
    return super.modifyTokenAttribute(attribute, value, isDelta, isBar);
  }
  _displayScrollingDamage(dhp) {
    if (!dhp) return;
    dhp = Number(dhp);
    const tokens = this.isToken ? [this.token?.object] : this.getActiveTokens(true);
    for (const t of tokens) {
      const pct = Math.clamped(Math.abs(dhp) / this.system.health.max, 0, 1);
      canvas.interface.createScrollingText(t.center, dhp.signedString(), {
        anchor: CONST.TEXT_ANCHOR_POINTS.TOP,
        fontSize: 16 + (32 * pct), // Range between [16, 48]
        fill: 0xffffff,
        stroke: 0x000000,
        strokeThickness: 4,
        jitter: 0.25
      });
    }
  }
}