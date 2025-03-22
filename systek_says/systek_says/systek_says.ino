#include <Wire.h>
#include <vector>
#include "SparkFunSX1509.h"
#include <driver/i2s.h>
#include <math.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>

char readButtons();
void lightButton(char number, int color);
void playSequence();
bool getUserInput();
int hexCharToDecimal(char hexChar);
void sequencePlay(int repeats);
void Task2code( void * pvParameters );
void playGameOverSound();
void playSoundForButton(int button);
void debugPrintln(const String &message);
void debugPrintln(int value);
void debugPrintln(float value);
void debugPrintln(const char *message);
void debugPrint(const String &message);
void debugPrint(int value);
void debugPrint(float value);
void debugPrint(const char *message);

#define I2S_NUM         I2S_NUM_0  // Use I2S0
#define I2S_BCK_IO      26         // Bit Clock
#define I2S_WS_IO       25         // Word Select (LRCLK)
#define I2S_DOUT_IO     23         // Data Output (DIN)
#define SAMPLE_RATE     44100      // CD-quality sample rate
#define BUFFER_SIZE     512        // DMA buffer size

QueueHandle_t frequencyQueue; // Queue to hold frequency commands

const byte SX1509_ADDRESS_KEYS = 0x3E;
const byte SX1509_ADDRESS_LED_RED = 0x3F;
const byte SX1509_ADDRESS_LED_GREEN = 0x71;
const int DELAY_TIME = 500;
const int INPUT_TIMEOUT = 3000;
const byte ARDUINO_INTERRUPT_PIN = 13;

#define KEY_ROWS 4
#define KEY_COLS 4
#define DEBUG false


int keyMap[4][4] = {
  {1, 5, 9, 13},
  {2, 6, 10, 14},
  {3, 7, 11, 15},
  {4, 8, 12, 16}
};

float frequencies[] = {
    164.81,  // E3
    174.61,  // F3
    196.00,  // G3
    220.00,  // A3
    246.94,  // B3
    261.63,  // C4 (Middle C)
    293.66,  // D4
    329.63,  // E4
    349.23,  // F4
    370.00,  // F#4
    392.00,  // G4
    440.00,  // A4 (Standard tuning)
    493.88,  // B4
    523.25,  // C5 (1 octave above C4)
    587.33,  // D5
    659.26   // E5
};

SX1509 io_keys;
SX1509 io_red_led;
SX1509 io_green_led;
TaskHandle_t Task2;

void setupI2S() {
  i2s_config_t i2s_config = {
    .mode = (i2s_mode_t)(I2S_MODE_MASTER | I2S_MODE_TX),
    .sample_rate = SAMPLE_RATE,
    .bits_per_sample = I2S_BITS_PER_SAMPLE_16BIT,
    .channel_format = I2S_CHANNEL_FMT_RIGHT_LEFT,
    .communication_format = I2S_COMM_FORMAT_I2S,
    .intr_alloc_flags = ESP_INTR_FLAG_LEVEL1,
    .dma_buf_count = 8,
    .dma_buf_len = BUFFER_SIZE,
    .use_apll = false,
    .tx_desc_auto_clear = true
  };

  i2s_pin_config_t pin_config = {
    .bck_io_num = I2S_BCK_IO,
    .ws_io_num = I2S_WS_IO,
    .data_out_num = I2S_DOUT_IO,
    .data_in_num = I2S_PIN_NO_CHANGE
  };

  i2s_driver_install(I2S_NUM, &i2s_config, 0, NULL);
  i2s_set_pin(I2S_NUM, &pin_config);
}

void generateSound(float frequency, int duration_ms) {
  int16_t sample[BUFFER_SIZE * 2];
  float phase = 0.0;
  float tremolo_phase = 0.0;
  float tremolo_speed = 7.0; // 7Hz tremolo
  float tremolo_depth = 0.5; // 50% volume variation

  int num_samples = (SAMPLE_RATE * duration_ms) / 1000;

  for (int s = 0; s < num_samples; s += BUFFER_SIZE) {
    for (int i = 0; i < BUFFER_SIZE; i++) {
      // Tremolo effect: Modulate volume
      float tremolo = 1.0 - (tremolo_depth * (0.5 + 0.5 * sin(tremolo_phase)));
      tremolo_phase += (2.0 * M_PI * tremolo_speed / SAMPLE_RATE);
      if (tremolo_phase >= 2.0 * M_PI) tremolo_phase -= 2.0 * M_PI;

      float volume = 0.5; // Adjust volume (0.0 = mute, 1.0 = full)
      int16_t value = (int16_t)(32767 * volume * sin(phase) * tremolo);
      float phase_increment = 2.0 * M_PI * frequency / SAMPLE_RATE;
      phase += phase_increment;
      if (phase >= 2.0 * M_PI) phase -= 2.0 * M_PI;

      sample[i * 2] = value;
      sample[i * 2 + 1] = value;
    }

    size_t bytes_written;
    i2s_write(I2S_NUM, sample, sizeof(sample), &bytes_written, portMAX_DELAY);
  }
}

void soundTask(void *parameter) {
  float frequency;
  while (true) {
    // Wait for a new frequency from the queue
    if (xQueueReceive(frequencyQueue, &frequency, portMAX_DELAY) == pdTRUE) {
      debugPrint("Playing: ");
      debugPrint(frequency);
      debugPrintln(" Hz for 1 second");
      generateSound(frequency, 300);  // Play for 1 second
    }
  }
}

