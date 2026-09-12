/* ============================================================
   ЛОГИСТИКА — УПРАВЛЕНЧЕСКАЯ ИГРА
   Game Script
   ============================================================ */

/* ============================================================
   CONFIGURATION
   ============================================================ */
const CONFIG = {
  MAX_ROUNDS: 20,
  START_MONEY: 500000,
  START_REPUTATION: 50,
  MAX_REPUTATION: 100,
  PASS_START_BONUS: 50000,
  GRID_SIZE: 11,
  CELLS_PER_SIDE: 11,
  TOTAL_CELLS: 40,
  CREDIT_AMOUNT: 100000,
  CREDIT_REPAY: 120000,
  CREDIT_TERM: 5,
};

/* ============================================================
   UTILITY
   ============================================================ */
const Util = {
  formatMoney: (n) => Math.round(n).toLocaleString('ru-RU') + ' ₽',
  formatNum: (n) => Math.round(n).toLocaleString('ru-RU'),
  clamp: (v, min, max) => Math.max(min, Math.min(max, v)),
  rand: (min, max) => Math.floor(Math.random() * (max - min + 1)) + min,
  pick: (arr) => arr[Math.floor(Math.random() * arr.length)],
  rollDie: () => Util.rand(1, 6),
  rollTwo: () => ({ d1: Util.rollDie(), d2: Util.rollDie(), total: Util.rollDie() + Util.rollDie() }),
};

/* ============================================================
   CELL POSITIONS (40 cells on 11x11 grid perimeter)
   ============================================================ */
function getCellPositions() {
  const pos = [];
  // Bottom: row 10, col 0-10
  for (let c = 0; c <= 10; c++) pos.push({ row: 10, col: c });
  // Right: col 10, row 9-1
  for (let r = 9; r >= 1; r--) pos.push({ row: r, col: 10 });
  // Top: row 0, col 10-0
  for (let c = 10; c >= 0; c--) pos.push({ row: 0, col: c });
  // Left: col 0, row 1-9
  for (let r = 1; r <= 9; r++) pos.push({ row: r, col: 0 });
  return pos; // 11 + 9 + 11 + 9 = 40
}

/* ============================================================
   CELL DEFINITIONS
   ============================================================ */
const CELLS = (() => {
  const P = {
    sklad: { name: 'Склад', group: 'Складская', color: 'green', cost: 100000, income: 15000, upgradeCost: 80000, icon: '🏭' },
    rc: { name: 'Распределительный центр', group: 'Складская', color: 'green', cost: 130000, income: 20000, upgradeCost: 100000, icon: '🏗️' },
    terminal: { name: 'Грузовой терминал', group: 'Терминалы', color: 'blue', cost: 160000, income: 25000, upgradeCost: 120000, icon: '🏢' },
    avtopark: { name: 'Автопарк', group: 'Автомобильная', color: 'green', cost: 150000, income: 22000, upgradeCost: 110000, icon: '🚛' },
    hub: { name: 'Логистический хаб', group: 'Хабы', color: 'blue', cost: 180000, income: 28000, upgradeCost: 140000, icon: '🏬' },
    port: { name: 'Порт', group: 'Морская логистика', color: 'teal', cost: 250000, income: 38000, upgradeCost: 180000, icon: '⚓' },
    rail: { name: 'Железнодорожный терминал', group: 'Железнодорожная', color: 'blue', cost: 200000, income: 32000, upgradeCost: 150000, icon: '🚂' },
    airport: { name: 'Грузовой аэропорт', group: 'Авиация', color: 'orange', cost: 300000, income: 45000, upgradeCost: 220000, icon: '✈️' },
  };
  const T = {
    avto: { name: 'Автомобильные перевозки', cost: 120000, income: 18000, icon: '🚚' },
    rail: { name: 'Железная дорога', cost: 200000, income: 30000, icon: '🚆' },
    sea: { name: 'Морские перевозки', cost: 250000, income: 35000, icon: '🚢' },
    air: { name: 'Авиаперевозки', cost: 300000, income: 42000, icon: '🛩️' },
  };

  function prop(name) {
    for (const k in P) { if (P[k].name === name) return P[k]; }
    return null;
  }

  const cells = [
    { id: 0,  type: 'start',     label: 'СТАРТ',                icon: '🏁', desc: 'Старт' },
    { id: 1,  type: 'property',  label: 'Склад',                icon: '🏭', prop: 'sklad' },
    { id: 2,  type: 'event',     label: 'Событие',              icon: '❗' },
    { id: 3,  type: 'transport', label: 'Авто перевозки',       icon: '🚚', transport: 'avto' },
    { id: 4,  type: 'property',  label: 'Распред центр',        icon: '🏗️', prop: 'rc' },
    { id: 5,  type: 'order',     label: 'Заказ',                icon: '📦' },
    { id: 6,  type: 'property',  label: 'Груз терминал',        icon: '🏢', prop: 'terminal' },
    { id: 7,  type: 'contract',  label: 'Контракт',             icon: '📋' },
    { id: 8,  type: 'property',  label: 'Автопарк',             icon: '🚛', prop: 'avtopark' },
    { id: 9,  type: 'special',   label: 'Штаб квартира',        icon: '🏛️', desc: 'Бесплатный доход 10 000 ₽' },
    { id: 10, type: 'property',  label: 'Логистический хаб',    icon: '🏬', prop: 'hub' },
    { id: 11, type: 'transport', label: 'Железная дорога',      icon: '🚆', transport: 'rail' },
    { id: 12, type: 'event',     label: 'Событие',              icon: '❗' },
    { id: 13, type: 'property',  label: 'Порт',                 icon: '⚓', prop: 'port' },
    { id: 14, type: 'risk',      label: 'Риск',                 icon: '⚠️' },
    { id: 15, type: 'transport', label: 'Морские перевозки',    icon: '🚢', transport: 'sea' },
    { id: 16, type: 'property',  label: 'Склад',                icon: '🏭', prop: 'sklad' },
    { id: 17, type: 'event',     label: 'Событие',              icon: '❗' },
    { id: 18, type: 'property',  label: 'Ж/Д терминал',         icon: '🚂', prop: 'rail' },
    { id: 19, type: 'special',   label: 'Свободный маршрут',    icon: '🛣️', desc: 'Пропустите один ход по выбору' },
    { id: 20, type: 'crisis',    label: 'Кризис',               icon: '🌪️', desc: 'Логистический кризис' },
    { id: 21, type: 'property',  label: 'Груз аэропорт',        icon: '✈️', prop: 'airport' },
    { id: 22, type: 'event',     label: 'Событие',              icon: '❗' },
    { id: 23, type: 'property',  label: 'Распред центр',        icon: '🏗️', prop: 'rc' },
    { id: 24, type: 'transport', label: 'Авиаперевозки',         icon: '🛩️', transport: 'air' },
    { id: 25, type: 'order',     label: 'Заказ',                icon: '📦' },
    { id: 26, type: 'property',  label: 'Логистический хаб',    icon: '🏬', prop: 'hub' },
    { id: 27, type: 'event',     label: 'Событие',              icon: '❗' },
    { id: 28, type: 'property',  label: 'Автопарк',             icon: '🚛', prop: 'avtopark' },
    { id: 29, type: 'special',   label: 'Штаб квартира',        icon: '🏛️', desc: 'Бесплатный доход 10 000 ₽' },
    { id: 30, type: 'market',    label: 'Рынок',                icon: '📊' },
    { id: 31, type: 'property',  label: 'Порт',                 icon: '⚓', prop: 'port' },
    { id: 32, type: 'event',     label: 'Событие',              icon: '❗' },
    { id: 33, type: 'property',  label: 'Склад',                icon: '🏭', prop: 'sklad' },
    { id: 34, type: 'contract',  label: 'Контракт',             icon: '📋' },
    { id: 35, type: 'property',  label: 'Груз терминал',        icon: '🏢', prop: 'terminal' },
    { id: 36, type: 'event',     label: 'Событие',              icon: '❗' },
    { id: 37, type: 'property',  label: 'Ж/Д терминал',         icon: '🚂', prop: 'rail' },
    { id: 38, type: 'risk',      label: 'Риск',                 icon: '⚠️' },
    { id: 39, type: 'special',   label: 'Штаб квартира',        icon: '🏛️', desc: 'Бесплатный доход 10 000 ₽' },
  ];

  // Enrich cells with prop/transport data
  const positions = getCellPositions();
  cells.forEach((cell, i) => {
    cell.pos = positions[i];
    if (cell.type === 'property' && cell.prop) {
      const p = P[cell.prop];
      Object.assign(cell, {
        pName: p.name, pGroup: p.group, pColor: p.color,
        pCost: p.cost, pIncome: p.income, pUpgradeCost: p.upgradeCost,
        pIcon: p.icon, pLevels: ['Обычный', 'Модернизированный', 'Автоматизированный']
      });
    }
    if (cell.type === 'transport' && cell.transport) {
      const t = T[cell.transport];
      Object.assign(cell, { tName: t.name, tCost: t.cost, tIncome: t.income, tIcon: t.icon });
    }
  });

  return cells;
})();

