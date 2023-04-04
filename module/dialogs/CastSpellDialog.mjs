
export class CastSpellDialog extends FormApplication {


  constructor(data) { // myObject is the object your app modifies, such as an Actor or Item
    super(data, { title: 'Attack'});
    this.data = data;

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
    this.calculate();
  }

  /**
   * @override
   */
  getData(options) {
    const context = super.getData();
    const renderData = options.renderData;

    context.actor = this.data.actor;
    return context;
  }

  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);


  }
}


