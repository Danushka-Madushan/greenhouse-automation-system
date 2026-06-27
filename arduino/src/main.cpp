#include <Arduino.h>
#include "greenOS.hpp"

using namespace GreenOS;

/*  Declare a global pointer initialized to nullptr for EventHandler */
EventHandler *handler = nullptr;

void setup()
{
  Serial.begin(9600);
  /* Instantiate the EventHandler safely now, when the Serial is ready */
  handler = new EventHandler(&Serial);
}

void loop()
{
  if (handler != nullptr)
  {
    /* Handle Incomming Events */
    handler->onReceive();
  }
}
