import { RTPPacket } from "./rtp-packet";
import dgram from "dgram";
import fs from "fs";
import path from "path";

export class Assembler {
    public holeDescriptorList: Array<Boolean>;  

    constructor() {
        this.holeDescriptorList = []
    }

    insert(packet: RTPPacket) {
        if (this.holeDescriptorList.length < packet.sequenceNumber) {
            
        }
    }
}