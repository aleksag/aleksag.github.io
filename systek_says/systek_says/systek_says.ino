#include <Wire.h>
#include <vector>
#include "SparkFunSX1509.h"

char readButtons(); // Function to read button input
void lightButton(char number, int color); // Function to light up button
void playSequence();
bool getUserInput();
int hexCharToDecimal(char hexChar);
void sequencePlay(int repeats);
void Task2code( void * pvParameters );

const byte SX1509_ADDRESS_KEYS = 0x3E;
const byte SX1509_ADDRESS_LED_RED = 0x71;
const int DELAY_TIME = 500;
const int INPUT_TIMEOUT = 3000;
const byte ARDUINO_INTERRUPT_PIN = 13;

#define KEY_ROWS 4
#define KEY_COLS 4

int keyMap[4][4] = {
  {1, 5, 9, 13},
  {2, 6, 10, 14},
  {3, 7, 11, 15},
  {4, 8, 12, 16}
};


SX1509 io_keys;
SX1509 io_red_led;
TaskHandle_t Task2;

void setup() {
  Serial.begin(115200);
  Serial.println("Systek says");
  Wire.begin();

  if (io_red_led.begin(SX1509_ADDRESS_LED_RED) == false)
  {
    Serial.println("Failed to communicate with red led. Check wiring and address of SX1509.");
    while (1)
      ; // If we fail to communicate, loop forever.
  }
  io_red_led.clock(INTERNAL_CLOCK_2MHZ, 4);
  for (int i = 0; i <= 15; i++) {
    io_red_led.pinMode(i, ANALOG_OUTPUT);
    io_red_led.analogWrite(i, 0);
  }


  if (io_keys.begin(SX1509_ADDRESS_KEYS) == false)
  {
    Serial.println("Failed to communicate with keys. Check wiring and address of SX1509(keyboard)");
    while (1)
      ;
  }
  byte scanTime = 2;
  byte debounceTime = 1;
  byte sleepTime = 0;
  io_keys.keypad(KEY_ROWS, KEY_COLS,
                 sleepTime, scanTime, debounceTime);
  pinMode(ARDUINO_INTERRUPT_PIN, INPUT_PULLUP);
  randomSeed(analogRead(0));
  sequencePlay(5);
}
unsigned int previousKeyData = 0;
char previousChar = '0';
unsigned int holdCount, releaseCount = 0;
const unsigned int holdCountMax = 15;
const unsigned int releaseCountMax = 100;


std::vector<int> sequence;
bool gameOver = false;

void sequencePlay(int repeats) {
  for (int y = 0; y < repeats; y++) {
    for (int i = 0; i <= 15; i++) {
      io_red_led.analogWrite(i, 255);
      delay(15);
      io_red_led.analogWrite(i, 0);
    }
  }
  delay(500);
}



void loop() {
  sequence.push_back(random(1, 16)); // Add a random button to sequence
  playSequence();

  for (int expected : sequence) {
    int inputValue = -1;
    Serial.print("Expecting user input: ");
    Serial.println(expected);
    while (true) {
      if (digitalRead(ARDUINO_INTERRUPT_PIN) == LOW)
      {
        delay(30);
        unsigned int keyData = io_keys.readKeypad();
        if (keyData != 0) {
          io_keys.writeByte(0x15,0x00);
          byte row = io_keys.getRow(keyData);
          byte col = io_keys.getCol(keyData);
          inputValue = keyMap[row][col];
          Serial.println((String)"Got input " + inputValue);
          delay(10);
          while (io_keys.readKeypad() != 0) {
            Serial.println("Delaying...");
            delay(10);
          }
          break;
        }
      }
      delay(30);
    }
    if (inputValue != expected) {
      gameOver = true; // Wrong input
      break;
    }
  }

  if (gameOver) {
    sequence.clear(); // Reset game
    sequencePlay(5);
    gameOver = false;
  }
  delay(1000);
}

void lightButton(int pin, int color, int intensity) {
  Serial.print("Lighting button:");
  Serial.print(",int:");
  Serial.println(pin);
  io_red_led.analogWrite(pin, intensity);
}

void playSequence() {
  for (int btn : sequence) {
    lightButton(btn - 1, 1, 255); // Light up the button (color 1 assumed)
    delay(DELAY_TIME);
    lightButton(btn - 1, 0, 0); // Turn off the button
    delay(DELAY_TIME);
  }
}



int hexCharToDecimal(char hexChar) {
  if (hexChar >= '0' && hexChar <= '9') {
    return hexChar - '0';  // Convert '0'-'9' to 0-9
  } else if (hexChar >= 'A' && hexChar <= 'F') {
    return hexChar - 'A' + 10;  // Convert 'A'-'F' to 10-15
  } else if (hexChar >= 'a' && hexChar <= 'f') {
    return hexChar - 'a' + 10;  // Convert 'a'-'f' to 10-15
  } else {
    return -1;  // Invalid input
  }
}
