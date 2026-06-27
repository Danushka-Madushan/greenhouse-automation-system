#pragma once

#ifndef GREENOS_HPP
#define GREENOS_HPP

#include <Arduino.h>

namespace GreenOS
{
  class EventHandler
  {
  private:
    HardwareSerial* serial;

  public:
    EventHandler(HardwareSerial* serial);

    void onReceive();
  };
}

#endif
