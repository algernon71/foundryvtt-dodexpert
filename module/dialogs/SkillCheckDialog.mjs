
export class SkillCheckDialog extends FormApplication {


  constructor(data) { // myObject is the object your app modifies, such as an Actor or Item
    super(data, { title: 'Slå för ' + data.skill.name });
    this.data = data;
    if (!this.data.mod) {
      this.data.mod = '+0';
    }

    this.mod = this.data.mod;
    this.calculate();
  }

  calculate() {

    this.data.cl = this.data.skill.system.fv + Number(this.data.mod);

  }
  /**
   * @override
   */
  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      closeOnSubmit: false,
      height: '200px',
      id: 'skill-check-dialog',
      submitOnChange: true,
      template: "systems/dodexpert/templates/dialog/skill-check-dialog.html",
      title: 'Slå för färdighet',
      userId: game.userId,
    };

    const mergedOptions = foundry.utils.mergeObject(defaults, overrides);

    return mergedOptions;
  }

  /**
   * Callback passed to Button Click event listener which handles it
   * 
   * @param {MouseEvent} event - the triggering mouse click event
   */
  async _handleButtonClick(event) {
    const clickedElement = $(event.currentTarget);
    const action = clickedElement.data().action;
    if (action == 'roll') {
      this.roll();
    }

  }

  /**
   * @override
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.find('.roll-parameter').keyup(this._onUpdateSettings.bind(this));
    this.modElement = html.find('#mod');
    this.clElement = html.find('#cl');
    this.resultElement = html.find('#result');
    this.rollButton = html.find('#roll-button');
  }

  _onUpdateSettings(event) {
    this.mod = this.modElement.val();
    this.data.mod = Number(this.mod);
    this.calculate();

    this.clElement.html(this.data.cl);
  }

  async roll() {
    let r = new Roll("d20");

    const skill = this.data.skill;
    // this.rollButton.prop("disabled", true);
    // The parsed terms of the roll formula
    console.log(r.terms);    // [Die, OperatorTerm, NumericTerm, OperatorTerm, NumericTerm]

    // Execute the roll
    await r.evaluate({ async: true });
    await game.dice3d.showForRoll(r);

    let rolls = '';
    const rollResult = r.total;
    const fv = skill.system.fv;
    const mod = this.data.mod;
    const cl = this.data.cl;
    const isGM = game.user.isGM;
    const isObserver = skill.testUserPermission(game.user, "OBSERVER") ;
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
    ChatMessage.create(chatData, { item: this.data.skill, rollResult: rollResult, result: result });

  }
  /**
   * @override
   */
  getData(options) {
    const context = super.getData();
    const renderData = options.renderData;
    context.skill = this.data.skill;
    context.check = this.data;
    context.mod = this.mod;
    context.difficulties = [
      {
        "name": "Mycket lätt",
        "mod": 10
      },
      {
        "name": "lätt",
        "mod": 5
      },
      {
        "name": "Normalt",
        "mod": 10
      },
      {
        "name": "Svårt",
        "mod": -5
      },
      {
        "name": "Mycket svårt",
        "mod": -10
      }
    ];
    return context;
  }

  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);


  }
}


