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
const spotty = process.argv[2] == "spotty"

let packetsRead = 0;
let packetsSent = 0;

console.log(`Sending ${INPUT_FILE} to port ${RECEIVER_PORT} as RTP`);

const interval = setInterval(() => {
  const start = packetsRead * BYTES_PER_PACKET;
  const end = (packetsRead + 1) * BYTES_PER_PACKET;
  const loss = false; //spotty ? Math.random() <= packetLossProb : false;
  const dupl = spotty ? Math.random() <= packetDuplicationProb : false;
  
  if (loss) {
    console.log("loss");
    packetsRead++;
    packetsSent++;
  }
  else {
    

    const packet = new RTPPacket();
    packet.ssrc = ssrc;
    packet.timestamp = initialTimestamp + end;
    packet.sequenceNumber = initialSequenceNumber + packetsRead;
    packet.payload = data.slice(start, end);
    packetsRead++;

    let timeout = Math.floor(Math.random() * MAX_DELAY_MILLIS);

    if (dupl) {
      console.log(packet.sequenceNumber)
      let timeout2 = Math.floor(Math.random() * MAX_DELAY_MILLIS);
      if (timeout2 > timeout) {
        [timeout, timeout2] = [timeout2, timeout]
      }
      setTimeout(() => {
        client.send(packet.data, RECEIVER_PORT, "localhost", (error) => {
          if (error) {
            console.error(error);
            process.exit(1);
          }
        })
      }, timeout2);
    }

    setTimeout(() => {
      client.send(packet.data, RECEIVER_PORT, "localhost", (error) => {
        if (error) {
          console.error(error);
          process.exit(1);
        }

        packetsSent++;
        if (packetsSent === numTotalPackets) {
          //console.log(`${packet.sequenceNumber}, ${packetsRead}, ${packetsSent}`)
          console.log(`Last packet sent`);
          console.log(`size ${packet.payload.length}`)
          client.close();
        }

      })
    }, timeout);
  }

  if (end >= data.length) {
    clearInterval(interval);
  }
}, MILLIS_PER_PACKET);
