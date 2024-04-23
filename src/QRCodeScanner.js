import React, { useState } from "react";
import { QRScanner } from "react-qr-scanner";

const QRCodeScanner = () => {
  const [stamps, setStamps] = useState([]);
  const [scanResult, setScanResult] = useState("");

  const handleScan = (data) => {
    if (data) {
      setScanResult(data);
      if (stamps.length < 5 && !stamps.includes(data)) {
        setStamps([...stamps, data]);
      }
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <div>
      <QRScanner
        delay={300}
        onError={handleError}
        onScan={handleScan}
        style={{ width: "100%" }}
      />
      <p>Scanned Result: {scanResult}</p>
      <p>Stamps: {stamps.join(", ")}</p>
    </div>
  );
};

export default QRCodeScanner;
