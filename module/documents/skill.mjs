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
      const ability = actor.data.system.abilities[this.system.ability];
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
    const fv = skill.system.fv;
    const mod = skillCheckData.mod;
    const cl = skillCheckData.cl;
    const isGM = game.user.isGM;
    const isObserver = this.testUserPermission(game.user, "OBSERVER") ;
    var result = "MISSLYCKAT";
    if (rollResult <= cl) {
      rolls = rolls + `<li><div class="roll die d20" style="transform: scale(1.1);margin-right: 4px">${rollResult}</div>   &lt= ${cl}</li>`;
      result = "LYCKAT";
    } else {
      rolls = rolls + `<li class="roll die d20" style="transform: scale(1.1);margin-right: 4px">${rollResult}   &gt ${cl}</li>`;

    }
    if (rollResult == 1) {
      let fr = new Roll("d20");
      await game.dice3d.showForRoll(fr);
      await fr.evaluate({ async: true });
      if (fr.total <= cl) {
        rolls = rolls + `<li><div class="roll die d20" style="transform: scale(1.1);margin-right: 4px">${fr.total} </div>  &lt= ${cl} - kontrollslag för perfekt</li>`;
        result = "PERFEKT";
      }
      else {
        rolls = rolls + `<li class="roll die d20" style="transform: scale(1.1);margin-right: 4px">${fr.total}   &gt ${cl} - kontrollslag för perfekt</li>`;
      }
    }
    if (rollResult == 20) {
      let fr = new Roll("d20");
      await game.dice3d.showForRoll(fr);
      await fr.evaluate({ async: true });
      if (fr.total > cl) {
        result = "FUMMEL";
      }
    }


    var content = `
    <div class="dice-roll attack-roll">
      <div>Färdighetsslag för ${skill.name}</div>
      <div>CL: ${cl} (${fv} ${mod}) </div>
      <div class="dice-result">
       <div class="dice-tooltip" style="display: block;">
        <section class="tooltip-part">
            <div class="dice">
                  <ol class="dice-rolls">
                    ${rolls}
                </ol>
    
            </div>
        </section>
      </div>
         <h4 class="dice-total damage-value" data-damage="${rollResult}" data-skill"${this}">
         ${result} 
         </h4>
         <button class="roll-damage" data-damage="${rollResult}" data-skill="${skill._id}" data-actor="${skill.actor}" >Slå för skada</button>
     </div>
    </div> `;
    var messageContent = `${skill.name}:  ${rollResult} (${skill.system.fv}) : ${result}`;
    this.resultElement.append(content);

    const rollMode = game.settings.get("core", "rollMode");
    var chatData = {
      user: game.user._id,
      speaker: ChatMessage.getSpeaker({ actor: this.actor }),
      content: content,
      rolls: [r]
    };
    ChatMessage.create(chatData, { item: this.skillCheckData.skill, rollResult: rollResult, result: result });

  }
}