void setup() {
  Serial.begin(115200);
  Serial.println("Systek says");
  Wire.begin();

  setupI2S();
  frequencyQueue = xQueueCreate(10, sizeof(float));
  xTaskCreate(soundTask, "SoundTask", 4096, NULL, 1, NULL); // Increased stack size to 4096 bytes

  if (io_red_led.begin(SX1509_ADDRESS_LED_RED) == false)
  {
    Serial.println("Failed to communicate with red led. Check wiring and address of SX1509.");
    while (1)
      ; // If we fail to communicate, loop forever.
  }
  io_red_led.clock(INTERNAL_CLOCK_2MHZ, 4);

  //if (io_green_led.begin(SX1509_ADDRESS_LED_GREEN) == false)
 // {
   // Serial.println("Failed to communicate with green led. Check wiring and address of SX1509.");
   // while (1)
   //   ; // If we fail to communicate, loop forever.
  //}
  //io_green_led.clock(INTERNAL_CLOCK_2MHZ, 4);
  
  for (int i = 0; i <= 15; i++) {
    io_red_led.pinMode(i, ANALOG_OUTPUT);
    //io_green_led.pinMode(i, ANALOG_OUTPUT);
    io_red_led.analogWrite(i, 0);
    //io_green_led.analogWrite(i, 0);
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
  //randomSeed(analogRead(0));
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
  //io_green_led.analogWrite(0, 255);
  for (int y = 0; y < repeats; y++) {
    for (int i = 0; i <= 15; i++) {
      io_red_led.analogWrite(i, 255);
      delay(15);
      io_red_led.analogWrite(i, 0);
    }
  }
  //io_green_led.analogWrite(0, 0);
  delay(500);
}


int score = 0;
void loop() {
  sequence.push_back(random(1, 16)); // Add a random button to sequence
  playSequence();
  static String receivedData = "";

  for (int expected : sequence) {
    int inputValue = -1;
    debugPrint("Forventer user input: ");
    debugPrintln(expected);
    while (true) {
      if (digitalRead(ARDUINO_INTERRUPT_PIN) == LOW)
      {
        delay(30);
        unsigned int keyData = io_keys.readKeypad();
        delay(30);
        if (keyData != 0) {
          io_keys.writeByte(0x15,0x00);
          byte row = io_keys.getRow(keyData);
          byte col = io_keys.getCol(keyData);
          inputValue = keyMap[row][col];
          blinkButton(inputValue-1);
          playSoundForButton(inputValue);
          debugPrintln((String)"Got input " + inputValue);
          delay(30);
          while (io_keys.readKeypad() != 0) {
            debugPrintln("Delaying...");
            delay(10);
          }
          break;
        }
      }
       if (Serial.available()) {
        while (Serial.available()) {  
          char c = Serial.read();    
          receivedData += c;          
          if (c == '\n' || c == '\r') {
            receivedData.trim();  

            // Check if the received command is "-RESET"
            if (receivedData == "-RESET") {
              ESP.restart();  
            }
            receivedData = "";  // Clear buffer after processing
          }
        }
        delay(30);
      }
      delay(30);
    }
    if (inputValue != expected) {
      gameOver = true; // Wrong input
      break;
    }
  }
  score = score+1;
  if (gameOver) {
    sequence.clear(); // Reset game
    Serial.print("-GAMEOVER:");
    Serial.println(score);
    playGameOverSound();
    sequencePlay(5);
    gameOver = false;
    score = 0;
  }else{
      Serial.print("-SCORE:");
      Serial.println(score);
  }
  delay(1000);
}

void lightButton(int pin, int color, int intensity) {
  debugPrint("Lighting button:");
  debugPrint(",int:");
  debugPrintln(pin);
  io_red_led.analogWrite(pin, intensity);
}

void blinkButton(int pin) {
  io_red_led.analogWrite(pin, 255);
  delay(40);
  io_red_led.analogWrite(pin, 0);
}

void playSoundForButton(int btn){
    float frequency = frequencies[btn];
    xQueueSend(frequencyQueue, &frequency, portMAX_DELAY);
}


void playSequence() {
  for (int btn : sequence) {
    lightButton(btn - 1, 1, 255); // Light up the button (color 1 assumed)
    float frequency = frequencies[btn];
    xQueueSend(frequencyQueue, &frequency, portMAX_DELAY);
    delay(DELAY_TIME);
    lightButton(btn - 1, 0, 0); // Turn off the button
    delay(DELAY_TIME);
  }
}


void playGameOverSound() {
  float freq[] = {220.0, 440.0, 660.0}; // Frequencies for game over sound
  int durations[] = {300, 300, 300}; // Durations in milliseconds
  for (int i = 0; i < 3; i++) {
    xQueueSend(frequencyQueue, &freq[i], portMAX_DELAY);
    delay(50); // Short pause between notes
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

void debugPrintln(const String &message) {
    if (DEBUG) {
        Serial.println(message);
    }
}
void debugPrintln(int value) {
    if (DEBUG) {
        Serial.println(value);
    }
}

void debugPrintln(float value) {
    if (DEBUG) {
        Serial.println(value);
    }
}

void debugPrintln(const char *message) {
    if (DEBUG) {
        Serial.println(message);
    }
}

void debugPrint(const String &message) {
    if (DEBUG) {
        Serial.print(message);
    }
}

void debugPrint(int value) {
    if (DEBUG) {
        Serial.print(value);
    }
}

void debugPrint(float value) {
    if (DEBUG) {
        Serial.print(value);
    }
}

void debugPrint(const char *message) {
    if (DEBUG) {
        Serial.print(message);
    }
}
