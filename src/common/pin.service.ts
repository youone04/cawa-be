import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class PinService {
  generatePin(length: number = 6): string {
    // Menghasilkan string hex acak dengan panjang tertentu, lalu memotong sesuai panjang yang diinginkan
    return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, 6).toUpperCase();
  }
}
