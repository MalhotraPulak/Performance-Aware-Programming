const registers = [
  ["al", "cl", "dl", "bl", "ah", "ch", "dh", "bh"],
  ["ax", "cx", "dx", "bx", "sp", "bp", "si", "di"],
];

const rm_maps = [
  "bx + si",
  "bx + di",
  "bp + si",
  "bp + di",
  "si",
  "di",
  "bp",
  "bx",
];

enum Instr {
  MOV = "mov",
  ADD = "add",
  SUB = "sub",
  CMP = "cmp",
}

enum Type {
  REG_OR_MEM_TO_MEM,
  IMM_TO_REG_OR_MEM,
  IMM_TO_REG,
  MEM_TO_ACC,
  ACC_TO_MEM,
  IMM_TO_ACC,
}

const getInstrAndVersion = (b1: number, b2: number) => {
  const four = b1 >> 4;
  const six = b1 >> 2;
  const seven = b1 >> 1;
  if (six === 0b100010) {
    return [Instr.MOV, Type.REG_OR_MEM_TO_MEM];
  } else if (seven === 0b1100011) {
    return [Instr.MOV, Type.IMM_TO_REG_OR_MEM];
  } else if (four === 0b1011) {
    return [Instr.MOV, Type.IMM_TO_REG];
  } else if (seven === 0b1010000) {
    return [Instr.MOV, Type.MEM_TO_ACC];
  } else if (seven === 0b1010001) {
    return [Instr.MOV, Type.ACC_TO_MEM];
  } else if (six === 0b000000) {
    return [Instr.ADD, Type.REG_OR_MEM_TO_MEM];
  } else if (six === 0b100000) {
    const fields = (b2 >> 3) & 0b111;
    if (fields === 0b000) {
      return [Instr.ADD, Type.IMM_TO_REG_OR_MEM];
    } else if (fields === 0b101) {
      return [Instr.SUB, Type.IMM_TO_REG_OR_MEM];
    } else if (fields === 0b111) {
      return [Instr.CMP, Type.IMM_TO_REG_OR_MEM];
    } else {
      throw new Error("Invalid instruction: " + b1.toString(2).padStart(8) + " " + b2.toString(2).padStart(8));
    }
  } else if (seven === 0b0000010) {
    return [Instr.ADD, Type.IMM_TO_ACC];
  } else if (six === 0b001010) {
    return [Instr.SUB, Type.REG_OR_MEM_TO_MEM];
  } else if (seven === 0b0010110) {
    return [Instr.SUB, Type.IMM_TO_ACC]
  }
  else {
    throw new Error("Invalid instruction: " + b1.toString(2).padStart(8) + " " + b2.toString(2).padStart(8));
  }

}



