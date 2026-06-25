#include <Arduino.h>

void setup() {
  Serial.begin(9600);
}

void loop() {
  if (Serial.available() > 0) {
    String incoming = Serial.readStringUntil('\n');
    
    if (incoming == "SYS:WHOAMI") {
      Serial.println("SYS:GREENHOUSE_UNO");
    }
  }
}
