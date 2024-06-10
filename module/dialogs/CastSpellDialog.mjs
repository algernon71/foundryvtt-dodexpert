
export class CastSpellDialog extends FormApplication {


  constructor(data) { // myObject is the object your app modifies, such as an Actor or Item
    super(data, { title: 'Attack'});
    this.data = data;
    this.data.power = 1;
    
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
      width: '300px',
      id: 'skill-check-dialog',
      submitOnChange: true,
      template: "systems/dodexpert/templates/dialog/cast-spell-dialog.html",
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
      console.info('this.data:', this.data);
      this.roll();
    }

  }

  async roll() {
    const skill = this.data.skill;
    const result = await skill.skillRoll({
      mod: this.data.mod,
      cl: this.data.cl
    });
    const content = await renderTemplate("systems/dodexpert/templates/dialog/skill-check-result.html", result);

    this.resultElement.html(content);

  }

  /**
   * @override
   */
  activateListeners(html) {
    super.activateListeners(html);

    html.find('.spell-power').click(this._onSelectSpellPower.bind(this));
    html.on('click', "[data-action]", this._handleButtonClick.bind(this));
    html.find('.roll-parameter').keyup(this._onUpdateSettings.bind(this));
    this.modElement = html.find('#mod');
    this.clElement = html.find('#cl');
    this.resultElement = html.find('#result');
    this.rollButton = html.find('#roll-button');

    this.spellPowerElements = html.find('.spell-power');
    this.refresh();

  }

  _onUpdateSettings(event) {
    this.mod = this.modElement.val();
    this.calculate();
  }

  /**
   * @override
   */
  getData(options) {
    const context = super.getData();
    const renderData = options.renderData;
    context.skillname = this.data.skill.skillDef.name;
    context.fv = this.data.skill.getFV();
    context.skill = this.data.skill;
    context.check = this.data;
    context.actor = this.data.actor;


    context.spellPowers = [];
    for (var i = 1 ; i < context.fv / 2 ; ++i) {
      context.spellPowers.push({
        "name": i,
        "power": i
      });      
    }


    return context;
  }
  async _onSelectSpellPower(event) {
    const a = event.currentTarget;
    const data = a.dataset;
    
    this.data.power = data.power;

    this.refresh();
  }

  async refresh() {
    this.calculate();
    this.modElement.val(this.data.mod);
    this.clElement.html(this.data.cl);
    this.updateSpellPower();
  }

  updateSpellPower() {
    this.spellPowerElements.each((i, e) => {
      const data = e.dataset;
      const power = data.power;
      e.classList.remove("selected");
      if (power == this.data.power) {
        e.classList.add("selected");        
      }
    })
  }

  calculate() {
    this.data.mod = (this.data.power -1 ) * -2;
    this.data.cl = Number(this.data.skill.getFV()) + this.data.mod;
  }

  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);


  }
}


