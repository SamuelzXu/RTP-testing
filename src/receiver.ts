import { privateEncrypt } from "crypto";
import dgram from "dgram";
import fs from "fs";
import { FileHandle } from "fs/promises";
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
  public packets: RTPPacket[] = [];
  private fdPromise : Promise<FileHandle>;
  private fileIdx = 0;
  private maxSize = 8;

  constructor(file: string) {
      this.fdPromise = fs.promises.open(file,'w+');
      this.packets = []
  }

  public push(packet: RTPPacket) {
    //console.log(`${this.packets.push(packet)}, ${packet.sequenceNumber}`);
    this.packets.push(packet);
    if (this.packets.length === this.maxSize) {
      this.dump();
    }
  }

  public dump() {
    this.packets.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    let data = Buffer.concat(this.packets.map((p) => p.payload));
    this.fdPromise.then((fd) => {
      fd.write(data,0,data.length,this.fileIdx);
      this.fileIdx += data.length;
    });
    this.packets = [];
  }
}

//let ct = 0;
let asmblr = new Assembler(OUTPUT_FILE_2);
//const fdpromise = fs.promises.open(OUTPUT_FILE_2,'w+')
let maxseq = 0;

server.on("message", (msg) => {
  const packet = new RTPPacket(msg);
  asmblr.push(packet);
  //packets.push(packet);
  
  // fdpromise.then((fd) => {
  //   const pl = packet.payload.length;
  //   const seqn = packet.sequenceNumber;
  //   maxseq = seqn > maxseq ? seqn : maxseq;
  //   if (pl != 160) {
  //     console.log("phi")
  //     console.log(pl);
  //     console.log(seqn);
  //   }
  //   fd.write(packet.payload,0,pl,ct*pl);
  //   ct++;
  // });

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

    asmblr.dump();
    // packets.sort((a, b) => a.sequenceNumber - b.sequenceNumber);
    // const data = Buffer.concat(packets.map((p) => p.payload));
    // fs.writeFileSync(OUTPUT_FILE, data);
    //console.log(`Captured data written to ${OUTPUT_FILE}`);
    
    // fdpromise.then((fd) => {
    //   fd.close();
    // });
    //console.log(`Maximum sequence number: ${maxseq}`);
  }, NO_MORE_PACKETS_TIMEOUT_MILLIS);
});

server.bind(RECEIVER_PORT, () => {
  console.log(`Listening on port ${RECEIVER_PORT}`);
});