/* ============================================================
   EVENT DEFINITIONS (20+ events)
   ============================================================ */
const EVENTS = [
  { id: 1,  title: 'Рост цен на топливо',         desc: 'Стоимость автомобильных перевозок увеличена на 20% на 3 хода.',                effect: 'fuel',        money: 0 },
  { id: 2,  title: 'Поломка грузовика',           desc: 'Один из ваших грузовиков сломался. Заплатите 30 000 ₽ или пропустите ход.',    effect: 'choice',      money: -30000, alt: 'skip_turn' },
  { id: 3,  title: 'Пробка на трассе',            desc: 'Автомобильный маршрут занимает дополнительный ход.',                            effect: 'delay_road',  money: 0 },
  { id: 4,  title: 'Новый клиент',                desc: 'Крупный клиент предлагает срочный заказ с бонусом 20%.',                        effect: 'bonus_order', money: 0 },
  { id: 5,  title: 'Повреждение груза',           desc: 'Груз повреждён при транспортировке. Потеряйте 25 000 ₽.',                       effect: 'money',       money: -25000 },
  { id: 6,  title: 'Успешный контракт',           desc: 'Вы успешно завершили крупный контракт. Получите 50 000 ₽.',                      effect: 'money',       money: 50000 },
  { id: 7,  title: 'Неожиданный расход',          desc: 'Срочный ремонт оборудования. Заплатите 20 000 ₽.',                              effect: 'money',       money: -20000 },
  { id: 8,  title: 'Снижение налогов',            desc: 'Государство снизило налоги. Получите 15 000 ₽ бонуса.',                         effect: 'money',       money: 15000 },
  { id: 9,  title: 'Выгодная сделка',             desc: 'Удачная сделка на бирже грузоперевозок. Получите 40 000 ₽.',                     effect: 'money',       money: 40000 },
  { id: 10, title: 'Штраф за задержку',           desc: 'Просрочка поставки. Штраф 30 000 ₽.',                                          effect: 'money',       money: -30000 },
  { id: 11, title: 'Партнёрство',                 desc: 'Стратегическое партнёрство. Один из ваших объектов бесплатно улучшен на 1 уровень.', effect: 'free_upgrade', money: 0 },
  { id: 12, title: 'Кадровый кризис',             desc: 'Сотрудники требуют повышения зарплаты. Расходы на персонал +20% на 2 хода.',     effect: 'salary_up',   money: 0 },
  { id: 13, title: 'Техническая инновация',       desc: 'Новое ПО для логистики. Расходы на маршруты снижены на 15% на 3 хода.',           effect: 'discount',    money: 0 },
  { id: 14, title: 'Авария на трассе',            desc: 'ДТП с вашим грузовиком. Потеряйте 35 000 ₽.',                                   effect: 'money',       money: -35000 },
  { id: 15, title: 'Государственный заказ',       desc: 'Госконтракт на перевозки. Получите 60 000 ₽ и +5 репутации.',                    effect: 'gov_order',   money: 60000 },
  { id: 16, title: 'Страховой случай',            desc: 'Страховая компенсация за прошлый ущерб. Получите 15 000 ₽.',                     effect: 'money',       money: 15000 },
  { id: 17, title: 'Забастовка',                  desc: 'Забастовка водителей. Пропустите один ход.',                                    effect: 'skip_turn',   money: 0 },
  { id: 18, title: 'Бонус за эффективность',      desc: 'Премия за эффективную логистику. Получите 25 000 ₽.',                           effect: 'money',       money: 25000 },
  { id: 19, title: 'Повышение спроса',            desc: 'Спрос на перевозки вырос. Дополнительный доход 20 000 ₽.',                      effect: 'money',       money: 20000 },
  { id: 20, title: 'Стихийное бедствие',          desc: 'Наводнение повредило инфраструктуру. Ущерб 40 000 ₽.',                          effect: 'money',       money: -40000 },
  { id: 21, title: 'Новый маршрут',               desc: 'Открыт новый выгодный маршрут. Получите 30 000 ₽.',                             effect: 'money',       money: 30000 },
  { id: 22, title: 'Кража груза',                 desc: 'Груз украден на стоянке. Потеряйте 20 000 ₽.',                                 effect: 'money',       money: -20000 },
];

/* ============================================================
   ORDER DEFINITIONS (20+ orders)
   ============================================================ */
const ORDERS = [
  { id: 1,  route: 'Москва → Санкт-Петербург',      cargo: '5 т',     turns: 2, cost: 60000,  income: 120000,  risk: 15 },
  { id: 2,  route: 'Казань → Екатеринбург',          cargo: '3 т',     turns: 2, cost: 40000,  income: 90000,   risk: 10 },
  { id: 3,  route: 'Новосибирск → Владивосток',      cargo: '8 т',     turns: 3, cost: 120000, income: 220000,  risk: 25 },
  { id: 4,  route: 'Москва → Нижний Новгород',       cargo: '2 т',     turns: 1, cost: 25000,  income: 55000,   risk: 8 },
  { id: 5,  route: 'Санкт-Петербург → Мурманск',     cargo: '4 т',     turns: 2, cost: 50000,  income: 110000,  risk: 18 },
  { id: 6,  route: 'Ростов-на-Дону → Краснодар',     cargo: '3 т',     turns: 1, cost: 30000,  income: 65000,   risk: 10 },
  { id: 7,  route: 'Москва → Екатеринбург',          cargo: '10 т',    turns: 3, cost: 150000, income: 280000,  risk: 30 },
  { id: 8,  route: 'Красноярск → Иркутск',           cargo: '6 т',     turns: 2, cost: 70000,  income: 140000,  risk: 20 },
  { id: 9,  route: 'Самара → Уфа',                 cargo: '2 т',     turns: 1, cost: 20000,  income: 50000,   risk: 8 },
  { id: 10, route: 'Владивосток → Хабаровск',        cargo: '4 т',     turns: 2, cost: 55000,  income: 115000,  risk: 15 },
  { id: 11, route: 'Москва → Казань',                cargo: '5 т',     turns: 2, cost: 55000,  income: 130000,  risk: 12 },
  { id: 12, route: 'Санкт-Петербург → Волгоград',    cargo: '7 т',     turns: 3, cost: 90000,  income: 190000,  risk: 22 },
  { id: 13, route: 'Новосибирск → Омск',             cargo: '3 т',     turns: 1, cost: 35000,  income: 75000,   risk: 10 },
  { id: 14, route: 'Екатеринбург → Челябинск',       cargo: '2 т',     turns: 1, cost: 20000,  income: 45000,   risk: 6 },
  { id: 15, route: 'Москва → Воронеж',               cargo: '4 т',     turns: 2, cost: 45000,  income: 95000,   risk: 12 },
  { id: 16, route: 'Краснодар → Сочи',              cargo: '3 т',     turns: 1, cost: 30000,  income: 70000,   risk: 8 },
  { id: 17, route: 'Санкт-Петербург → Калининград',  cargo: '5 т',     turns: 2, cost: 70000,  income: 150000,  risk: 20 },
  { id: 18, route: 'Москва → Новосибирск',           cargo: '12 т',    turns: 4, cost: 200000, income: 380000,  risk: 35 },
  { id: 19, route: 'Волгоград → Ростов-на-Дону',     cargo: '3 т',     turns: 1, cost: 30000,  income: 60000,   risk: 10 },
  { id: 20, route: 'Москва → Архангельск',           cargo: '6 т',     turns: 3, cost: 85000,  income: 175000,  risk: 22 },
  { id: 21, route: 'Казань → Пермь',                 cargo: '4 т',     turns: 2, cost: 50000,  income: 105000,  risk: 14 },
  { id: 22, route: 'Уфа → Оренбург',                 cargo: '2 т',     turns: 1, cost: 22000,  income: 48000,   risk: 7 },
];

/* ============================================================
   EMPLOYEE DEFINITIONS
   ============================================================ */
const EMPLOYEES = [
  { id: 'logist',     name: 'Логист',                   salary: 15000, desc: '−10% к стоимости маршрутов' },
  { id: 'manager',    name: 'Менеджер по работе с клиентами', salary: 12000, desc: '+10% к доходу от заказов' },
  { id: 'driver',     name: 'Водитель',                 salary: 10000, desc: '+15% к скорости выполнения' },
  { id: 'mechanic',   name: 'Механик',                  salary: 12000, desc: '−30% к стоимости ремонта' },
  { id: 'analyst',    name: 'Аналитик',                 salary: 20000, desc: '−10% к риску' },
];

