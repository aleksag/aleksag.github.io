/*
  Rui Santos
  Complete project details at https://RandomNerdTutorials.com/esp-now-esp32-arduino-ide/
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files.
  
  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.
*/

#include <esp_now.h>
#include <WiFi.h>
#include <BMI160Gen.h>

#include "USB.h"
#include "USBHIDKeyboard.h"
USBHIDKeyboard Keyboard;

// Structure example to receive data
// Must match the sender structure
typedef struct struct_message {
  int boardNo;
} struct_message;


// Create a struct_message called myData
struct_message myData;

// callback function that will be executed when data is received
void OnDataRecv(const esp_now_recv_info_t *info, const uint8_t *incomingData, int len) {
  memcpy(&myData, incomingData, sizeof(myData));
  Serial.print("Az:");
  Serial.println(myData.boardNo);
  if(myData.ax == 1){
    Keyboard.write('a');
  }else{
    Keyboard.write('l');
  }
  Keyboard.write((char) 32);
  
}
 
void setup() {
  // Initialize Serial Monitor
  Serial.begin(115200);


  Keyboard.begin();
  USB.begin();
  
  // Set device as a Wi-Fi Station
  WiFi.mode(WIFI_STA);

  // Init ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }
  
  // Once ESPNow is successfully Init, we will register for recv CB to
  // get recv packer info
  esp_now_register_recv_cb(OnDataRecv);
}
 
void loop() {

}
