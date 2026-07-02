#include <Arduino.h>
#include <greenOS.hpp>

using namespace GreenOS;

Ultrasonic::Ultrasonic(int trigPin, int echoPin) : _trigPin(trigPin), _echoPin(echoPin)
{
}

/**
 * Sends a pulse and computes travel time into centimeter distance.
 * Includes error timeouts to keep the execution loop non-blocking if disconnected.
 */
float Ultrasonic::readDistanceCM()
{
  digitalWrite(_trigPin, LOW);
  delayMicroseconds(2);

  // Generate 10-microsecond trigger pulse
  digitalWrite(_trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(_trigPin, LOW);

  // PulseIn reads time duration. Timeout of 25000us (~4.2m) avoids infinite lockups
  long duration = pulseIn(_echoPin, HIGH, 25000);

  if (duration == 0)
  {
    return -1.0; // Detection failed or out of physical sensor range
  }

  // Speed of sound is 0.0343 cm per microsecond. Divide by 2 for round-trip path.
  return (duration * 0.0343) / 2.0;
}

/**
 * UPGRADED: Median Filter
 * Gathers N samples, sorts them by size, and picks the exact middle value.
 * This completely eliminates extreme high or low physical echo spikes.
 */
float Ultrasonic::getFilteredDistance(int samples) {
  float readings[15]; // Array to hold up to 15 samples
  if (samples > 15) samples = 15; // Safety bound for memory
  
  int validSamples = 0;
  
  for (int i = 0; i < samples; i++) {
    float reading = readDistanceCM();
    if (reading > 0) {
      readings[validSamples] = reading;
      validSamples++;
    }
    delay(20); // Increased delay slightly to let bottle echoes completely die out
  }
  
  if (validSamples == 0) return -1.0;
  
  // Sort the array (Bubble Sort)
  for (int i = 0; i < validSamples - 1; i++) {
    for (int j = 0; j < validSamples - i - 1; j++) {
      if (readings[j] > readings[j+1]) {
        float temp = readings[j];
        readings[j] = readings[j+1];
        readings[j+1] = temp;
      }
    }
  }
  
  // Return the Median (the exact middle value of the sorted array)
  return readings[validSamples / 2];
}

/**
 * UPGRADED: Adaptive Exponential Moving Average (Adaptive EMA)
 * Applies heavy smoothing for small ripples, but reacts instantly to rapid drains or refills.
 */
float Ultrasonic::calculatePercentage(float distance) {
  if (distance < 0) return 0.0;
  
  // Safely clamp incoming measurements
  if (distance > TANK_EMPTY_DISTANCE) distance = TANK_EMPTY_DISTANCE;
  if (distance < TANK_FULL_DISTANCE) distance = TANK_FULL_DISTANCE;
  
  float totalSpan = TANK_EMPTY_DISTANCE - TANK_FULL_DISTANCE;
  if (totalSpan <= 0) return 100.0; 
  
  float currentWaterHeight = TANK_EMPTY_DISTANCE - distance;
  float rawPercentage = (currentWaterHeight / totalSpan) * 100.0;
  
  // Initialize on the very first boot to prevent a slow climb from 0
  if (previousSmoothedPercent < 0) {
    previousSmoothedPercent = rawPercentage; 
    return previousSmoothedPercent;
  } 
  
  // --- ADAPTIVE LOGIC ---
  // Calculate exactly how far the new raw reading is from our currently saved average
  float difference = abs(rawPercentage - previousSmoothedPercent);
  
  if (difference > 12.0) {
    // MASSIVE CHANGE (Rapid drain or refill detected)
    // Blend 80% of the NEW reading. This bypasses the shock absorber so the UI drops instantly.
    previousSmoothedPercent = (rawPercentage * 0.8) + (previousSmoothedPercent * 0.2);
  } else {
    // SMALL CHANGE (Just water surface ripples)
    // Blend only 20% of the NEW reading. This keeps the heavy shock absorber active.
    previousSmoothedPercent = (rawPercentage * 0.2) + (previousSmoothedPercent * 0.8);
  }
  
  return previousSmoothedPercent;
}
