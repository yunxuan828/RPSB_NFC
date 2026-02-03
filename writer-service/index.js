#!/usr/bin/env node
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { NFC } = require("nfc-pcsc");
const Ndef = require("@taptrack/ndef");

const PORT = process.env.PORT || 8787;
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:8600",
  "http://127.0.0.1:8600",
  "https://dbc.imritma.com"
];
const PREFERRED_READER = /(ACR|ACS|NFC)/i;
const BLOCKED_READER = /(Windows Hello)/i;

let currentReader = null;
let cardPresent = false;
let lastCard = null;
let lastError = null;

// Build NDEF TLV for Type 2 tags
const buildType2Tlv = (ndefBytes) => {
  const len = ndefBytes.length;
  let tlv;
  if (len <= 0xFE) {
    tlv = Buffer.from([0x03, len, ...ndefBytes, 0xFE]);
  } else {
    tlv = Buffer.from([0x03, 0xFF, (len >> 8) & 0xff, len & 0xff, ...ndefBytes, 0xFE]);
  }
  // Pad to 4-byte boundary for page writes
  const pad = tlv.length % 4 === 0 ? 0 : 4 - (tlv.length % 4);
  if (pad) tlv = Buffer.concat([tlv, Buffer.alloc(pad, 0x00)]);
  return tlv;
};

const encodeNdefUrl = (url) => {
  const record = Ndef.Utils.createUriRecord(url);
  const message = new Ndef.Message([record]);
  return message.toByteArray();
};

const chunk = (arr, size) =>
  arr.reduce((acc, _, i) => (i % size === 0 ? [...acc, arr.slice(i, i + size)] : acc), []);

const expectSwOk = (resp, context = "APDU") => {
  if (!(resp[0] === 0x90 && resp[1] === 0x00)) {
    throw new Error(`${context} failed: ${resp.toString("hex")}`);
  }
};

// NTAG/Ultralight (Type 2) writer
const writeType2 = async (reader, ndefBytes) => {
  console.log("Writing Type 2 / NTAG...");
  const tlv = buildType2Tlv(Buffer.from(ndefBytes));
  const blocks = chunk(Array.from(tlv), 4);
  for (let i = 0; i < blocks.length; i++) {
    const data = blocks[i];
    while (data.length < 4) data.push(0x00);
    const blockNumber = 4 + i; // Start after lock bits/CC
    const apdu = Buffer.from([0xff, 0xd6, 0x00, blockNumber, 0x04, ...data]);
    const response = await reader.transmit(apdu, 2);
    expectSwOk(response, `WRITE block ${blockNumber}`);
  }
  console.log("Type 2 write completed.");
};

// Type 4 / ISO 14443-4 NDEF writer (common for DESFire EV1 NDEF, generic Type 4)
const writeType4 = async (reader, bytes) => {
  console.log("Attempting Type 4 / ISO 14443-4 NDEF write...");

  // Select NDEF Tag Application AID: D2760000850101
  const selectApp = Buffer.from([
    0x00, 0xA4, 0x04, 0x00, 0x07,
    0xD2, 0x76, 0x00, 0x00, 0x85, 0x01, 0x01,
    0x00
  ]);
  expectSwOk(await reader.transmit(selectApp, 2), "SELECT NDEF App");

  // Select CC file (E103)
  const selectCc = Buffer.from([0x00, 0xA4, 0x00, 0x0C, 0x02, 0xE1, 0x03]);
  expectSwOk(await reader.transmit(selectCc, 2), "SELECT CC");

  // Read CC (first 15 bytes)
  const readCc = Buffer.from([0x00, 0xB0, 0x00, 0x00, 0x0F]);
  const ccResp = await reader.transmit(readCc, 0x12); // enough for data + SW
  expectSwOk(ccResp.slice(-2), "READ CC");
  const cc = ccResp.slice(0, ccResp.length - 2);

  // Parse CC for NDEF file control TLV (T=0x04, L>=6)
  let offset = 7; // skip 7 bytes header (len, version, MLe, MLc)
  let ndefFileId = null;
  let maxSize = null;
  while (offset + 2 <= cc.length) {
    const t = cc[offset];
    const l = cc[offset + 1];
    if (offset + 2 + l > cc.length) break;
    if (t === 0x04 && l >= 6) {
      ndefFileId = (cc[offset + 2] << 8) | cc[offset + 3];
      maxSize = (cc[offset + 4] << 8) | cc[offset + 5];
      break;
    }
    offset += 2 + l;
  }
  if (!ndefFileId || !maxSize) {
    throw new Error("NDEF file info not found in CC file");
  }

  // Select NDEF file
  const selectFile = Buffer.from([0x00, 0xA4, 0x00, 0x0C, 0x02, (ndefFileId >> 8) & 0xff, ndefFileId & 0xff]);
  expectSwOk(await reader.transmit(selectFile, 2), "SELECT NDEF file");

  const payload = Buffer.from(bytes);
  const totalLen = payload.length;
  if (totalLen + 2 > maxSize) {
    throw new Error(`NDEF payload too large for file (max ${maxSize} bytes)`);
  }

  // Write NLEN + payload
  const full = Buffer.concat([Buffer.from([(totalLen >> 8) & 0xff, totalLen & 0xff]), payload]);
  const chunks = chunk(Array.from(full), 0xf0); // keep chunks <= 0xF0
  let writeOffset = 0;
  for (const part of chunks) {
    const len = part.length;
    const apdu = Buffer.from([0x00, 0xD6, (writeOffset >> 8) & 0xff, writeOffset & 0xff, len, ...part]);
    const resp = await reader.transmit(apdu, 2);
    expectSwOk(resp, `UPDATE BINARY @${writeOffset}`);
    writeOffset += len;
  }

  console.log("Type 4 write completed.");
};

