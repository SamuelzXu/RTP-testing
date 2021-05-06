import { privateEncrypt } from "crypto";
import dgram from "dgram";
import fs from "fs";
import path from "path";

import { RTPPacket } from "./rtp-packet";

const INPUT_FILE = path.resolve(__dirname, "../data/input2.ulaw");
const RECEIVER_PORT = 3456;
const BYTES_PER_PACKET = 160;
const MILLIS_PER_PACKET = 20;
const MAX_DELAY_MILLIS = 60;

const data = fs.readFileSync(INPUT_FILE);
const numTotalPackets = Math.ceil(data.length / BYTES_PER_PACKET);
const ssrc = Math.floor(Math.random() * Math.pow(2, 32));
const initialTimestamp = Math.floor(Math.random() * 1000);
const initialSequenceNumber = Math.floor(Math.random() * 1000);
// expect approximately 10 duplicated packets in 53KB (input.ulaw size): 0.03*53000/160 = 10 + something small
const packetDuplicationProb = 0.03; 
const packetLossProb = 0.03;

const client = dgram.createSocket("udp4");

let packetsRead = 0;
let packetsSent = 0;

console.log(`Sending ${INPUT_FILE} to port ${RECEIVER_PORT} as RTP`);

const interval = setInterval(() => {
  const start = packetsRead * BYTES_PER_PACKET;
  const end = (packetsRead + 1) * BYTES_PER_PACKET;

  // packet los and packet duplication are mutually exclusive
  if (Math.random() <= packetLossProb) {
    packetsRead++;
    packetsSent++;
  } 
  else if (Math.random() > packetDuplicationProb){
    packetsRead++;
  } 
  else {
    packetsSent--;
  }

  const packet = new RTPPacket();
  packet.ssrc = ssrc;
  packet.timestamp = initialTimestamp + end;
  packet.sequenceNumber = initialSequenceNumber + packetsRead;
  packet.payload = data.slice(start, end);

  const timeout = Math.floor(Math.random() * MAX_DELAY_MILLIS);

  setTimeout(() => {
    client.send(packet.data, RECEIVER_PORT, "localhost", (error) => {
      if (error) {
        console.error(error);
        process.exit(1);
      }

      packetsSent++;

      if (packetsSent === numTotalPackets) {
        console.log(`Last packet sent`);
        console.log(`size ${packet.payload.length}`)
        client.close();
      }
    });
  }, timeout);

  if (end >= data.length) {
    clearInterval(interval);
  }
}, MILLIS_PER_PACKET);
