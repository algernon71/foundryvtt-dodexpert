
export class AttackDialog extends FormApplication {


  constructor(data) { // myObject is the object your app modifies, such as an Actor or Item
    super(data, { title: 'Attack' });
    this.data = data;
    this.data.mod = 0;

  }

  /**
   * @override
   */
  static get defaultOptions() {
    const defaults = super.defaultOptions;

    const overrides = {
      closeOnSubmit: false,
      height: '200px',
      id: 'attack-dialog',
      submitOnChange: true,
      template: "systems/dodexpert/templates/dialog/attack-dialog.html",
      title: 'Attack',
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
  async roll() {
    const skill = this.data.skill;
    skill.skillRoll({
      mod: this.data.mod,
      cl: this.data.cl
    });
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
    const targets = game.user.targets;
    
    context.actor = this.data.weapon.parent;
    context.weapon = this.data.weapon;
    context.skill = this.data.skill;
    if (context.skill) {
      context.fv = this.data.skill.system.fv;
    } else {
      context.fv = 0;
    }
    context.aim = "any";
    context.targets = [];
    context.aimable = false;
    for (const t of targets.values()) {
      context.targets.push(t);
    }

    if (context.targets.length == 1) {
      context.aimable = true;
      context.target = context.targets[0];
      context.aimTargets = [];
      const actorToken = context.actor.prototypeToken;
      const targetToken = context.target;
      const actorTransform = actorToken.transform;
      const targetTransform = targetToken.transform;

    if (context.target) {
        context.targetActor = context.target.document.actor;
        const body = context.targetActor.system.body;
        const scene = context.target.scene;
        for (const sceneToken of scene.tokens.entries()) {
        }

        for (const [key, part] of Object.entries(body)) {
          const aimTarget = {
            id: key,
            name: part.name,
            mod: -5,
            part: part
          };
          context.aimTargets.push(aimTarget);
        }
      }

    }

    context.movementTypes = [
      {
        'id': 'still',
        'name': 'står still',
        'modStr': 'x1',
        'mod': '1'
      },
      {
        'id': 'moving',
        'name': 'går',
        'modStr': 'x3/4',
        'mod': '0.75'
      },
      {
        'id': 'running',
        'name': 'springer',
        'modStr': 'x1/2',
        'mod': '0.5'
      },
      {
        'id': 'flying',
        'name': 'flyger',
        'modStr': 'x1/4',
        'mod': '0.25'
      }

    ];
    context.targetMovement = 'still';

    const weaponCategory = context.weapon.system.category;
    switch (weaponCategory) {
      case 'range':
        context.ranged = true;
        context.range = 10;
        const token = context.actor.token ?? context.actor.getActiveTokens()[0];
        const user = game.user;
        const target = user.targets.first();
        const ac = token.object.center;
        const tc = target.center;
        const distance = canvas.grid.measureDistance(ac, tc);
        context.range = Math.round(distance);
        break;

      default:
        context.ranged = false;
        break;
    }

    return context;
  }

  /**
   * @override
   */
  async _updateObject(event, formData) {
    const expandedData = foundry.utils.expandObject(formData);


  }
}