// Read back a chunk for verification (Type 2)
const readType2Chunk = async (reader, startBlock = 4, blockCount = 8) => {
  const pages = [];
  for (let i = 0; i < blockCount; i++) {
    const block = startBlock + i;
    const apdu = Buffer.from([0xff, 0xb0, 0x00, block, 0x04]);
    const resp = await reader.transmit(apdu, 6); // 4 data + SW1 SW2
    expectSwOk(resp.slice(-2), `READ block ${block}`);
    pages.push(...resp.slice(0, resp.length - 2));
  }
  return Buffer.from(pages);
};

const app = express();
app.use(cors({ origin: ALLOWED_ORIGINS, credentials: true }));
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Private-Network", "true");
  next();
});
app.use(bodyParser.json());

app.get("/status", (_req, res) => {
  res.json({
    reader: currentReader ? currentReader.name : null,
    cardPresent,
    cardType: lastCard?.type || null,
    cardUid: lastCard?.uid || null,
    error: lastError
  });
});

app.post("/write", async (req, res) => {
  if (!currentReader) return res.status(503).json({ error: "No reader connected" });
  if (!cardPresent) return res.status(409).json({ error: "No card present" });

  const { url } = req.body || {};
  if (!url) return res.status(400).json({ error: "Missing url" });

  try {
    // Normalize URL (avoid duplicate protocol)
    const normalizedUrl = url.replace(/^https?:\/\/https?:\/\//i, (m) => m.replace(/https?:\/\//i, ''));
    const bytes = encodeNdefUrl(normalizedUrl);
    console.log(`Write requested for URL: ${url}, cardType=${lastCard?.type}`);

    if (lastCard?.type === "TAG_ISO_14443_4") {
      await writeType4(currentReader, bytes);
    } else {
      await writeType2(currentReader, bytes);
      // Simple read-back verification of first pages written
      const verify = await readType2Chunk(currentReader, 4, 4);
      console.log("Verify (first 16 bytes):", verify.toString("hex"));
    }

    console.log("Write completed successfully.");
    res.json({ ok: true });
  } catch (err) {
    console.error("Write failed:", err);
    res.status(500).json({ error: err.message || String(err) });
  }
});

const nfc = new NFC();
nfc.on("reader", reader => {
  if (BLOCKED_READER.test(reader.name)) {
    console.log(`Ignoring reader: ${reader.name}`);
    return;
  }

  // Prefer ACS/ACR readers; keep existing preferred reader if already set.
  if (!currentReader) {
    currentReader = reader;
  } else if (PREFERRED_READER.test(reader.name) && !PREFERRED_READER.test(currentReader.name)) {
    currentReader = reader;
  }

  // Attach error handler ASAP
  reader.on("error", err => {
    const msg = err?.message || String(err);
    if (msg.includes("Cannot process ISO 14443-4 tag because AID was not set")) {
      lastError = "Unsupported tag type (ISO 14443-4). Use NTAG/Ultralight.";
      console.warn(lastError);
      return;
    }
    lastError = msg;
    console.error("Reader error:", err);
  });

  reader.autoProcessing = false; // avoid ISO14443-4 auto AID errors
  console.log(`Reader connected: ${reader.name} ${currentReader === reader ? "(active)" : "(standby)"}`);

  reader.on("card", card => {
    console.log("Card detected:", card.uid, card.type);
    cardPresent = true;
    lastCard = { uid: card.uid, atr: card.atr, type: card.type };
    lastError = null;

    // Ignore ISO 14443-4 / DESFire-style tags for this simple Type 2 writer
    if (card.type === "TAG_ISO_14443_4") {
      console.warn("Unsupported tag type (ISO 14443-4). Use NTAG/Ultralight Type 2 tags.");
    }
  });

  reader.on("card.off", () => {
    cardPresent = false;
    lastCard = null;
    lastError = null;
    console.log("Card removed");
  });
  reader.on("end", () => {
    console.log("Reader removed");
    if (currentReader === reader) currentReader = null;
    cardPresent = false;
    lastCard = null;
  });
});

nfc.on("error", err => console.error("NFC error:", err));

// Prevent hard crash on unhandled exceptions
process.on("uncaughtException", err => {
  const msg = err?.message || String(err);
  if (msg.includes("Cannot process ISO 14443-4 tag because AID was not set")) {
    lastError = "Unsupported tag type (ISO 14443-4). Use NTAG/Ultralight.";
    console.warn(lastError);
    return;
  }
  console.error("Uncaught exception:", err);
});

app.listen(PORT, () => {
  console.log(`Writer service listening on http://127.0.0.1:${PORT}`);
});
