#include <esp_now.h>
#include <WiFi.h>
#include <BMI160Gen.h>
#include "esp_sleep.h"
#include "driver/touch_sensor.h"

//
//
// DEEP SLEEP KODE
//
//

const int select_pin = 7;
const int i2c_addr = 0x69;

uint8_t broadcastAddress[] = {0x30, 0x30, 0xF9, 0x72, 0x8C, 0x5C};

typedef struct struct_message {
  int boardNo;
} struct_message;

struct_message myData;

esp_now_peer_info_t peerInfo;

// callback when data is sent
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("\r\nLast Packet Send Status:\t");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}

#if CONFIG_IDF_TARGET_ESP32
  #define THRESHOLD   300      /* Greater the value, more the sensitivity */
#else //ESP32-S2 and ESP32-S3 + default for other chips (to be adjusted) */
  #define THRESHOLD   100000   /* Lower the value, more the sensitivity */
#endif

String error = "";
#define TIME_TO_SLEEP  300  // Time in seconds (600 seconds = 10 minutes)    
//#define TOUCH_PIN      T1   // Use touch pin 0 (GPIO4)

void enterDeepSleep() {
  Serial.println("Going to sleep now");
  esp_deep_sleep_start();
}

void setupWakeUpTouchPin() {
  //touchAttachInterrupt(T1, []{}, THRESHOLD);
  //Serial.println("Setup wakeup with threshold:");
  //Serial.print(THRESHOLD);
  //esp_sleep_enable_touchpad_wakeup();
  touchSleepWakeUpEnable(T1,THRESHOLD);
}

unsigned long lastActivityTime = 0;

void blinkSignal(){
  for(int i = 0; i < 10;i++){
    digitalWrite(LED_BUILTIN,HIGH);
    delay(300);
    digitalWrite(LED_BUILTIN,LOW);
  }
}
void setup() {
  lastActivityTime = millis();
  
  //blinkSignal();
  Serial.begin(115200);
  Serial.print("Serial start");
  
  Wire.begin();
  BMI160.begin(BMI160GenClass::I2C_MODE, Wire, i2c_addr);

  WiFi.mode(WIFI_STA);

  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  esp_now_register_send_cb(OnDataSent);

  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    error = "FAILED TO ADD PEER";
    return;
  }

  setupWakeUpTouchPin();
}

void loop() {
  uint32_t touch_value;
  /*touch_pad_read_raw_data(TOUCH_PAD_NUM1, &touch_value);
  Serial.printf("%d,", touch_value);*/
  
  int gx, gy, gz;  // raw gyro values
  BMI160.readAccelerometer(gx, gy, gz);
  float at = sqrt(gx * gx + gy * gy + gz * gz);

  unsigned long currentTime = millis();
  if (at > 35000) {
    lastActivityTime = currentTime;
    Serial.println(error);
    Serial.println(at);
    myData.boardNo =  1 ;
    esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));

    if (result == ESP_OK) {
      Serial.println("Sent with success");
    } else {
      Serial.println("Error sending the data");
    }
    delay(350);
  }

  // Check for inactivity
  if ((currentTime - lastActivityTime) > (TIME_TO_SLEEP * 1000)) {
    enterDeepSleep();
  }
}
