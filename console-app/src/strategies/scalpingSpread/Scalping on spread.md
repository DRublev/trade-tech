### Конфиг
availableBalance - макс денег, которые можно потратить
maxLots - макс лотов к покупке за раз.
  если цена акции 10$, имеется на торговлю 70$, то 70 / 2 = 45 > 45 / 10 = 4 > держим позицию в 4 лота, остальное резерв 
lotsDistribution - по сколько лотов входить/выходить "лесенкой"


pbMax - на сколько близко цена к границе BB


minSpread - минимальный спред, на котором заходим. Стоит ставить с учетом комиссии сразу
maxSpreadFarSteps 
moveOrdersOnSteps - если мы выставили ордеры, а в стакане между нашим ордером и bid/ask(1) появилось Х (этот параметр) степов, то отменяем ордеры и переставляем заявки 

### Вход в позу
 - На получении стакана ищем сайз на покупку, самый ближайший к минимальной цене продажи, при этом отбрасываем самый большой сайз, если он в разы больше чем остальные - скорее всего это уровень отскока
 - Если сайз на покупку дальше от мин цены продажи на maxSpreadFarSteps, то ждем изменения в стакане. То есть если maxSpreadFarSteps = 4, то между зайзом на покупку и мин ценой продажи не долджно быть больше 4 позиций в стакане
 - Проверяем разницу между ask(1) (мин цена покупки) и найденным сайзом. если меньше чем minSpread - ждем, если больше - считаем как войти
 - maxLots / lotsDistribution = toBuy, на сколько лотов выставлять bid. Выставляем ордер на bid(sizeIdx) лотностью toBuy. Допустим был сайз на 10.34, toBuy = maxLots / lotsDistribution = 7 / 3 = [3, 3, 2]. ставим bid(sizeIdx)[3], bid(sizeIdx - 1)[3], bid(sizeId - 2)[2]
 - на обновление стакана проверяем moveOrdersOnSteps и индексы наших ордеров, если не проходим - возвращаемся в начало, тем самым передвигая заявки
 - если к моменту передвижения заявок мы успели войти в позу - выходим из нее на price (цена покупки) + minSpread
 - если %b больше pbMax, а у нас есть поза - выходим на ближайшем сайзе на продажу
 - если %b у нижней границе - заходим на ближайшем сайзе на покупку

### Выход из позы
 - Выходим когда %b близок к 100 на pbMax, или цена покупки меньше на minSpread
 - Выходим лесенкой, аналогично входу, за исключением того что toSell = holdingLots / lotsDistribution
 - На обновление стакана оредеры не отменяем
 Как вариант просто выставить take-profit при входе в позу
 