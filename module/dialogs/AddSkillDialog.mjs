
function compareNumbers(a, b) {
  return a - b;
}
export class AddSkillDialog extends FormApplication {


  constructor(data) { // myObject is the object your app modifies, such as an Actor or Item
    super(data, {
      title: data.title
    });
    this.data = data;
    this.search = '';
    this.selectedSkill = null;
    this.selectedSkillIndex = -1;
    this.selectedSkillElement = null;
    this.addedSkills = [];
  }

  /**
   * @override
   */
  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      closeOnSubmit: false,
      height: 600,
      width: 600,
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

    const t = this;
    this.inputElement = document.querySelector('#skill-search-input'); // html.find('#skill-search-input');
    document.querySelector('#add-skill-button').addEventListener("click", this.addSkill.bind(this));
    this.inputElement.addEventListener("input", this._onUpdateSearch.bind(this));
    this.inputElement.addEventListener("keydown", function (e) {
      if (e.keyCode == 40) {
        t.selectNextSkill();
      } else if (e.keyCode == 38) { //up
        t.selectPreviousSkill();
      } else if (e.keyCode == 13) {
        t.addSkill();
      }
    });
    this.matchListElement = document.querySelector('#skill-match-list');
    this.selectedSkillInfoElement = document.querySelector('#add-selected-skill');
    const allItems = Items.instance;
    this.updateMatchList('');
  }

  _onUpdateSearch(event) {
    console.info('_onUpdateSearch', event);

    this.updateMatchList(this.inputElement.value);
  }


  sortOrder(item) {
    if (item.system.sortorder ) {
      return Number(item.system.sortorder);
    }

    return 10;
  }
  async filterMatches(searchString) {
    const resultsList = [];
    const matches = [];

    const skillsPack = game.packs.get('dodexpert.skills');
    const index = await skillsPack.getIndex({ fields: ["system.category", "system.cost", "system.ability", "system.type", "system.sortorder"] });
    index.forEach((item, key) => {
      if (this.matchItem(item, searchString)) {
        matches.push(item);
      }
    });
    matches.sort((a, b) => compareNumbers(this.sortOrder(a) , this.sortOrder(b)));
    return matches;

  }

  matchItem(item, searchString) {
    if (item.type != this.data.type) {
      return false;
    }
    let category = item.system.category;
    const subtype = item.system.category;
    if (subtype) {

      if (this.data.includeSubtypes && !this.data.includeSubtypes.find(st => subtype == st)) {
        return false;

      }
      if (this.data.excludeSubtypes && this.data.excludeSubtypes.find(st => subtype == st)) {
        return false;

      }
    }
    if (!item.name.toLowerCase().includes(searchString.toLowerCase())) {
      return false;
    }

    for (const existingItem of this.addedSkills) {
      if (existingItem.name === item.name) {
        return false;
      }
      
    }
    for (const existingItem of this.data.actor.items.values()) {
      if (existingItem.name === item.name) {
        return false;
      }
    }

    return true;
  }

  async updateMatchList(searchString) {
    this.clearSelect();
    this.matchedSkills = await this.filterMatches(searchString);
    this.matchListElement.innerHTML = "";
    let innerElement = "";
    const t = this;
    this.matchEntryElements = [];
    this.matchedSkills.forEach((skill, index) => {
      const matchEntry = document.createElement('DIV');
      matchEntry.innerHTML = t.buildMatchEntryHTML(skill, index, false);
      matchEntry.addEventListener("click", function (e) {
        t.selectSkill(index);
      });
      this.matchListElement.appendChild(matchEntry);
      this.matchEntryElements.push(matchEntry);

    });
    if (this.matchEntryElements.length > 0) {
      this.selectNextSkill();
    }
  }

  buildMatchEntryHTML(skill, index, selected) {
    return `
    <div class="skill-match-entry" id="skill-match-entry-${index}">
      <div class="skill-match-name">${skill.name}</div>
      <div class="skill-match-ability">${skill.system.ability}</div>
      <div class="skill-match-cost">${skill.system.cost}</div>
      <div class="skill-match-type">${skill.system.type}-färdighet</div>
      <div class="skill-match-type">${skill.type}</div>
      <div class="skill-match-type">${skill.system.category}</div>
    </div>
    `;
  }


  _onUpdateSettings(event) {
    this.mod = this.modElement.val();
    this.calculate();
  }




  selectPreviousSkill() {
    if (this.selectedSkillIndex < 0) {
      return;
    }

    this.selectSkill(this.selectedSkillIndex - 1);
  }
  selectNextSkill() {
    if (this.selectedSkillIndex >= this.matchedSkills.length) {
      return;
    }

    this.selectSkill(this.selectedSkillIndex + 1);
  }

  clearSelect() {
    if (this.selectedSkill) {
      const element = document.querySelector('#skill-match-entry-' + this.selectedSkillIndex);
      element.classList.remove("selected-skill-entry");
    }
    this.selectedSkill = null;
    this.selectedSkillIndex = -1;
    this.selectedSkillElement = null;
    this.selectedSkillInfoElement.style.display = 'none';

  }
  selectSkill(index) {
    if (this.selectedSkill) {
      const element = document.querySelector('#skill-match-entry-' + this.selectedSkillIndex);
      element.classList.remove("selected-skill-entry");
    }
    const skill = this.matchedSkills[index];
    const skillsPack = game.packs.get('dodexpert.skills');

    this.selectedSkill = skill;
    this.selectedSkillIndex = index;
    const element = document.querySelector('#skill-match-entry-' + index);
    //    element.innerHTML = this.buildMatchEntryHTML(skill, index, true);
    element.classList.add("selected-skill-entry");

    let innerHtml = `
    <div class="selected-skill-name">${skill.name}</div>
    <div class="selected-skill-cost">Kostnad: ${skill.system.cost}</div>
    <div class="selected-skill-ability">Grundegenskap: ${skill.system.ability}</div>
    <div class="selected-skill-type">Typ: ${skill.system.type}-färdighet</div>`;
    if (skill.bc) {
      innerHtml += `<div class="selected-skill-type">BC: ${skill.system.ability}</div>`;
    } else {
      innerHtml += `<div class="selected-skill-type">BC: 0</div>`;
    }
    this.selectedSkillInfoElement.innerHTML = innerHtml;

    this.selectedSkillInfoElement.style.display = 'block';
  }

  async addSkill(event) {
    const skillsPack = game.packs.get('dodexpert.skills');
    const skill = await skillsPack.getDocument(this.selectedSkill._id);
    const itemData = game.items.fromCompendium(skill);
    this.addedSkills.push(itemData);
    // await game.items.importFromCompendium(skillsPack, this.selectSkill._id, {}, { parent: this.data.actor });
    // await this.data.actor.createEmbeddedDocuments("Item", [itemData]);
    await Item.create(itemData, { parent: this.data.actor });

    this.inputElement.value = "";
    this.updateMatchList('');
    // this.close();
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