/* ============================================================
   PLAYER CLASS
   ============================================================ */
class Player {
  constructor(id, name, isAI = false, color = '#4a6fa5') {
    this.id = id;
    this.name = name;
    this.isAI = isAI;
    this.color = color;
    this.money = CONFIG.START_MONEY;
    this.reputation = CONFIG.START_REPUTATION;
    this.position = 0;
    this.properties = []; // owned cell indices
    this.transports = [];
    this.orders = [];
    this.employees = {};
    for (const e of EMPLOYEES) this.employees[e.id] = 0;
    this.loan = null; // { remaining, amount, repay }
    this.completedOrders = 0;
    this.totalIncome = 0;
    this.totalExpenses = 0;
    this.activeEffects = [];
    this.skipTurn = false;
    this.bankrupt = false;
  }

  get assetValue() {
    let val = this.money;
    for (const ci of this.properties) {
      const cell = CELLS[ci];
      val += cell.pCost || 0;
      // rough estimate for level
    }
    for (const ti of this.transports) {
      const cell = CELLS[ti];
      val += cell.tCost || 0;
    }
    if (this.loan) val -= (this.loan.repay || this.loan.amount);
    return val;
  }

  get totalEmployees() {
    return Object.values(this.employees).reduce((a, b) => a + b, 0);
  }

  get riskModifier() {
    let mod = 0;
    if (this.employees.analyst > 0) mod -= this.employees.analyst * 10;
    return mod;
  }

  get routeCostModifier() {
    let mod = 0;
    if (this.employees.logist > 0) mod -= this.employees.logist * 10;
    // check active effects
    const fuelEffect = this.activeEffects.find(e => e.type === 'fuel');
    if (fuelEffect) mod += 20;
    const discountEffect = this.activeEffects.find(e => e.type === 'discount');
    if (discountEffect) mod -= 15;
    return mod;
  }

  get orderIncomeModifier() {
    let mod = 0;
    if (this.employees.manager > 0) mod += this.employees.manager * 10;
    return mod;
  }

  get salaryCost() {
    let total = 0;
    for (const e of EMPLOYEES) {
      total += e.salary * (this.employees[e.id] || 0);
    }
    const salaryUp = this.activeEffects.find(ef => ef.type === 'salary_up');
    if (salaryUp) total *= 1.2;
    return Math.round(total);
  }
}

/* ============================================================
   GAME STATE
   ============================================================ */
const GameState = {
  players: [],
  currentPlayerIndex: 0,
  round: 1,
  maxRounds: CONFIG.MAX_ROUNDS,
  started: false,
  gameOver: false,
  phase: 'roll', // 'roll' | 'move' | 'action' | 'end'
  diceResult: null,
  cellOwners: new Array(CONFIG.TOTAL_CELLS).fill(-1),
  cellLevels: new Array(CONFIG.TOTAL_CELLS).fill(1),
  usedOrders: [],
  activeEvents: [],
  turnOrder: [], // player id order
  waitingForAction: false,
  pendingOrder: null,

  reset() {
    this.players = [];
    this.currentPlayerIndex = 0;
    this.round = 1;
    this.started = false;
    this.gameOver = false;
    this.phase = 'roll';
    this.diceResult = null;
    this.cellOwners = new Array(CONFIG.TOTAL_CELLS).fill(-1);
    this.cellLevels = new Array(CONFIG.TOTAL_CELLS).fill(1);
    this.usedOrders = [];
    this.activeEvents = [];
    this.waitingForAction = false;
  },

  get currentPlayer() { return this.players[this.currentPlayerIndex]; },
  get isCurrentAI() { return this.currentPlayer && this.currentPlayer.isAI; },

  nextPlayer() {
    this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.players.length;
    if (this.currentPlayerIndex === 0) {
      this.round++;
      if (this.round > this.maxRounds) {
        this.gameOver = true;
        UI.showGameOver();
        return;
      }
      // Process round effects
      this.processRoundEffects();
    }
    this.phase = 'roll';
    this.waitingForAction = false;
    UI.updateUI();
  },

  processRoundEffects() {
    // Apply salaries, property income, loan payments
    for (const p of this.players) {
      if (p.bankrupt) continue;
      // Salary expenses
      const salary = p.salaryCost;
      if (salary > 0) {
        p.money -= salary;
        p.totalExpenses += salary;
        if (p.money < 0) p.money = 0;
      }
      // Property income
      let propIncome = 0;
      for (const ci of p.properties) {
        const cell = CELLS[ci];
        const level = this.cellLevels[ci];
        const baseIncome = cell.pIncome || 0;
        const levelBonus = (level - 1) * (baseIncome * 0.5);
        propIncome += baseIncome + levelBonus;
      }
      // Transport income
      for (const ci of p.transports) {
        const cell = CELLS[ci];
        propIncome += cell.tIncome || 0;
      }
      if (propIncome > 0) {
        p.money += propIncome;
        p.totalIncome += propIncome;
      }
      // Loan payment
      if (p.loan) {
        p.loan.remaining--;
        if (p.loan.remaining <= 0) {
          const repay = p.loan.repay || CONFIG.CREDIT_REPAY;
          p.money -= repay;
          p.totalExpenses += repay;
          p.loan = null;
          UI.notify(p.name + ' погасил(а) кредит.', 'expense');
        }
      }
      // Process active order deadlines
      for (let oi = p.orders.length - 1; oi >= 0; oi--) {
        const order = p.orders[oi];
        order.remainingTurns--;
        if (order.remainingTurns <= 0) {
          // Check if succeeded or failed
          if (!order.failed) {
            // Risk check
            const riskRoll = Util.rand(1, 100);
            const finalRisk = order.risk + p.riskModifier;
            if (riskRoll <= finalRisk) {
              // Failed
              order.failed = true;
              p.reputation = Util.clamp(p.reputation - 10, 0, CONFIG.MAX_REPUTATION);
              p.money -= 40000;
              p.totalExpenses += 40000;
              UI.notify('Заказ ' + order.id + ' провален! −40 000 ₽, −10 репутации', 'expense');
            } else {
              // Success
              let income = order.income;
              const bonus = p.orderIncomeModifier;
              if (bonus > 0) income = Math.round(income * (1 + bonus / 100));
              p.money += income;
              p.totalIncome += income;
              p.reputation = Util.clamp(p.reputation + 5, 0, CONFIG.MAX_REPUTATION);
              p.completedOrders++;
              UI.notify('Заказ ' + order.id + ' выполнен! +' + Util.formatMoney(income), 'income');
            }
          }
          p.orders.splice(oi, 1);
        }
      }
      // Clean up expired effects
      for (let ei = p.activeEffects.length - 1; ei >= 0; ei--) {
        p.activeEffects[ei].remaining--;
        if (p.activeEffects[ei].remaining <= 0) {
          p.activeEffects.splice(ei, 1);
        }
      }
      // Bankruptcy check
      if (p.money <= 0 && p.orders.length === 0 && p.properties.length === 0) {
        p.bankrupt = true;
        UI.notify(p.name + ' обанкротился!', 'expense');
      }
    }
    UI.updateUI();
  },

  getAvailableOrder() {
    const used = this.usedOrders;
    const available = ORDERS.filter(o => !used.includes(o.id));
    if (available.length === 0) {
      this.usedOrders = [];
      return ORDERS[Util.rand(0, ORDERS.length - 1)];
    }
    const order = available[Util.rand(0, available.length - 1)];
    this.usedOrders.push(order.id);
    return { ...order, remainingTurns: order.turns };
  },

  getRandomEvent() {
    return Util.pick(EVENTS);
  },
};

/* ============================================================
   AI MODULE
   ============================================================ */
