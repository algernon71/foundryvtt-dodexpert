import { SkillCheckDialog } from "../dialogs/SkillCheckDialog.mjs"
import { AddSkillDialog } from "../dialogs/AddSkillDialog.mjs"
import { CheckModifier } from "../helpers/skillchecks.mjs"

/**
 * Extend the basic Item with some very simple modifications.
 * @extends {Item}
 */
export class DODExpertSkill extends Item {

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

  async prepareDerivedData() {
    const skillId = this.system.def_id;
    const skillPack = this.system.def_pack;

    if (skillId) {

      if (skillPack) {
        const skillsPack = game.packs.get(skillPack);
        this.skillDef = await skillsPack.getDocument(skillId);
      } else {
        this.skillDef = game.items.get(skillId);
      }

      if (this.skillDef) {
        this.name = this.skillDef.name;
        if (!this.system.defUpdate || 
             this.system.defUpdate != this.skillDef._stats.modifiedTime ) {
          this.updateFieldsFromDefinition(this.skillDef);
        } else {

        }
        /*
        this.system.description = this.skillDef.system.description;
        this.system.cost = this.skillDef.system.cost;
        this.system.ability = this.skillDef.system.ability;
        this.system.category = this.skillDef.system.category;
        this.system.schoolId = this.skillDef.system.schoolId;
        */
        // console.info('Skill initialized!', this);
      } else {
        console.info('Failed to initialize skill, with def id:' + skillId, this);
      }
    }

  }

  async updateFieldsFromDefinition(skillDef) {
    let update = {
      "name": skillDef.name,
      "system":
      {
        "cost": skillDef.system.cost,
        "ability": skillDef.system.ability,
        "shoolId": skillDef.system.schoolId,
        "category": skillDef.system.category,
        "defUpdate": skillDef._stats.modifiedTime,
        "lastXpTime": game.time.worldTime,
        "type": skillDef.system.type
      }
    };
    console.info('update skill from def, update:', update);
    this.update(update, {});

  }

  async _onUpdate(changed, options, userId) {
    switch (this.type) {
      case "skilldef": 
        this.updateDefinitionReferences("skill");
        break;
      case "spelldef": 
         this.updateDefinitionReferences("spell");
         break;
    }
  }

  async updateDefinitionReferences(type) {
    console.info('updateDefinitionReferences:', type);

    game.actors.forEach((actor, key) => {
      actor.items.forEach((item, key) => {
        if (item.type == type) {
          if (item.system.def_id == this._id) {
            item.updateFieldsFromDefinition(this);
          }
        }
      });
  
    });
  }

  async migrateData(source) {
    console.info('migrate data:', source);

  }

  async giveExperience(xp) {
    console.info('giveExperience skill:', this);
    console.info('giveExperience xp:', xp);

    let erf = Number(this.system.erf) + Number(xp);
    let fv = Number(this.system.fv);
    let increaseCost = this.getSkillIncreaseCost(fv);
    while (increaseCost <= erf && increaseCost > 0) {
      fv = fv + 1;
      erf = erf - increaseCost;
      increaseCost = this.getSkillIncreaseCost(fv);
    }
    if (increaseCost <= 0) {
      erf = 0;
    }
    let update = {
      "system":
      {
        "fv": fv,
        "erf": erf,
        "lastXpTime": game.time.worldTime
      }
    };
    console.info('update skill:', this);
    console.info('update skill, update:', update);
    await this.update(update, {});
  }

  async removeExperience(xp) {
    let erf = this.system.erf - xp;
    let fv = Number(this.system.fv);
    while (erf < 0) {
      fv = fv - 1;
      erf = erf + 1;
      erf = erf + this.getSkillIncreaseCost(fv) - 1;
    }
    let update = {
      "system":
      {
        "fv": fv,
        "erf": erf
      }
    };
    await this.update(update, {});
  }

  getSkillIncreaseCost(fv) {
    if (this.system.type == "B") {
      return this.getBSkillMultiplier(fv + 1) * this.system.cost;

    }
    return this.getSkillMultiplier(fv + 1) * this.system.cost;
  }

  getSkillMultiplier(fv) {
    if (fv <= 10) {
      return 1;
    }
    if (fv <= 14) {
      return 2;
    }

    return 3 + Math.floor((fv - 14) / 3);
  }

  getBSkillMultiplier(fv) {
    if (fv <= 2) {
      return 1;
    }
    if (fv <= 4) {
      return 2;
    }
    if (fv <= 5) {
      return 3;
    }

    return -1;
  }


  getFV() {
    if (this.skillDef.system.type == 'B') {
      return this.system.fv * 4;
    }
    return this.system.fv;
  }
  /**
   * Prepare a data object which is passed to any Roll formulas which are created related to this Item
   * @private
   */
  getRollData() {
    // If present, return the actor's roll data.
    if (!this.actor) return null;
    const rollData = this.actor.getRollData();
    // Grab the item's system data as well.
    rollData.item = foundry.utils.deepClone(this.system);

    return rollData;
  }

