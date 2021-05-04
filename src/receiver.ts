import { privateEncrypt } from "crypto";
import dgram from "dgram";
import fs from "fs";
import path from "path";

import { RTPPacket } from "./rtp-packet";

const OUTPUT_FILE = path.resolve(__dirname, "../data/output.ulaw");
const RECEIVER_PORT = 3456;
const NO_MORE_PACKETS_TIMEOUT_MILLIS = 100;

const packets: RTPPacket[] = [];
let finalTimeout: NodeJS.Timeout | undefined;
let OUTPUT_FILE_2 = path.resolve(__dirname, "../data/output2.ulaw");

const server = dgram.createSocket("udp4");

class Assembler {
  public holeDescriptorList: Array<Boolean>;  

  constructor() {
      this.holeDescriptorList = []
  }

  insert(packet: RTPPacket) {
    if (this.holeDescriptorList.length < packet.sequenceNumber) {
      
    }
  }
}

// try {
//   fd = fs.openSync()
// } catch (err) {
//   console.error(err);
// }

let ct = 0;
let asmblr = new Assembler();

server.on("message", (msg) => {
  const packet = new RTPPacket(msg);

  // packets.push(packet);
  fs.promises.open(OUTPUT_FILE_2,'w+')
  .then((fd) => {
    if (ct === 0)
      console.log(packet.payload);
    fd.write(packet.payload,0,0,ct);
    ct++;
    fd.close();
  });

  if (finalTimeout) {
    clearTimeout(finalTimeout);
  } else {
    console.log("Received first packet");
  }

  finalTimeout = setTimeout(() => {
    console.log(
      `Received no packets in ${NO_MORE_PACKETS_TIMEOUT_MILLIS}ms; finishing`
    );
    server.close();

    // packets.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    // const data = Buffer.concat(packets.map((p) => p.payload));
    // fs.writeFileSync(OUTPUT_FILE, data);

    console.log(`Captured data written to ${OUTPUT_FILE}`);
  }, NO_MORE_PACKETS_TIMEOUT_MILLIS);
});

server.bind(RECEIVER_PORT, () => {
  console.log(`Listening on port ${RECEIVER_PORT}`);
});