const AI = {
  decidePurchase(player, cell) {
    if (player.money < cell.pCost * 0.7) return false;
    // AI buys if money > cost + 50000 and risk is acceptable
    const risk = player.reputation < 30 ? 0.4 : 0.7;
    return player.money > cell.pCost + 50000 && Math.random() < risk;
  },

  decideUpgrade(player, cellIdx) {
    const cell = CELLS[cellIdx];
    const level = GameState.cellLevels[cellIdx];
    if (level >= 3) return false;
    const cost = cell.pUpgradeCost * level;
    if (player.money < cost + 30000) return false;
    const income = cell.pIncome || 0;
    const roi = income * 0.5 / cost;
    return roi > 0.0001 && Math.random() < 0.5;
  },

  decideOrder(player, order) {
    if (order.risk > 40 && player.reputation < 30) return false;
    if (player.money < order.cost * 0.5) return false;
    const profitRatio = (order.income - order.cost) / order.cost;
    const riskAccept = Math.max(0.3, 1 - order.risk / 100);
    return profitRatio > 0.5 && Math.random() < riskAccept;
  },

  decideEmployee(player) {
    if (player.money < 50000) return null;
    const needed = EMPLOYEES.filter(e => (player.employees[e.id] || 0) < 3);
    if (needed.length === 0) return null;
    return Util.pick(needed);
  },

  decideLoan(player) {
    if (player.loan) return false;
    if (player.money > 80000) return false;
    return player.money < 50000 && Math.random() < 0.6;
  },

  takeTurn() {
    const player = GameState.currentPlayer;
    if (!player || !player.isAI) return;

    // Roll dice
    Game.rollDice();
    // The move and action will be processed after the roll
  },

  processAIAction(cell) {
    const player = GameState.currentPlayer;
    if (!player || !player.isAI) return;

    const cellIdx = player.position;

    if (cell.type === 'property' && GameState.cellOwners[cellIdx] === -1) {
      if (AI.decidePurchase(player, cell)) {
        Game.buyProperty();
      } else {
        Game.declineProperty();
      }
    } else if (cell.type === 'property' && GameState.cellOwners[cellIdx] === player.id) {
      if (AI.decideUpgrade(player, cellIdx)) {
        Game.upgradeProperty();
      }
      Game.endTurn();
    } else if (cell.type === 'order' || cell.type === 'contract') {
      const order = GameState.getAvailableOrder();
      GameState.pendingOrder = order;
      if (AI.decideOrder(player, order)) {
        Game.acceptOrder();
      } else {
        Game.declineOrder();
      }
      Game.endTurn();
    } else if (cell.type === 'transport' && GameState.cellOwners[cellIdx] === -1) {
      if (player.money > cell.tCost + 50000 && Math.random() < 0.6) {
        Game.buyTransport();
      }
      Game.endTurn();
    } else if (cell.type === 'event' || cell.type === 'risk' || cell.type === 'market' || cell.type === 'crisis') {
      const evt = GameState.getRandomEvent();
      Game.processEvent(evt);
    } else if (cell.type === 'special' || cell.type === 'start') {
      // Auto-process
    }

    // Employee decision
    const emp = AI.decideEmployee(player);
    if (emp) {
      Game.hireEmployee(emp.id);
    }

    // Loan decision
    if (AI.decideLoan(player)) {
      Game.takeLoan();
    }

    // End turn
    setTimeout(() => Game.endTurn(), 1500);
  }
};

/* ============================================================
   GAME ENGINE
   ============================================================ */
