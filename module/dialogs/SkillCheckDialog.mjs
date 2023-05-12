
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
    html.find('.difficulty').click(this._onSelectDifficulty.bind(this));
    html.find('.roll-parameter').keyup(this._onUpdateSettings.bind(this));
    html.find("#mod").change(this._onModInputChange.bind(this));
    this.modElement = html.find('#mod');
    this.clElement = html.find('#cl');
    
    this.resultElement = html.find('#result');
    this.rollButton = html.find('#roll-button');

    this.difficultyElements = html.find('.difficulty');

    this.updateSelectedElement();
  }

  updateSelectedElement() {
    this.difficultyElements.each((i, e) => {
      const data = e.dataset;
      const mod = Number(data.mod);;
      e.classList.remove("selected");
      if (mod == this.data.mod) {
        e.classList.add("selected");        
      }
    })
  }
  _onUpdateSettings(event) {
    this.mod = this.modElement.val();
    this.data.mod = Number(this.mod);
    this.refresh();
  }

  async roll() {
    const skill = this.data.skill;
    skill.skillRoll({
      mod: mod = this.data.mod,
      cl: cl = this.data.cl
    });
  }
  
  /**
   * @override
   */
  getData(options) {
    const context = super.getData();
    const renderData = options.renderData;
    context.skillname = this.data.skill.skillDef.name;
    context.fv = this.data.skill.system.fv;
    context.skill = this.data.skill;
    context.check = this.data;
    context.mod = this.mod;

    context.difficulties = [
      {
        "name": "Mycket lätt",
        "mod": "+10"
      },
      {
        "name": "lätt",
        "mod": "+5"
      },
      {
        "name": "Normalt",
        "mod": "+0"
      },
      {
        "name": "Svårt",
        "mod": "-5"
      },
      {
        "name": "Mycket svårt",
        "mod": "-10"
      }
    ];
    return context;
  }


  calculate() {
    this.data.cl = Number(this.data.skill.system.fv) + Number(this.data.mod);
  }

  async _onSelectDifficulty(event) {
    const a = event.currentTarget;
    const data = a.dataset;
    
    this.data.mod = Number(data.mod);

    this.refresh();
  }

  async _onModInputChange(event) {
    event.preventDefault();
    const element = event.currentTarget;
    /*
    const itemElement = element.closest(".item");
    const itemId = itemElement.dataset.itemId;
    const item = this.actor.items.get(itemId);
    const field = element.dataset.field;
    return item.update({ [field]: element.value });
*/
    this.data.mod = Number(element.value);
    this.refresh();
  }

  async refresh() {
    this.modElement.val(this.getModText());
    this.calculate();
    this.clElement.html(this.data.cl);
    this.updateSelectedElement();
  }

  getModText() {
    if (this.data.mod >= 0) {
      return "+" + this.data.mod;
    } else {
      return this.data.mod;
    }
  }
  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);


  }
}


