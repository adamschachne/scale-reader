import { useState } from "react";
import styles from "./App.module.css";

const hasHid = "hid" in navigator;

function App() {
  const [hidDevice, setHidDevice] = useState<HIDDevice | null>(null);
  const [grams, setGrams] = useState<number>(0);

  const pounds = Math.round((grams / 453.59237) * 100) / 100;
  const ounces = Math.round(pounds * 16);

  const openDevice = (device: HIDDevice) => {
    device
      .open()
      .then(() => {
        console.log("Opened device: " + device.productName);

        device.addEventListener("inputreport", (event) => {
          const { data } = event;
          // Byte 0 == Report ID?
          // Byte 1 == Scale Status (1 == Fault, 2 == Stable @ 0, 3 == In Motion, 4 == Stable, 5 == Under 0, 6 == Over Weight, 7 == Requires Calibration, 8 == Requires Re-Zeroing)
          // Byte 2 == Weight Unit
          // Byte 3 == Data Scaling (decimal placement)
          // Byte 4 == Weight LSB
          // Byte 5 == Weight MSB

          const bytes = new Uint8Array(data.buffer);
          const weightUnit = bytes[1];

          switch (weightUnit) {
            case 2: // grams
              setGrams(Math.round((bytes[3] + bytes[4] * 256) * 100) / 100);
              break;
            case 11: // ounces
              setGrams(Math.round(((bytes[3] + bytes[4] * 256) / 10) * 28.3495 * 100) / 100);
              break;
            case 12: // pounds
            default:
              console.log("idk");
          }
        });
      })
      .catch((error) => {
        console.log("Failed to open device: " + error);
      });
  };

  const requestDevice = () => {
    navigator.hid
      .requestDevice({ filters: [] })
      .then((devices) => {
        if (devices.length == 0) {
          console.log("No device was selected.");
        } else {
          console.log("Device selected: " + devices[0].productName);
          setHidDevice(devices[0]);
          openDevice(devices[0]);
        }
      })
      .catch((err) => {
        console.log("An error occurred: " + err);
      });
  };

  if (!hasHid) {
    return <h1>WebHID not supported</h1>;
  }

  return (
    <div className={styles.app}>
      {hidDevice == null ? (
        <button className={styles["select-device-button"]} onClick={requestDevice}>
          Select device
        </button>
      ) : (
        <div>
          <h2>{hidDevice.productName}</h2>
          <div style={{ fontSize: "2em" }}>
            <div>{grams} g</div>
            <div>{pounds} lbs</div>
            <div>{ounces} oz</div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