const Game = {
  init(playerNames, isPVE = false) {
    GameState.reset();
    const colors = ['#4a6fa5', '#b86a4a', '#3a7a4a', '#b8984a'];
    const defaultNames = ['Игрок 1', 'Игрок 2', 'Игрок 3', 'Игрок 4'];
    const names = playerNames.length ? playerNames : defaultNames.slice(0, playerNames.length || 2);

    for (let i = 0; i < names.length; i++) {
      const isAI = isPVE && i > 0;
      GameState.players.push(new Player(i, names[i], isAI, colors[i]));
    }

    GameState.started = true;
    GameState.round = 1;
    GameState.currentPlayerIndex = 0;
    GameState.phase = 'roll';
    UI.switchScreen('game-screen');
    Board.render();
    UI.updateUI();
    UI.notify('Игра началась! Ходит ' + GameState.currentPlayer.name, 'info');
  },

  rollDice() {
    if (GameState.phase !== 'roll') return;
    const player = GameState.currentPlayer;
    if (player.bankrupt) {
      Game.endTurn();
      return;
    }
    if (player.skipTurn) {
      player.skipTurn = false;
      UI.notify(player.name + ' пропускает ход.', 'info');
      GameState.phase = 'end';
      document.getElementById('btn-end-turn').style.display = 'block';
      if (GameState.isCurrentAI) setTimeout(() => Game.endTurn(), 200);
      return;
    }

    const result = Util.rollTwo();
    GameState.diceResult = result;
    GameState.phase = 'moving';

    // Show dice animation
    const d1El = document.getElementById('dice-1');
    const d2El = document.getElementById('dice-2');
    const totalEl = document.getElementById('dice-total');

    d1El.classList.add('rolling');
    d2El.classList.add('rolling');

    const diceSymbols = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

    setTimeout(() => {
      d1El.classList.remove('rolling');
      d2El.classList.remove('rolling');
      d1El.textContent = diceSymbols[result.d1 - 1];
      d2El.textContent = diceSymbols[result.d2 - 1];
      totalEl.textContent = result.total;

      document.getElementById('move-message').textContent = 'Перемещение...';
      document.getElementById('move-message').classList.add('highlight');
      document.getElementById('btn-roll').style.display = 'none';

      // Move the token
      Game.movePlayer(result.total);
    }, 600);
  },

  movePlayer(steps) {
    const player = GameState.currentPlayer;
    const oldPos = player.position;
    const newPos = (oldPos + steps) % CONFIG.TOTAL_CELLS;

    // Check if passed START
    if (newPos < oldPos || (oldPos + steps >= CONFIG.TOTAL_CELLS)) {
      player.money += CONFIG.PASS_START_BONUS;
      player.totalIncome += CONFIG.PASS_START_BONUS;
      UI.notify('Проход через СТАРТ! +' + Util.formatMoney(CONFIG.PASS_START_BONUS), 'income');
    }

    player.position = newPos;

    // Animate
    Board.animateToken(oldPos, newPos, () => {
      const cell = CELLS[newPos];
      document.getElementById('move-message').textContent = 'Вы на клетке: «' + cell.label + '»';
      GameState.phase = 'action';
      Board.render();

      setTimeout(() => Game.processCell(newPos), 400);
    });
  },

  processCell(cellIdx) {
    const cell = CELLS[cellIdx];
    const player = GameState.currentPlayer;

    if (cell.type === 'start') {
      GameState.phase = 'end';
      document.getElementById('btn-end-turn').style.display = 'block';
      if (GameState.isCurrentAI) setTimeout(() => Game.endTurn(), 600);
      return;
    }

    if (cell.type === 'property') {
      const owner = GameState.cellOwners[cellIdx];
      if (owner === -1) {
        // Free property
        if (GameState.isCurrentAI) {
          if (AI.decidePurchase(player, cell)) {
            Game.buyProperty();
            if (GameState.cellLevels[cellIdx] < 3 && AI.decideUpgrade(player, cellIdx)) {
              Game.upgradeProperty();
            }
          } else {
            Game.declineProperty();
          }
          if (!GameState.isCurrentAI) return;
          GameState.phase = 'end';
          document.getElementById('btn-end-turn').style.display = 'block';
          setTimeout(() => Game.endTurn(), 600);
          return;
        }
        UI.showPropertyCard(cell, cellIdx);
      } else if (owner === player.id) {
        if (GameState.cellLevels[cellIdx] < 3) {
          if (GameState.isCurrentAI) {
            if (AI.decideUpgrade(player, cellIdx)) {
              Game.upgradeProperty();
            }
            GameState.phase = 'end';
            document.getElementById('btn-end-turn').style.display = 'block';
            setTimeout(() => Game.endTurn(), 600);
            return;
          }
          UI.showUpgradeCard(cell, cellIdx);
        } else {
          UI.notify('Объект «' + cell.label + '» уже максимального уровня.', 'info');
          GameState.phase = 'end';
          document.getElementById('btn-end-turn').style.display = 'block';
          if (GameState.isCurrentAI) setTimeout(() => Game.endTurn(), 600);
        }
      } else {
        // Pay owner
        this.payRent(player, cell, cellIdx, owner);
      }
      return;
    }

    if (cell.type === 'transport') {
      const owner = GameState.cellOwners[cellIdx];
      if (owner === -1) {
        if (GameState.isCurrentAI) {
          if (player.money > cell.tCost + 50000 && Math.random() < 0.6) {
            Game.buyTransport();
          }
          GameState.phase = 'end';
          document.getElementById('btn-end-turn').style.display = 'block';
          setTimeout(() => Game.endTurn(), 600);
          return;
        }
        UI.showTransportCard(cell, cellIdx);
      } else if (owner !== player.id) {
        this.payRent(player, cell, cellIdx, owner);
      } else {
        GameState.phase = 'end';
        document.getElementById('btn-end-turn').style.display = 'block';
        if (GameState.isCurrentAI) setTimeout(() => Game.endTurn(), 600);
      }
      return;
    }

    if (cell.type === 'order' || cell.type === 'contract') {
      const order = GameState.getAvailableOrder();
      GameState.pendingOrder = order;
      if (GameState.isCurrentAI) {
        if (AI.decideOrder(player, order)) {
          Game.acceptOrder();
        } else {
          Game.declineOrder();
        }
        GameState.phase = 'end';
        document.getElementById('btn-end-turn').style.display = 'block';
        setTimeout(() => Game.endTurn(), 600);
        return;
      }
      UI.showOrderCard(order);
      return;
    }

    if (cell.type === 'event' || cell.type === 'risk' || cell.type === 'market') {
      const evt = GameState.getRandomEvent();
      if (GameState.isCurrentAI) {
        Game.processEvent(evt);
        GameState.phase = 'end';
        document.getElementById('btn-end-turn').style.display = 'block';
        setTimeout(() => Game.endTurn(), 600);
        return;
      }
      UI.showEventCard(evt);
      return;
    }

    if (cell.type === 'crisis') {
      const evt = Util.pick(EVENTS.filter(e => e.money < 0));
      if (GameState.isCurrentAI) {
        Game.processEvent(evt);
        GameState.phase = 'end';
        document.getElementById('btn-end-turn').style.display = 'block';
        setTimeout(() => Game.endTurn(), 600);
        return;
      }
      UI.showEventCard(evt);
      return;
    }

    if (cell.type === 'special') {
      this.processSpecialCell(cell, player);
      return;
    }

    // Default
    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
    UI.updateUI();
    if (GameState.isCurrentAI) setTimeout(() => Game.endTurn(), 600);
  },

  payRent(player, cell, cellIdx, owner) {
    const ownerPlayer = GameState.players[owner];
    let rent;
    if (cell.type === 'property') {
      const level = GameState.cellLevels[cellIdx];
      const baseIncome = cell.pIncome || 0;
      const levelBonus = (level - 1) * (baseIncome * 0.5);
      rent = Math.round((baseIncome + levelBonus) * 0.6);
    } else {
      rent = Math.round((cell.tIncome || 0) * 0.5);
    }
    player.money -= rent;
    player.totalExpenses += rent;
    ownerPlayer.money += rent;
    ownerPlayer.totalIncome += rent;
    UI.notify('Вы заплатили ' + Util.formatMoney(rent) + ' владельцу «' + cell.label + '»', 'expense');
    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
    UI.updateUI();
    if (GameState.isCurrentAI) setTimeout(() => Game.endTurn(), 600);
  },

  processSpecialCell(cell, player) {
    if (cell.id === 9 || cell.id === 29 || cell.id === 39) {
      player.money += 10000;
      player.totalIncome += 10000;
      UI.notify('Штаб-квартира: +10 000 ₽', 'income');
    } else if (cell.id === 19) {
      UI.showFreeRouteCard();
      return;
    } else if (cell.id === 20) {
      // Crisis - handled earlier in processCell
    }
    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
    UI.updateUI();
    if (GameState.isCurrentAI) setTimeout(() => Game.endTurn(), 600);
  },

  buyProperty() {
    const player = GameState.currentPlayer;
    const cellIdx = player.position;
    const cell = CELLS[cellIdx];
    const cost = cell.pCost;

    if (player.money < cost) {
      UI.notify('Недостаточно средств!', 'expense');
      return;
    }

    player.money -= cost;
    player.totalExpenses += cost;
    GameState.cellOwners[cellIdx] = player.id;
    GameState.cellLevels[cellIdx] = 1;
    UI.closeModal();
    Board.render();
    UI.updateUI();
    UI.notify('Куплен «' + cell.label + '» за ' + Util.formatMoney(cost), 'income');

    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
  },

  declineProperty() {
    UI.closeModal();
    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
    UI.updateUI();
  },

  buyTransport() {
    const player = GameState.currentPlayer;
    const cellIdx = player.position;
    const cell = CELLS[cellIdx];
    const cost = cell.tCost;

    if (player.money < cost) {
      UI.notify('Недостаточно средств!', 'expense');
      return;
    }

    player.money -= cost;
    player.totalExpenses += cost;
    GameState.cellOwners[cellIdx] = player.id;
    player.transports.push(cellIdx);
    UI.closeModal();
    Board.render();
    UI.updateUI();
    UI.notify('Куплен транспорт «' + cell.label + '» за ' + Util.formatMoney(cost), 'income');

    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
  },

  upgradeProperty() {
    const player = GameState.currentPlayer;
    const cellIdx = player.position;
    const cell = CELLS[cellIdx];
    const level = GameState.cellLevels[cellIdx];
    if (level >= 3) return;

    const cost = Math.round(cell.pUpgradeCost * level);
    if (player.money < cost) {
      UI.notify('Недостаточно средств для улучшения!', 'expense');
      return;
    }

    player.money -= cost;
    player.totalExpenses += cost;
    GameState.cellLevels[cellIdx] = level + 1;
    UI.closeModal();
    Board.render();
    UI.updateUI();
    UI.notify('«' + cell.pName + '» улучшен до уровня ' + (level + 1) + '!', 'income');

    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
  },

  acceptOrder() {
    const order = GameState.pendingOrder;
    if (!order) return;
    const player = GameState.currentPlayer;
    if (player.money < order.cost) {
      UI.notify('Недостаточно средств для выполнения заказа!', 'expense');
      return;
    }

    player.money -= order.cost;
    player.totalExpenses += order.cost;
    player.orders.push({ ...order, remainingTurns: order.turns, failed: false, accepted: true });
    UI.closeModal();
    UI.updateUI();
    UI.notify('Принят заказ №' + order.id + ': ' + order.route, 'info');

    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
  },

  declineOrder() {
    const player = GameState.currentPlayer;
    player.reputation = Util.clamp(player.reputation - 5, 0, CONFIG.MAX_REPUTATION);
    UI.closeModal();
    UI.updateUI();
    UI.notify('Заказ отклонён. −5 репутации', 'reputation');

    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
  },

  processEvent(evt) {
    const player = GameState.currentPlayer;
    UI.closeModal();

    switch (evt.effect) {
      case 'money':
        if (evt.money > 0) {
          player.money += evt.money;
          player.totalIncome += evt.money;
          UI.notify('Событие: ' + evt.title + ' +' + Util.formatMoney(evt.money), 'income');
        } else {
          player.money += evt.money; // negative
          player.totalExpenses += Math.abs(evt.money);
          UI.notify('Событие: ' + evt.title + ' ' + Util.formatMoney(evt.money), 'expense');
        }
        break;
      case 'fuel':
        player.activeEffects.push({ type: 'fuel', remaining: 3 });
        UI.notify('Событие: ' + evt.title + ' (3 хода)', 'info');
        break;
      case 'discount':
        player.activeEffects.push({ type: 'discount', remaining: 3 });
        UI.notify('Событие: ' + evt.title + ' (3 хода)', 'info');
        break;
      case 'salary_up':
        player.activeEffects.push({ type: 'salary_up', remaining: 2 });
        UI.notify('Событие: ' + evt.title, 'expense');
        break;
      case 'skip_turn':
        player.skipTurn = true;
        UI.notify('Событие: ' + evt.title, 'expense');
        break;
      case 'free_upgrade':
        const ownedProps = player.properties;
        if (ownedProps.length > 0) {
          const upgradeable = ownedProps.filter(ci => GameState.cellLevels[ci] < 3);
          if (upgradeable.length > 0) {
            const chosen = Util.pick(upgradeable);
            GameState.cellLevels[chosen]++;
            UI.notify('Событие: Объект «' + CELLS[chosen].label + '» улучшен бесплатно!', 'income');
            Board.render();
          }
        }
        break;
      case 'bonus_order':
        const bonusOrder = GameState.getAvailableOrder();
        bonusOrder.income = Math.round(bonusOrder.income * 1.2);
        if (GameState.isCurrentAI) {
          if (AI.decideOrder(player, bonusOrder)) {
            GameState.pendingOrder = bonusOrder;
            Game.acceptOrder();
          }
          break;
        }
        UI.showOrderCard(bonusOrder);
        return; // Don't auto-end
      case 'gov_order':
        player.money += evt.money;
        player.totalIncome += evt.money;
        player.reputation = Util.clamp(player.reputation + 5, 0, CONFIG.MAX_REPUTATION);
        UI.notify('Событие: ' + evt.title + ' +' + Util.formatMoney(evt.money) + ', +5 репутации', 'income');
        break;
      case 'choice':
        if (GameState.isCurrentAI) {
          if (player.money > 100000) {
            player.money += evt.money;
            player.totalExpenses += Math.abs(evt.money);
          } else {
            player.skipTurn = true;
          }
          break;
        }
        UI.showChoiceEvent(evt);
        return;
      case 'delay_road':
        UI.notify('Событие: ' + evt.title, 'info');
        break;
      default:
        break;
    }

    UI.updateUI();
    Board.render();

    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
  },

  processEventChoice(evt, choice) {
    const player = GameState.currentPlayer;
    UI.closeModal();

    if (choice === 'pay') {
      player.money += evt.money; // negative
      player.totalExpenses += Math.abs(evt.money);
      UI.notify('Вы заплатили ' + Util.formatMoney(evt.money), 'expense');
    } else {
      player.skipTurn = true;
      UI.notify('Вы решили пропустить ход.', 'info');
    }

    UI.updateUI();
    GameState.phase = 'end';
    document.getElementById('btn-end-turn').style.display = 'block';
  },

  endTurn() {
    if (GameState.currentPlayer.skipTurn) {
      GameState.currentPlayer.skipTurn = false;
      UI.notify(GameState.currentPlayer.name + ' пропускает ход.', 'info');
    }

    document.getElementById('btn-end-turn').style.display = 'none';
    document.getElementById('btn-roll').style.display = 'block';
    document.getElementById('dice-1').textContent = '⚀';
    document.getElementById('dice-2').textContent = '⚀';
    document.getElementById('dice-total').textContent = '0';
    document.getElementById('move-message').textContent = '';
    document.getElementById('move-message').classList.remove('highlight');

    if (GameState.gameOver) return;

    GameState.nextPlayer();

    if (GameState.gameOver) return;

    // Auto-play AI
    if (GameState.isCurrentAI) {
      setTimeout(() => AI.takeTurn(), 800);
    }
  },

  hireEmployee(empId) {
    const player = GameState.currentPlayer;
    const emp = EMPLOYEES.find(e => e.id === empId);
    if (!emp) return;
    if (player.employees[empId] >= 3) {
      UI.notify('Максимум 3 сотрудника этого типа.', 'info');
      return;
    }
    // First hire is free, subsequent cost increases
    const count = player.employees[empId];
    const cost = count * 15000;
    if (player.money < cost) {
      UI.notify('Недостаточно средств для найма!', 'expense');
      return;
    }
    player.money -= cost;
    player.totalExpenses += cost;
    player.employees[empId]++;
    UI.closeModal();
    UI.updateUI();
    UI.notify('Нанят ' + emp.name + '!', 'info');
  },

  takeLoan() {
    const player = GameState.currentPlayer;
    if (player.loan) {
      UI.notify('У вас уже есть активный кредит.', 'info');
      return;
    }
    player.money += CONFIG.CREDIT_AMOUNT;
    player.totalIncome += CONFIG.CREDIT_AMOUNT;
    player.loan = { remaining: CONFIG.CREDIT_TERM, amount: CONFIG.CREDIT_AMOUNT, repay: CONFIG.CREDIT_REPAY };
    UI.closeModal();
    UI.updateUI();
    UI.notify('Кредит получен: +' + Util.formatMoney(CONFIG.CREDIT_AMOUNT), 'income');
  },

  saveGame() {
    const data = {
      players: GameState.players.map(p => ({
        id: p.id, name: p.name, isAI: p.isAI, color: p.color,
        money: p.money, reputation: p.reputation, position: p.position,
        properties: p.properties, transports: p.transports,
        orders: p.orders, employees: p.employees,
        loan: p.loan, completedOrders: p.completedOrders,
        totalIncome: p.totalIncome, totalExpenses: p.totalExpenses,
        activeEffects: p.activeEffects, skipTurn: p.skipTurn, bankrupt: p.bankrupt
      })),
      currentPlayerIndex: GameState.currentPlayerIndex,
      round: GameState.round,
      cellOwners: GameState.cellOwners,
      cellLevels: GameState.cellLevels,
      usedOrders: GameState.usedOrders,
      phase: 'roll',
    };
    try {
      localStorage.setItem('logisticsSave', JSON.stringify(data));
      UI.notify('Игра сохранена!', 'info');
    } catch (e) {
      UI.notify('Ошибка сохранения!', 'expense');
    }
  },

  loadGame() {
    const raw = localStorage.getItem('logisticsSave');
    if (!raw) {
      UI.notify('Сохранение не найдено.', 'expense');
      return;
    }
    try {
      const data = JSON.parse(raw);
      GameState.reset();
      UI.closeModal();
      GameState.players = data.players.map(p => {
        const np = new Player(p.id, p.name, p.isAI, p.color);
        Object.assign(np, p);
        return np;
      });
      GameState.currentPlayerIndex = data.currentPlayerIndex;
      GameState.round = data.round;
      GameState.cellOwners = data.cellOwners;
      GameState.cellLevels = data.cellLevels;
      GameState.usedOrders = data.usedOrders || [];
      GameState.phase = data.phase || 'roll';
      GameState.started = true;
      UI.switchScreen('game-screen');
      Board.render();
      UI.updateUI();
      UI.notify('Игра загружена! Ходит ' + GameState.currentPlayer.name, 'info');

      if (GameState.isCurrentAI) {
        setTimeout(() => AI.takeTurn(), 800);
      }
    } catch (e) {
      UI.notify('Ошибка загрузки сохранения.', 'expense');
    }
  },

  calculateWinner() {
    const scores = GameState.players.map(p => {
      let score = p.money * 0.4;
      score += p.assetValue * 0.3;
      score += p.reputation * 200;
      score += p.completedOrders * 500;
      score += p.properties.length * 200;
      score += p.transports.length * 150;
      if (p.loan) score -= p.loan.repay * 0.5;
      if (p.bankrupt) score = 0;
      return { player: p, score: Math.max(0, Math.round(score)) };
    });
    scores.sort((a, b) => b.score - a.score);
    return scores;
  }
};

