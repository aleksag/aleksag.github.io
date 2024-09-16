#include <esp_now.h>
#include <WiFi.h>
#include <BMI160Gen.h>

const int select_pin = 7;
const int i2c_addr = 0x69;

uint8_t broadcastAddress[] = {0x30, 0x30, 0xF9, 0x72, 0x8C, 0x5C};

typedef struct struct_message {
  int boardNo;
} struct_message;

struct_message myData;

esp_now_peer_info_t peerInfo;
              
String error ="";
void setup() {
  // Init Serial Monitor
  //BMI160.begin(BMI160GenClass::I2C_MODE, Wire, i2c_addr);
  BMI160.begin(BMI160GenClass::I2C_MODE,i2c_addr,select_pin);


  // Set device as a Wi-Fi Station
  WiFi.mode(WIFI_STA);

  // Init ESP-NOW
  if (esp_now_init() != ESP_OK) {
    return;
  }

  // Register peer
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  // Add peer
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    return;
  }
}

void loop() {
  int gx, gy, gz;         // raw gyro values
  //BMI160.readGyro(gx, gy, gz);
  BMI160.readAccelerometer(gx, gy, gz);
  float at = sqrt(gx * gx + gy * gy + gz * gz);
  if (at > 35000) {
    myData.boardNo = 1;
    esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));
    delay(350);
  }

}
