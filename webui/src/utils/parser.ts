export class Parser {
  public static parseTempHumidity: (statusStr: string) => { temperature: number; humidity: number } = (statusStr) => {
    // 1. Get everything after the last colon, then split by the comma
    const [temp, humidity] = statusStr.split(':').pop()?.split(',') ?? ['0', '0'];

    // 2. Convert strings to numbers and return an object
    return {
      temperature: parseFloat(temp),
      humidity: parseFloat(humidity)
    };
  };

  public static parseSoilMoisture: (statusStr: string) => { sector1: number; sector2: number; sector3: number; sector4: number } = (statusStr) => {
    // 1. Get everything after the last colon, then split by the comma
    const [sector1, sector2, sector3, sector4] = statusStr.split(':').pop()?.split(',') ?? ['0', '0', '0', '0'];

    // 2. Convert strings to numbers and return an object
    return {
      sector1: parseFloat(sector1),
      sector2: parseFloat(sector2),
      sector3: parseFloat(sector3),
      sector4: parseFloat(sector4)
    };
  };

  public static parseWaterLevel: (statusStr: string) => number = (statusStr) => {
    // 1. Get everything after the last colon
    const waterLevel = statusStr.split(':').pop();

    // 2. Convert string to number and return
    return waterLevel ? parseFloat(waterLevel) : 0;
  };

  public static parseLightIntensity: (statusStr: string) => number = (statusStr) => {
    // 1. Get everything after the last colon
    const lightLevel = statusStr.split(':').pop();

    // 2. Convert string to number and return
    return lightLevel ? parseFloat(lightLevel) : 0;
  };
}
