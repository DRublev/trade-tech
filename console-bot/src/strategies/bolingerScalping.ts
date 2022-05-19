/** TODO
  ** -- if candle closes above the MA (middle line) and next opens above - buy, 
    stop on the buy price - 2pt
    If volume is high (greater than avg volume per candle), sell market when H is above the UB (upper bound),
    If volume is low - limit sell + 5pt from buy price

  ** -- if candle closes below the MA (middle line) and next opens below - wait to buy
    Till O crosses MA, then buy market,
    Or when LB (lower bound) is crossed, then check volume - if low buy market, if high - sell half of holding for market

  ** -- Use https://github.com/anandanand84/technicalindicators
*/