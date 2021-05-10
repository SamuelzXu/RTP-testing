import { privateEncrypt } from "crypto";
import dgram from "dgram";
import fs, { close } from "fs";
import { FileHandle } from "fs/promises";
import path from "path";

import { RTPPacket } from "./rtp-packet";

const OUTPUT_FILE = path.resolve(__dirname, "../data/output.ulaw");
const RECEIVER_PORT = 3456;
const NO_MORE_PACKETS_TIMEOUT_MILLIS = 200;

let finalTimeout: NodeJS.Timeout | undefined;
let OUTPUT_FILE_2 = path.resolve(__dirname, "../data/output2.ulaw");

const server = dgram.createSocket("udp4");

class Assembler {
  public packets: RTPPacket[] = [];
  private fdPromise : Promise<FileHandle>;
  private fileIdx = 0;
  private maxSize = 12;

  constructor(file: string) {
      this.fdPromise = fs.promises.open(file,'w+');
      this.packets = []
  }

  public push(packet: RTPPacket) {
    this.packets.push(packet);
    // only write to file when the buffer is full
    if (this.packets.length === this.maxSize) {
      this.offload();
    }
  }

  public offload() {
    // we order the packets,  remove the duplicate packets,
    // write and remove the consecutive packets, 
    // and keep the rest in buffer.
    // Notify of lost packets.

    this.cleanup();
    let conseqPackets = this.packets.filter((p,i) => i <= 4 ? true : false );
    let data = Buffer.concat(conseqPackets.map((p) => p.payload));
    this.packets = this.packets.filter((p,i) => i <= 4 ? false : true );

    this.packets.slice(0,Math.min(6,this.packets.length))
    .forEach((p,i,ary) => {
      let s = p.sequenceNumber - 1;
      let t = i == 0 ? s : ary[i - 1].sequenceNumber;
      for (let i=s; i>t; i--) {
        console.log(`Lost packet #${i}`)
      }
    });

    // write asynchronously to file
    this.fdPromise.then((fd) => {
      fd.write(data,0,data.length,this.fileIdx);
      this.fileIdx += data.length;
    });
  }  

  public dump() {
    // dumps and closes the file.
    this.cleanup();
    let data = Buffer.concat(this.packets.map((p) => p.payload));
    this.fdPromise.then((fd) => {
      fd.write(data,0,data.length,this.fileIdx);
      fd.close();
    });
  }

  private cleanup() {
    // removes duplicates and sorts the packets in sequenceNumber
    this.packets = this.packets
    .sort((a, b) => a.sequenceNumber - b.sequenceNumber)
    .filter((item, pos, ary) => 
      !pos || item.sequenceNumber != ary[pos-1].sequenceNumber 
    );
  }
}

let asmblr = new Assembler(OUTPUT_FILE_2);

server.on("message", (msg) => {
  const packet = new RTPPacket(msg);
  asmblr.push(packet);

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
  }, NO_MORE_PACKETS_TIMEOUT_MILLIS);
});

server.bind(RECEIVER_PORT, () => {
  console.log(`Listening on port ${RECEIVER_PORT}`);
});