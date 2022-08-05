const ruLabels = {
  availableBalance: {
    label: 'Доступный баланс',
    tooltip: 'Доступный баланс для покупки лотов',
    suffix: 'key::instrument-currency'
  },
  maxHolding: {
    label: 'Максимальное количество лотов',
    tooltip: 'Максимальное количество лотов на покупку',
  },
  minSpread: {
    label: 'Минимальный спред',
    tooltip: 'Минимальный спред считающийся доходным',
  },
  moveOrdersOnStep: {
    label: 'Перемещать ордер, если перед ним ',
    tooltip: 'Если перед выставленным ордером в стакане X других заявок, закрыть его и создать новый',
  },
  lotsDistribution: {
    label: 'Распределение покупки лотов',
  },
  stopLoss: {
    label: 'Стоп-лосс покупки',
    tooltip: 'На сколько должна опуститься цена, чтобы зафиксировать убыток',
  },
  askStopLoss: {
    label: 'Стоп-лосс продажи',
    tooltip: 'На сколько должна опуститься цена, чтобы зафиксировать убыток',
  },
  sharesInLot: {
    label: 'Количество акций в лоте',
  },
  watchAsk: {
    label: 'Следить за аском',
  },
  waitTillNextBuyMs: {
    label: 'Ожидать после покупки',
    suffix: 'ms',
  },
  waitAfterStopLossMs: {
    label: 'Ожидать после стоп-лосса',
    suffix: 'ms',
  },
};

export default ruLabels;