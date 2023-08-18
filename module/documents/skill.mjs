import { SkillCheckDialog} from "../dialogs/SkillCheckDialog.mjs"
import { AddSkillDialog} from "../dialogs/AddSkillDialog.mjs"

export class CheckModifier {

  constructor(id, name, modifier) {
    this.id = id;
    this.update(name, modifier);
  }

  update(name, modifier) {
    this.name = name;
    this.modifierString = modifier;      
    this.description = modifier;
    this.active = false;
    this.numerator = null;
    this.denominator = null;
    this.mod = null;
    if (modifier.startsWith('x')) {
      const dp = modifier.indexOf('/');
      if (dp > 0) {
        this.numerator = Number(modifier.substring(1, dp));
        this.denominator = Number(modifier.substring(dp+1));
      } else {
        this.numerator = Number(modifier.substring(1));
      }
    } else {
      this.mod = Number(modifier);
      if (modifier.startsWith('-')) {

      }
    }

  }

  apply(cl) {
    const clIn = cl;
    if (this.numerator) {
      cl = cl * this.numerator;
    }
    if (this.denominator) {
      cl = cl / this.denominator;
    }

    if (this.mod) {
      cl = cl + this.mod;
    }

    if (clIn !== cl) {
      // console.info(this.name + ' ' + clIn + this.modifierString + ' = ' + cl);
      this.active = true;
    } else {
      this.active = false;
    }
    return cl;
  }


  
}

export class CheckResult {
}

export class Check {

  constructor(title, basename, basecl) {
    this.title = title;
    this.basename = basename;
    this.basecl = basecl;
    this.cl = this.basecl;
    this.modifiers = [];
  }

  updateModifier(id, modName, modifier) {
    let m = null;
    for (let i = 0 ; i < this.modifiers.length ; ++i) {
      if (this.modifiers[i].id === id) {
        m = this.modifiers[i];
      }
    }

    if (m) {
      m.update(modName, modifier);
    } else {
      m = new CheckModifier(id, modName, modifier);
      this.modifiers.push(m);
    }

    this.recalculate();

  }


  recalculate() {
    let cl = Number(this.basecl);
    
    for (let i = 0 ; i < this.modifiers.length ; ++i) {
      cl = this.modifiers[i].apply(cl);
    }
    this.cl = cl;
    let descr = this.name + ' ' + this.basename + ' ' + this.basecl + ' ';
    for (let i = 0 ; i < this.modifiers.length ; ++i) {
      const modifier = this.modifiers[i];
      if (modifier.active) {
        descr += modifier.modifierString + ' ';

      }
    }
    descr += ' = CL: ' + cl;
    console.info(descr);
  }

  async render() {
    const content = await renderTemplate("systems/dodexpert/templates/check/check.html", this);
    return content;

  }
}


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
        // console.info('Skill initialized!', this);
  
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
      result: "FAIL",
      resultTitle: "Misslyckat",
      rollsList: [],
      content: ''

  };


    if (rollResult <= cl) {
      skillCheckResult.result = "SUCCESS";
      skillCheckResult.resultTitle = "Lyckat";
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
        skillCheckResult.result = "PERFECT";
        skillCheckResult.resultTitle = "PERFEKT!";
      }
    } else if (rollResult <= 5) {
      let fr = new Roll("d20");
      await fr.evaluate({ async: true });
      await game.dice3d.showForRoll(fr);
      skillCheckResult.rollsList.push({ roll: fr.total, title: "Kontrolslag för särskild"});
      if (fr.total <= cl) {
        skillCheckResult.diff *= 2;
        skillCheckResult.result = "SPECIAL";
        skillCheckResult.resultTitle = "Särskillt!";
      }

    }
    if (rollResult == 20) {
      let fr = new Roll("d20");
      await fr.evaluate({ async: true });
      await game.dice3d.showForRoll(fr);
      skillCheckResult.rollsList.push({ roll: fr.total, title: "Kontrolslag för fummel"});
      
      if (fr.total > cl) {
        skillCheckResult.resultTitle = "FUMMEL!";
        skillCheckResult.result = "FUMBLE";
      }
    }


    const chatMessage = await renderTemplate("systems/dodexpert/templates/chat/skill-check-result.html", skillCheckResult);
    const rollMode = game.settings.get("core", "rollMode");
    var chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: chatMessage,
      rolls: [r]
    };
    ChatMessage.create(chatData, { item: this, rollResult: rollResult, result: result });
    return skillCheckResult;
  }
}
