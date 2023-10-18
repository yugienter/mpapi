export function convertObjectToCamelCase(obj: any): any {
  const newObj: any = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      newObj[toCamelCase(key)] = obj[key];
    }
  }
  return newObj;
}

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
}

export function convertToMilliseconds(durationStr: string): number {
  const match = durationStr.match(/^(\d+)([smhdwoy])$/i);
  if (!match) {
    throw new Error('Invalid duration format');
  }

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  if (value < 0) {
    throw new Error('Duration value must be a non-negative integer');
  }

  switch (unit) {
    case 's': // seconds
      return value * 1000;
    case 'm': // minutes
      return value * 60 * 1000;
    case 'h': // hours
      return value * 60 * 60 * 1000;
    case 'd': // days
      return value * 24 * 60 * 60 * 1000;
    case 'w': // weeks
      return value * 7 * 24 * 60 * 60 * 1000;
    case 'o': // months (approximately)
      return value * 30 * 24 * 60 * 60 * 1000;
    case 'y': // years (approximately)
      return value * 365 * 24 * 60 * 60 * 1000;
    default:
      throw new Error('Unknown time unit');
  }
}