  async use(event) {


    this.skillCheckDialog = new SkillCheckDialog({ skill: this });
    this.skillCheckDialog.render(true, {
      renderData: {}
    });
  }

  _onCreate(data, options, userId) {
    const actor = this.actor;
    console.info('Create ', this.name);
    if (actor) {
      const ability = actor.system.abilities[this.system.ability];
      if (this.system.bc && this.system.fv < ability.group) {
        this.system.fv = ability.group;
      }

    }
  }

  /**
   * Handle clickable rolls.
   * @param {Event} event   The originating click event
   * @private
   */
  async roll() {
    this.skillRoll({
      cl: this.system.fv,
      mod: 0
    });
  }


  async skillRoll(skillCheckData) {
    const cl = skillCheckData.cl;
    const isGM = game.user.isGM;
    const isObserver = this.testUserPermission(game.user, "OBSERVER");
    const skillCheckResult = {
      skill: this,
      mod: skillCheckData.mod,
      diff: 0,
      fv: this.system.fv,
      cl: skillCheckData.cl,
      xp: 0,
      result: "PENDING",
      resultTitle: "Inget slag",
      rollsList: [],
      rolls: [],
      content: ''

    };

    let mainRoll = new Roll("d20");


    // Execute the roll
    await mainRoll.evaluate();
    skillCheckResult.rolls.push(mainRoll);



    if (mainRoll.total <= cl) {
      skillCheckResult.result = "SUCCESS";
      skillCheckResult.resultTitle = "Lyckat";
      skillCheckResult.diff = cl - mainRoll.total;
      skillCheckResult.rollsList.push({ roll: mainRoll.total, title: "Färdighetsslag" });
      if (mainRoll.total == 1) {
        let perfectCheckRoll = new Roll("d20");
        await perfectCheckRoll.evaluate();
        skillCheckResult.rolls.push(perfectCheckRoll);
        skillCheckResult.rollsList.push({ roll: perfectCheckRoll.total, title: "Kontrolslag för perfekt" });
        if (perfectCheckRoll.total <= cl) {
          skillCheckResult.diff *= 4;
          skillCheckResult.result = "PERFECT";
          skillCheckResult.resultTitle = "PERFEKT!";
        }
      } else if (mainRoll.total <= 5) {
        let specialCheckRoll = new Roll("d20");
        await specialCheckRoll.evaluate();
        skillCheckResult.rolls.push(specialCheckRoll);
        skillCheckResult.rollsList.push({ roll: specialCheckRoll.total, title: "Kontrolslag för särskilt" });
        if (specialCheckRoll.total <= cl) {
          skillCheckResult.diff *= 2;
          skillCheckResult.result = "SPECIAL";
          skillCheckResult.resultTitle = "Särskilt!";
        }

      }
    } else {
      skillCheckResult.result = "FAIL";
      skillCheckResult.resultTitle = "Misslyckat";
      skillCheckResult.diff = cl - mainRoll.total;
      skillCheckResult.rollsList.push({ roll: mainRoll.total, title: "Färdighetsslag" });
    if (mainRoll.total == 20) {
          let fumbleCheckRoll = new Roll("d20");
        await fumbleCheckRoll.evaluate();
        skillCheckResult.rolls.push(fumbleCheckRoll);
        skillCheckResult.rollsList.push({ roll: fumbleCheckRoll.total, title: "Kontrolslag för fummel" });

        if (fumbleCheckRoll.total > cl) {
          skillCheckResult.resultTitle = "FUMMEL!";
          skillCheckResult.result = "FUMBLE";
        }
      }

    }



    skillCheckResult.xp = await this.getResultXP(skillCheckResult.result);
    const rollMode = game.settings.get("core", "rollMode");
    

    const chatMessage = await renderTemplate("systems/dodexpert/templates/common/skill-check-result.html", skillCheckResult);
    var chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: chatMessage,
      rolls: skillCheckResult.rolls
    };
    ChatMessage.create(chatData, { item: this, rollResult: mainRoll.total, result: result });
    return skillCheckResult;
  }


  async getResultXP(result) {
    let xp = await this.calcResultXP(result);

    let fv = this.system.fv;
    if (xp && xp.gained > 0) {
      await this.giveExperience(xp.gained);
      let newFv = this.system.fv;
      if (newFv > fv) {
        xp.newFv = newFv;
      }

    }

    return xp;
  }
  async calcResultXP(result) {
    const gameTime = game.time.worldTime;
    const durationSinceLastXp = gameTime - this.lastXpTime();
    switch(result) {
      case 'SUCCESS':

        if (durationSinceLastXp > 0) {
          return {
            gained: 1
          };
        } else {
          return null;
  
        }
      case 'SPECIAL':
        return {
          gained: 2
        };
      case 'PERFECT':
        let xpRoll = new Roll('d3+1');
        await xpRoll.evaluate();

        return {
          roll:xpRoll,
          gained: xpRoll.total
        };

        case 'FAIL':
          default:
          return null;
    }



  }

  lastXpTime() {
    if (this.system.lastXpTime) {
      return this.system.lastXpTime;
    }
    return 0;
  }
}
