import { SkillCheckDialog} from "../dialogs/SkillCheckDialog.mjs"
import { AddSkillDialog} from "../dialogs/AddSkillDialog.mjs"

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
      const skillsPack = game.packs.get(skillPack);
      this.skillDef = await skillsPack.getDocument(skillId);

      if (this.skillDef) {
        this.name = this.skillDef.name;
        this.system.description = this.skillDef.system.description;
        this.system.cost =  this.skillDef.system.cost;
        this.system.ability =  this.skillDef.system.ability;
        this.system.category =  this.skillDef.system.category;
        this.system.schoolId =  this.skillDef.system.schoolId;
        console.info('Skill initialized!', this);
  
      } else {
        console.info('Failed to initialize skill, with def id:' + skillId, this);
      }
    }
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


    this.skillCheckDialog = new SkillCheckDialog({skill: this} );
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
    const item = this;

    // Initialize chat data.
    const speaker = ChatMessage.getSpeaker({ actor: this.actor });
    const rollMode = game.settings.get('core', 'rollMode');
    const label = `[${item.type}] ${item.name}`;

    console.log('item roll, speaker:', speaker);
    console.log('item roll, rollmode:', rollMode);
    console.log('item roll, label:', label);
    // If there's no roll data, send a chat message.
    if (!this.system.formula) {
      ChatMessage.create({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
        content: item.system.description ?? ''
      });
    }
    // Otherwise, create a roll and send a chat message from it.
    else {
      // Retrieve roll data.
      const rollData = this.getRollData();

      // Invoke the roll and submit it to chat.
      const roll = new Roll(rollData.item.formula, rollData);
      // If you need to store the value first, uncomment the next line.
      // let result = await roll.roll({async: true});
      roll.toMessage({
        speaker: speaker,
        rollMode: rollMode,
        flavor: label,
      });
      return roll;
    }
  }

  
  async skillRoll( skillCheckData) {
    let r = new Roll("d20");


    // Execute the roll
    await r.evaluate({ async: true });
    await game.dice3d.showForRoll(r);

    let rolls = '';
    const rollResult = r.total;
    const cl = skillCheckData.cl;
    const isGM = game.user.isGM;
    const isObserver = this.testUserPermission(game.user, "OBSERVER") ;
    var result = "MISSLYCKAT";
    const skillCheckResult = {
      skill: this,
      mod : skillCheckData.mod,
      diff: 0,
      fv: this.system.fv,
      cl: skillCheckData.cl,
      result: "MISSLYCKAT",
      rollsList: []

  };


    if (rollResult <= cl) {
      skillCheckResult.result = "LYCKAT";
      skillCheckResult.diff = cl - rollResult;
    } 
    
    skillCheckResult.rollsList.push({ roll: rollResult, title: ""});
    if (rollResult == 1) {
      let fr = new Roll("d20");
      await fr.evaluate({ async: true });
      await game.dice3d.showForRoll(fr);
      skillCheckResult.rollsList.push({ roll: fr.total, title: "Kontrolslag för perfekt"});
      if (fr.total <= cl) {
        skillCheckResult.diff *= 4;
        skillCheckResult.result = "PERFEKT";
      }
    } else if (rollResult <= 5) {
      let fr = new Roll("d20");
      await fr.evaluate({ async: true });
      await game.dice3d.showForRoll(fr);
      skillCheckResult.rollsList.push({ roll: fr.total, title: "Kontrolslag för särskild"});
      if (fr.total <= cl) {
        skillCheckResult.diff *= 2;
        skillCheckResult.result = "SÄRSKILLT";
      }

    }
    if (rollResult == 20) {
      let fr = new Roll("d20");
      await fr.evaluate({ async: true });
      await game.dice3d.showForRoll(fr);
      skillCheckResult.rollsList.push({ roll: fr.total, title: "Kontrolslag för fummel"});
      
      if (fr.total > cl) {
        skillCheckResult.result = "FUMMEL";
      }
    }


    const content = await renderTemplate("systems/dodexpert/templates/chat/skill-check-result.html", skillCheckResult);

    const rollMode = game.settings.get("core", "rollMode");
    var chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content,
      rolls: [r]
    };
    ChatMessage.create(chatData, { item: this, rollResult: rollResult, result: result });
    return skillCheckResult;
  }
}