/* ============================================================
   BOARD RENDERER
   ============================================================ */
const Board = {
  render() {
    const board = document.getElementById('board');
    if (!board) return;

    // Clear existing cells
    board.innerHTML = '';

    // Create grid cells for the full 11x11 grid
    for (let r = 0; r < 11; r++) {
      for (let c = 0; c < 11; c++) {
        const isPerimeter = r === 0 || r === 10 || c === 0 || c === 10;
        if (!isPerimeter) continue;

        const div = document.createElement('div');
        div.className = 'cell';
        div.style.gridColumn = (c + 1).toString();
        div.style.gridRow = (r + 1).toString();

        // Find the cell at this position
        const cellIdx = CELLS.findIndex(cell => cell.pos && cell.pos.row === r && cell.pos.col === c);
        if (cellIdx === -1) continue;

        const cell = CELLS[cellIdx];
        div.dataset.index = cellIdx;

        // Cell type class
        if (cell.type === 'start') div.classList.add('cell-start', 'isStart');
        if (cell.type === 'property') div.classList.add('cell-property', 'cell-group-' + (cell.pColor || 'green'));
        if (cell.type === 'transport') div.classList.add('cell-transport', 'cell-group-blue');
        if (cell.type === 'event' || cell.type === 'market') div.classList.add('cell-event');
        if (cell.type === 'order' || cell.type === 'contract') div.classList.add('cell-order');
        if (cell.type === 'risk') div.classList.add('cell-risk');
        if (cell.type === 'crisis') div.classList.add('cell-risk');
        if (cell.type === 'special') div.classList.add('cell-special');

        // Corner styling
        if ((r === 0 || r === 10) && (c === 0 || c === 10)) div.classList.add('cell-corner');

        // Side borders
        if (r === 0) div.classList.add('cell-side-top');
        if (r === 10) div.classList.add('cell-side-bottom');
        if (c === 0) div.classList.add('cell-side-left');
        if (c === 10) div.classList.add('cell-side-right');

        // Icon
        const iconSpan = document.createElement('span');
        iconSpan.className = 'cell-icon';
        iconSpan.textContent = cell.icon || '•';
        div.appendChild(iconSpan);

        // Label
        const labelSpan = document.createElement('span');
        labelSpan.className = 'cell-label';
        labelSpan.textContent = cell.label || '';
        div.appendChild(labelSpan);

        // Cost
        if (cell.type === 'property') {
          const costSpan = document.createElement('span');
          costSpan.className = 'cell-cost';
          costSpan.textContent = Util.formatNum(cell.pCost);
          div.appendChild(costSpan);
        } else if (cell.type === 'transport') {
          const costSpan = document.createElement('span');
          costSpan.className = 'cell-cost';
          costSpan.textContent = Util.formatNum(cell.tCost);
          div.appendChild(costSpan);
        }

        // Owner indicator
        const owner = GameState.cellOwners[cellIdx];
        if (owner >= 0 && GameState.players[owner]) {
          const ownerDiv = document.createElement('div');
          ownerDiv.className = 'owner-indicator';
          ownerDiv.style.background = GameState.players[owner].color;
          div.appendChild(ownerDiv);
        }

        // Player tokens
        const tokensDiv = document.createElement('div');
        tokensDiv.className = 'cell-tokens';
        for (const p of GameState.players) {
          if (p.position === cellIdx && !p.bankrupt) {
            const token = document.createElement('div');
            token.className = 'cell-token';
            token.style.background = p.color;
            tokensDiv.appendChild(token);
          }
        }
        if (tokensDiv.children.length > 0) {
          div.appendChild(tokensDiv);
        }

        board.appendChild(div);
      }
    }

    // Add center area
    const center = document.createElement('div');
    center.className = 'board-center';
    center.innerHTML = `
      <div class="board-center-inner">
        <div class="board-center-title">ЛОГИСТИКА</div>
        <div class="board-center-subtitle">УПРАВЛЕНЧЕСКАЯ ИГРА</div>
        <div class="board-center-tagline">ПЛАНИРУЙ. УПРАВЛЯЙ. ДОСТАВЛЯЙ.</div>
      </div>
    `;
    // Position center to cover inner 9x9 area
    center.style.gridColumn = '2 / 11';
    center.style.gridRow = '2 / 11';
    board.appendChild(center);
  },

  animateToken(fromIdx, toIdx, callback) {
    // Visual animation - we re-render with a slight delay for the visual hop
    // Render initial state
    Board.render();

    // Add a brief highlight to destination cell
    const cells = document.querySelectorAll('.cell');
    cells.forEach(el => {
      if (parseInt(el.dataset.index) === toIdx) {
        el.style.transition = 'background 0.3s';
        el.style.background = '#e8e0d4';
        setTimeout(() => {
          el.style.background = '';
          if (callback) callback();
        }, 500);
      }
    });
  }
};