const decodeFile = (filename: string) => {
  const data: Uint8Array = Deno.readFileSync(filename);

  console.log("bits 16");
  // iterate two bytes at a time
  for (let i = 0; i < data.length; i += 2) {

    const [instr, instrType] = getInstrAndVersion(data[i], data[i + 1]);
    // console.log(instr, instrType)
    if (instrType === Type.REG_OR_MEM_TO_MEM) {
      // register/memory to/from register
      const d = (data[i] >> 1) & 0b1;
      const w = data[i] & 0b1;
      const mod = (data[i + 1] >> 6) & 0b11;
      const reg = (data[i + 1] >> 3) & 0b111;
      const rm = data[i + 1] & 0b111;
      const s1 = registers[w][reg];
      let s2;
      switch (mod) {
        case 0b00:
          if (rm === 0b110) {
            // direct address
            const dis = data[i + 3] << 8 | data[i + 2];
            s2 = `[${dis}]`;
            i += 2;
          } else {
            s2 = `[${rm_maps[rm]}]`;
          }
          break;
        case 0b01: {
          let dis = data[i + 2];
          if (dis >> 7 & 1) {
            dis = (~dis + 1) & 0xff;
            s2 = `[${rm_maps[rm]} - ${dis}]`;
          } else {
            s2 = `[${rm_maps[rm]} + ${dis}]`;
          }
          i += 1;
          break;
        }
        case 0b10: {
          let dis = data[i + 3] << 8 | data[i + 2];
          if (dis >> 15 & 1) {
            dis = (~dis + 1) & 0xffff;
            s2 = `[${rm_maps[rm]} - ${dis}]`;
          } else {
            s2 = `[${rm_maps[rm]} + ${dis}]`;
          }
          i += 2;
          break;
        }
        case 0b11: {
          // register to register
          s2 = registers[w][rm];
          break;
        }
        default:
          throw new Error("Invalid mod");
      }

      if (d == 0) {
        console.log(`${instr} ${s2}, ${s1}`);
      } else {
        console.log(`${instr} ${s1}, ${s2}`);
      }
    } else if (instrType === Type.IMM_TO_REG_OR_MEM) {
      // immediate to register/memory
      const s = (data[i] >> 1) & 0b1;
      const w = data[i] & 0b1;
      const mod = (data[i + 1] >> 6) & 0b11;
      const rm = data[i + 1] & 0b111;
      let s2;
      switch (mod) {
        case 0b00:
          s2 = `[${rm_maps[rm]}]`;
          break;
        case 0b01: {
          let dis = data[i + 2];
          if (dis >> 7 & 1) {
            dis = (~dis + 1) & 0xff;
            s2 = `[${rm_maps[rm]} - ${dis}]`;
          } else {
            s2 = `[${rm_maps[rm]} + ${dis}]`;
          }
          i += 1;
          break;
        }
        case 0b10: {
          let dis = data[i + 3] << 8 | data[i + 2];
          if (dis >> 15 & 1) {
            dis = (~dis + 1) & 0xffff;
            s2 = `[${rm_maps[rm]} - ${dis}]`;
          } else {
            s2 = `[${rm_maps[rm]} + ${dis}]`;
          }
          i += 2;
          break;
        }
        case 0b11: {
          // register to register
          s2 = registers[w][rm];
          break;
        }
        default:
          throw new Error("Invalid mod");
      }
      let imm = data[i + 2];
      if (s == 0 && w == 1) {
        imm = data[i + 3] << 8 | imm;
        console.log(`${instr} ${s2}, word ${imm}`);
        i += 1;
      } else {
        console.log(`${instr} ${s2}, byte ${imm}`);
      }
      i += 1;
    } else if (instrType === Type.IMM_TO_REG) {
      // immediate to register
      const w = data[i] >> 3 & 0b1;
      const reg = data[i] & 0b111;
      let imm = data[i + 1];
      if (w == 1) {
        imm = data[i + 2] << 8 | imm;
        i += 1;
      }
      console.log(`${instr} ${registers[w][reg]}, ${imm}`);
    } else if (instrType === Type.MEM_TO_ACC) {
      // memory to accumulator
      const addr = data[i + 2] << 8 | data[i + 1];
      if (data[i] & 0b1) {
        console.log(`${instr} ax, [${addr}]`);
      } else {
        console.log(`${instr} al, [${addr}]`);
      }
      i += 1;
    } else if (instrType === Type.ACC_TO_MEM) {
      const addr = data[i + 2] << 8 | data[i + 1];
      // accumulator to memory
      if (data[i] & 0b1) {
        console.log(`${instr} [${addr}], ax`);
      } else {
        console.log(`${instr} [${addr}], al`);
      }
      i += 1;
    } else if (instrType === Type.IMM_TO_ACC) {
      const w = data[i] & 0b1;
      let imm = data[i + 1];
      if (w == 1) {
        imm = data[i + 2] << 8 | imm;
        console.log(`${instr} ax, ${imm}`);
        i += 1;
      } else {
        console.log(`${instr} al, ${imm}`);
      }
    } else {
      throw new Error("Invalid opcode");
    }
  }
};

const main = () => {
  decodeFile(Deno.args[0]);
};

main();
