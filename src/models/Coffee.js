class Coffee {
  constructor(coffeeData = {}) {
    this.id = coffeeData.id || Date.now();
    this.timestamp = coffeeData.timestamp || new Date();
    this.intervalMs = coffeeData.intervalMs || 0;
    this.dayId = coffeeData.dayId || this.getDayId(this.timestamp);
  }

  getDayId(date) {
    return new Date(date).toISOString().split('T')[0];
  }

  toJSON() {
    return {
      id: this.id,
      timestamp: this.timestamp,
      intervalMs: this.intervalMs,
      dayId: this.dayId
    };
  }
}

module.exports = Coffee;