/* ============================================================
   UI MODULE
   ============================================================ */
const UI = {
  currentModal: null,

  switchScreen(id) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
  },

  showMenu() {
    UI.closeModal();
    document.getElementById('game-over-modal').classList.remove('active');
    UI.switchScreen('main-menu');
  },

  showSetup() {
    const saved = localStorage.getItem('logisticsSave');
    document.getElementById('setup-screen').querySelector('.setup-content').classList.remove('has-save');
    UI.switchScreen('setup-screen');
    UI.selectPlayerCount(2);
    UI.selectMode('pvp');
  },

  selectPlayerCount(count) {
    document.querySelectorAll('.player-count-selector .btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.player-count-selector .btn[data-count="${count}"]`).classList.add('active');

    const container = document.querySelector('.name-inputs');
    container.innerHTML = '';
    const defaultNames = ['Родион', 'Алиса', 'Максим', 'Елена'];
    for (let i = 0; i < count; i++) {
      const row = document.createElement('div');
      row.className = 'name-input-row';
      row.innerHTML = `<label>Игрок ${i + 1}</label><input type="text" maxlength="12" value="${defaultNames[i] || 'Игрок ' + (i + 1)}">`;
      container.appendChild(row);
    }
    UI._selectedCount = count;
  },

  selectMode(mode) {
    document.querySelectorAll('.mode-selector .btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.mode-selector .btn[data-mode="${mode}"]`).classList.add('active');
    UI._selectedMode = mode;
  },

  startGame() {
    const count = UI._selectedCount || 2;
    const isPVE = UI._selectedMode === 'pve';
    const inputs = document.querySelectorAll('.name-inputs input');
    const names = [];
    inputs.forEach(input => names.push(input.value.trim() || 'Игрок'));
    if (isPVE) {
      const aiNames = ['Компьютер 1', 'Компьютер 2', 'Компьютер 3'];
      for (let i = 1; i < names.length; i++) {
        names[i] = aiNames[i - 1] || 'Компьютер ' + i;
      }
    }
    Game.init(names, isPVE);
  },

  updateUI() {
    const p = GameState.currentPlayer;
    if (!p) return;

    document.getElementById('current-player-name').textContent = p.name;
    document.getElementById('current-player-name').style.color = p.color;

    document.getElementById('stat-money').textContent = Util.formatMoney(p.money);
    document.getElementById('stat-reputation').textContent = p.reputation;
    document.getElementById('stat-orders').textContent = p.orders.length;
    document.getElementById('stat-employees').textContent = p.totalEmployees;
    document.getElementById('stat-properties').textContent = p.properties.length + p.transports.length;
    document.getElementById('stat-risk').textContent = p.riskModifier + '%';
    document.getElementById('stat-debt').textContent = p.loan ? Util.formatMoney(p.loan.repay) : '0 ₽';

    document.getElementById('round-display').textContent = GameState.round + ' / ' + GameState.maxRounds;

    // Update other players
    const list = document.getElementById('other-players-list');
    list.innerHTML = '';
    for (const op of GameState.players) {
      if (op.id === p.id) continue;
      const row = document.createElement('div');
      row.className = 'other-player-row';
      const status = op.bankrupt ? ' (БАНКРОТ)' : '';
      row.innerHTML = `
        <div class="other-player-color" style="background:${op.color}"></div>
        <div class="other-player-name">${op.name}${status}</div>
        <div class="other-player-money">${Util.formatMoney(op.money)}</div>
      `;
      list.appendChild(row);
    }

    // Show/hide roll button
    const rollBtn = document.getElementById('btn-roll');
    const endBtn = document.getElementById('btn-end-turn');
    if (GameState.phase === 'roll') {
      rollBtn.style.display = 'block';
      endBtn.style.display = 'none';
    } else if (GameState.phase === 'end') {
      rollBtn.style.display = 'none';
      endBtn.style.display = 'block';
    }
  },

  showModal(html) {
    const overlay = document.getElementById('modal-overlay');
    const content = document.getElementById('modal-content');
    content.innerHTML = html;
    overlay.classList.add('active');
  },

  closeModal() {
    document.getElementById('modal-overlay').classList.remove('active');
  },

  showPropertyCard(cell, cellIdx) {
    const level = GameState.cellLevels[cellIdx];
    const levelName = cell.pLevels ? cell.pLevels[level - 1] : 'Уровень ' + level;
    const nextIncome = Math.round((cell.pIncome || 0) * (1 + (level - 1) * 0.5));

    UI.showModal(`
      <div class="property-card">
        <div class="property-icon">${cell.pIcon || '🏭'}</div>
        <div class="property-name">${cell.pName}</div>
        <div class="property-group">${cell.pGroup || 'Логистика'} • ${levelName}</div>
        <div class="property-details">
          <div class="property-detail">
            <span class="property-detail-label">Стоимость</span>
            <span class="property-detail-value">${Util.formatMoney(cell.pCost)}</span>
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Доход</span>
            <span class="property-detail-value">${Util.formatMoney(nextIncome)} / ход</span>
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Уровень</span>
            <span class="property-detail-value">${level}</span>
          </div>
        </div>
        <div class="property-buttons">
          <button class="btn btn-primary" onclick="Game.buyProperty()">КУПИТЬ</button>
          <button class="btn btn-secondary" onclick="Game.declineProperty()">ОТКАЗАТЬСЯ</button>
        </div>
      </div>
    `);
  },

  showUpgradeCard(cell, cellIdx) {
    const level = GameState.cellLevels[cellIdx];
    const cost = Math.round(cell.pUpgradeCost * level);
    const currentIncome = Math.round((cell.pIncome || 0) * (1 + (level - 1) * 0.5));
    const nextIncome = Math.round((cell.pIncome || 0) * (1 + level * 0.5));

    UI.showModal(`
      <div class="property-card">
        <div class="property-icon">${cell.pIcon || '🏭'}</div>
        <div class="property-name">${cell.pName}</div>
        <div class="property-group">УРОВЕНЬ ${level} → ${level + 1}</div>
        <div class="property-details">
          <div class="property-detail">
            <span class="property-detail-label">Текущий доход</span>
            <span class="property-detail-value">${Util.formatMoney(currentIncome)} / ход</span>
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Новый доход</span>
            <span class="property-detail-value">${Util.formatMoney(nextIncome)} / ход</span>
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Стоимость улучшения</span>
            <span class="property-detail-value">${Util.formatMoney(cost)}</span>
          </div>
        </div>
        <div class="property-buttons">
          <button class="btn btn-primary" onclick="Game.upgradeProperty()">УЛУЧШИТЬ</button>
          <button class="btn btn-secondary" onclick="UI.closeModal(); Game.endTurn()">ОТЛОЖИТЬ</button>
        </div>
      </div>
    `);
  },

  showTransportCard(cell, cellIdx) {
    UI.showModal(`
      <div class="property-card">
        <div class="property-icon">${cell.tIcon || '🚚'}</div>
        <div class="property-name">${cell.tName}</div>
        <div class="property-group">ТРАНСПОРТ</div>
        <div class="property-details">
          <div class="property-detail">
            <span class="property-detail-label">Стоимость</span>
            <span class="property-detail-value">${Util.formatMoney(cell.tCost)}</span>
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Доход</span>
            <span class="property-detail-value">${Util.formatMoney(cell.tIncome)} / ход</span>
          </div>
        </div>
        <div class="property-buttons">
          <button class="btn btn-primary" onclick="Game.buyTransport()">КУПИТЬ</button>
          <button class="btn btn-secondary" onclick="UI.closeModal(); Game.endTurn()">ОТКАЗАТЬСЯ</button>
        </div>
      </div>
    `);
  },

  showOrderCard(order) {
    const player = GameState.currentPlayer;
    const riskMod = player.riskModifier;
    const finalRisk = Util.clamp(order.risk + riskMod, 1, 95);

    UI.showModal(`
      <div class="order-card">
        <div class="order-number">ЗАКАЗ №${order.id}</div>
        <div class="order-title">НОВЫЙ ЗАКАЗ</div>
        <div class="order-route">${order.route}</div>
        <div class="order-details">
          <div class="order-detail">
            <span class="order-detail-label">Груз</span>
            <span class="order-detail-value">${order.cargo}</span>
          </div>
          <div class="order-detail">
            <span class="order-detail-label">Срок</span>
            <span class="order-detail-value">${order.turns} хода</span>
          </div>
          <div class="order-detail">
            <span class="order-detail-label">Расходы</span>
            <span class="order-detail-value">${Util.formatMoney(order.cost)}</span>
          </div>
          <div class="order-detail">
            <span class="order-detail-label">Доход</span>
            <span class="order-detail-value">${Util.formatMoney(order.income)}</span>
          </div>
        </div>
        <div class="order-risk">ОЦЕНКА РИСКА: ${finalRisk}%</div>
        <div class="order-buttons">
          <button class="btn btn-primary" onclick="Game.acceptOrder()">ВЫПОЛНИТЬ ЗАКАЗ</button>
          <button class="btn btn-secondary" onclick="Game.declineOrder()">ОТКАЗАТЬСЯ</button>
        </div>
      </div>
    `);
  },

  showEventCard(evt) {
    UI.showModal(`
      <div class="event-card">
        <div class="event-type-label">СОБЫТИЕ</div>
        <div class="event-title">${evt.title}</div>
        <div class="event-description">${evt.desc}</div>
        <div class="event-effect">${evt.money > 0 ? '+' + Util.formatMoney(evt.money) : evt.money < 0 ? Util.formatMoney(evt.money) : ''}</div>
        <button class="btn btn-primary" onclick="Game.processEvent(EVENTS.find(e => e.id === ${evt.id}))">ПОНЯТНО</button>
      </div>
    `);
  },

  showChoiceEvent(evt) {
    UI.showModal(`
      <div class="event-card">
        <div class="event-type-label">СОБЫТИЕ</div>
        <div class="event-title">${evt.title}</div>
        <div class="event-description">${evt.desc}</div>
        <div class="order-buttons">
          <button class="btn btn-primary" onclick="Game.processEventChoice(EVENTS.find(e => e.id === ${evt.id}), 'pay')">ЗАПЛАТИТЬ ${Util.formatMoney(Math.abs(evt.money))}</button>
          <button class="btn btn-secondary" onclick="Game.processEventChoice(EVENTS.find(e => e.id === ${evt.id}), 'skip')">ПРОПУСТИТЬ ХОД</button>
        </div>
      </div>
    `);
  },

  showFreeRouteCard() {
    UI.showModal(`
      <div class="event-card">
        <div class="event-type-label">СВОБОДНЫЙ МАРШРУТ</div>
        <div class="event-title">🛣️ Свободный маршрут</div>
        <div class="event-description">Вы можете пропустить один ход в любой момент в будущем.</div>
        <div class="event-effect">Активируется автоматически при необходимости</div>
        <button class="btn btn-primary" onclick="UI.closeModal(); Game.endTurn()">ПОНЯТНО</button>
      </div>
    `);
  },

  showEmployeeModal() {
    const p = GameState.currentPlayer;
    const empCards = EMPLOYEES.map(e => {
      const count = p.employees[e.id] || 0;
      const hireCost = count * 15000;
      const maxed = count >= 3;
      return `
        <div class="employee-card-inline">
          <div class="employee-role">${e.name}</div>
          <div class="employee-cost">Зарплата: ${Util.formatMoney(e.salary)} / ход</div>
          <div class="employee-bonus">${e.desc}</div>
          <div class="employee-count">Нанято: ${count} / 3</div>
          ${maxed ? '<div class="employee-cost">МАКСИМУМ</div>' :
            '<button class="btn btn-small" onclick="Game.hireEmployee(\'' + e.id + '\')">НАНЯТЬ' + (count > 0 ? ' (' + Util.formatMoney(hireCost) + ')' : '') + '</button>'}
        </div>
      `;
    }).join('');

    UI.showModal(`
      <div class="employee-modal-content">
        <div class="modal-title">СОТРУДНИКИ</div>
        <div class="employee-grid">${empCards}</div>
        <div style="text-align:center">
          <div class="employee-cost">Текущие расходы на персонал: ${Util.formatMoney(p.salaryCost)} / ход</div>
          <button class="btn btn-secondary modal-close-btn" onclick="UI.closeModal()">ГОТОВО</button>
        </div>
      </div>
    `);
  },

  showBankModal() {
    const p = GameState.currentPlayer;
    const hasLoan = p.loan !== null;
    const loanInfo = hasLoan ?
      `<div class="credit-status">Активный кредит: осталось ${p.loan.remaining} ход(ов), к возврату ${Util.formatMoney(p.loan.repay)}</div>` :
      `<div class="credit-status">Нет активных кредитов</div>`;

    UI.showModal(`
      <div class="property-card">
        <div class="property-icon">💳</div>
        <div class="property-name">БАНК / КРЕДИТ</div>
        ${loanInfo}
        <div class="property-details">
          <div class="property-detail">
            <span class="property-detail-label">Сумма кредита</span>
            <span class="property-detail-value">${Util.formatMoney(CONFIG.CREDIT_AMOUNT)}</span>
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Срок</span>
            <span class="property-detail-value">${CONFIG.CREDIT_TERM} ходов</span>
          </div>
          <div class="property-detail">
            <span class="property-detail-label">Возврат</span>
            <span class="property-detail-value">${Util.formatMoney(CONFIG.CREDIT_REPAY)}</span>
          </div>
        </div>
        <div class="property-buttons">
          ${hasLoan ? '' : '<button class="btn btn-primary" onclick="Game.takeLoan()">ВЗЯТЬ КРЕДИТ</button>'}
          <button class="btn btn-secondary" onclick="UI.closeModal()">ГОТОВО</button>
        </div>
      </div>
    `);
  },

  showRules() {
    document.getElementById('rules-modal').classList.add('active');
  },

  closeRules() {
    document.getElementById('rules-modal').classList.remove('active');
  },

  showSettings() {
    document.getElementById('settings-modal').classList.add('active');
  },

  closeSettings() {
    document.getElementById('settings-modal').classList.remove('active');
  },

  toggleSound() {
    // Sound toggle placeholder - no external sounds required
  },

  setAnimSpeed(speed) {
    document.querySelectorAll('.speed-selector .btn').forEach(b => b.classList.remove('active'));
    document.querySelector(`.speed-selector .btn:nth-child(${speed === 'slow' ? 1 : speed === 'normal' ? 2 : 3})`).classList.add('active');
  },

  showGameOver() {
    const scores = Game.calculateWinner();
    const winner = scores[0].player;
    const winnerText = '🏆 ЛУЧШАЯ ЛОГИСТИЧЕСКАЯ КОМПАНИЯ: ' + winner.name + ' 🏆';

    const rows = scores.map((s, i) => {
      const p = s.player;
      const isWinner = i === 0;
      return `
        <div class="final-player-row" ${isWinner ? 'style="border-color: #b8984a; background: #faf6ee;"' : ''}>
          <div class="final-rank">${i + 1}</div>
          <div class="final-color" style="background:${p.color}"></div>
          <div class="final-name">${p.name} ${isWinner ? '🏆' : ''}</div>
          <div class="final-score">${Util.formatNum(s.score)}</div>
          <div class="final-detail">${Util.formatMoney(p.money)}</div>
        </div>
      `;
    }).join('');

    const statsEl = document.getElementById('final-stats');
    statsEl.innerHTML = rows;
    document.getElementById('winner-text').textContent = winnerText;
    document.getElementById('game-over-modal').classList.add('active');
  },

  loadGame() {
    Game.loadGame();
  },

  notify(message, type = 'info') {
    const existing = document.querySelector('.notification');
    if (existing) existing.remove();

    const div = document.createElement('div');
    div.className = 'notification ' + type;
    div.textContent = message;
    document.body.appendChild(div);

    setTimeout(() => {
      div.style.transition = 'opacity 0.3s, transform 0.3s';
      div.style.opacity = '0';
      div.style.transform = 'translateX(50px)';
      setTimeout(() => div.remove(), 300);
    }, 3000);
  }
};

/* ============================================================
   INITIALIZATION
   ============================================================ */
document.addEventListener('DOMContentLoaded', () => {
  UI.switchScreen('main-menu');
});

// Expose to global scope for onclick handlers
window.Game = Game;
window.UI = UI;
window.GameState = GameState;
window.EVENTS = EVENTS;