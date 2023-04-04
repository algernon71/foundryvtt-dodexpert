const allSkills = [
  { "subtype": "UPT", "name": "Finna dolda ting", "bc": true, "ge": "INT", "cost": "2", "type": "A"},
  { "subtype": "UPT", "name": "Upptäcka fara", "bc": true, "ge": "PSY", "cost": "4", "type": "A"},
  { "subtype": "UPT", "name": "Lyssna", "bc": true, "ge": "INT", "cost": "2", "type": "A"},
  { "subtype": "TJU", "name": "Smyga", "bc": true, "ge": "SMI", "cost": "2", "type": "A"},
  { "subtype": "TJU", "name": "Klättra", "bc": true, "ge": "SMI", "cost": "1", "type": "A"},
  { "subtype": "TJU", "name": "Hoppa", "bc": true, "ge": "SMI", "cost": "1", "type": "A"},
];
export class AddSkillDialog extends FormApplication {


  constructor(data) { // myObject is the object your app modifies, such as an Actor or Item
    super(data, { title: 'Välj färdighet'});
    this.data = data;
    this.search = '';

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
      template: "systems/dodexpert/templates/dialog/add-skill-dialog.html",
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
    html.find('#search').keyup(this._onUpdateSearch.bind(this));
    this.inputElement = html.find('#search');
  }

  _onUpdateSearch(event) {
    console.info('_onUpdateSearch', event);

    this.search = this.inputElement.val();
    // this.render();
  }


  _onUpdateSettings(event) {
    this.mod = this.modElement.val();
    this.calculate();
  }

  filterSkills(str) { 
    return allSkills.filter(skill => skill.name.indexOf(str) >= 0);
  }
  /**
   * @override
   */
  getData(options) {
    const context = super.getData();
    const renderData = options.renderData;

    context.actor = this.data.actor;
    context.skills = this.filterSkills(this.search);
    context.search = this.search;

    return context;
  }

  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);


  }
}


