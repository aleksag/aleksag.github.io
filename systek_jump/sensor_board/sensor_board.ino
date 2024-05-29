#include <esp_now.h>
#include <WiFi.h>
#include <BMI160Gen.h>

const int select_pin = 7;
const int i2c_addr = 0x69;

uint8_t broadcastAddress[] = {0x30, 0x30, 0xF9, 0x72, 0x8C, 0x5C};

typedef struct struct_message {
  int gx;
  int gy;
  int gz;
  int ax;
  int ay;
  int az;

} struct_message;

struct_message myData;

esp_now_peer_info_t peerInfo;

// callback when data is sent
void OnDataSent(const uint8_t *mac_addr, esp_now_send_status_t status) {
  Serial.print("\r\nLast Packet Send Status:\t");
  Serial.println(status == ESP_NOW_SEND_SUCCESS ? "Delivery Success" : "Delivery Fail");
}

void setup() {
  // Init Serial Monitor
  Serial.begin(115200);
  Serial.print("Serial start");
  Wire.begin();
  BMI160.begin(BMI160GenClass::I2C_MODE, Wire, i2c_addr);

  // Set device as a Wi-Fi Station
  WiFi.mode(WIFI_STA);

  // Init ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("Error initializing ESP-NOW");
    return;
  }

  esp_now_register_send_cb(OnDataSent);

  // Register peer
  memcpy(peerInfo.peer_addr, broadcastAddress, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  // Add peer
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("Failed to add peer");
    return;
  }
}

void loop() {
  int gx, gy, gz;         // raw gyro values
  //BMI160.readGyro(gx, gy, gz);
  BMI160.readAccelerometer(gx, gy, gz);
  float at = sqrt(gx * gx + gy * gy + gz * gz);
  if (at > 35000) {
    Serial.println(at);
    myData.gx = 2;
    myData.gy = 2;
    myData.gz = 2;
    myData.ax = 2;
    myData.ay = 2;
    myData.az = 2;
    esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));

    if (result == ESP_OK) {
      Serial.println("Sent with success");
    }
    else {
      Serial.println("Error sending the data");
      
    }
    delay(350);
  }
  /*
    // display tab-separated gyro x/y/z values
    Serial.print("g:\t");
    Serial.print(gx);
    Serial.print("\t");
    Serial.print(gy);
    Serial.print("\t");
    Serial.print(gz);
    Serial.println();*/
  /*
    delay(500);
    // Set values to send
    myData.gx = 1;
    myData.gy = 1;
    myData.gz = 1;
    myData.ax = 1;
    myData.ay = 1;
    myData.az = 1;
    esp_err_t result = esp_now_send(broadcastAddress, (uint8_t *) &myData, sizeof(myData));

    if (result == ESP_OK) {
    Serial.println("Sent with success");
    }
    else {
    Serial.println("Error sending the data");
    }*/

}
