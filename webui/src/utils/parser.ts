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

  public static parseLightIntensity: (statusStr: string) => number = (statusStr) => {
    // 1. Get everything after the last colon
    const lightLevel = statusStr.split(':').pop();

    // 2. Convert string to number and return
    return lightLevel ? parseFloat(lightLevel) : 0;
  };
}
