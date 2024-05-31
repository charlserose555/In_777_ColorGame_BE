import * as crypto from 'crypto';
import { Types } from 'mongoose';
import { ENCRYPTION } from '../config';

export const numberFix = (number: number, decimal = 10): number => {
  return Number(Number(number).toFixed(decimal));
};

export const objectId = (id: string): Types.ObjectId => {
  return new Types.ObjectId(id);
};

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(ENCRYPTION.ivLength);
  const cipher = crypto.createCipheriv(
    'aes-256-cbc',
    Buffer.from(ENCRYPTION.key),
    iv
  );
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + '::' + encrypted.toString('hex');
};

export const decrypt = (text: string): string => {
  try {
    const textParts = text.split('::');
    const iv = Buffer.from(textParts.shift() || '', 'hex');
    const encryptedText = Buffer.from(textParts.join('::'), 'hex');
    const decipher = crypto.createDecipheriv(
      'aes-256-cbc',
      Buffer.from(ENCRYPTION.key),
      iv
    );
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return '';
  }
};

export const getSecondsElapsedToday = (timeInterval: any) => {
  const now: any = new Date();
  const startOfDay: any = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const secondsElapsed = Math.floor((now - startOfDay) / 1000);
  return timeInterval - secondsElapsed % timeInterval;
};

export const getTodayGameId = (timeInterval: any) : String => {
  const now: any = new Date();
  const startOfDay: any = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const secondsElapsed: Number = Math.floor((now - startOfDay) / 1000);
  const result = Math.floor(Number(secondsElapsed) / timeInterval)
  console.log("secondsElapsed", secondsElapsed)
  console.log("result", result)

  let formatResult;

  if(timeInterval == 60) {
    if(result < 10) {
      formatResult = "000" + String(result);
    } else if(result < 100) {
      formatResult = "00" + String(result);
    } else if(result < 1000) {
      formatResult = "0" + String(result);
    } else {
      formatResult = String(result);
    }
  } else {
    if(result < 10) {
      formatResult = "00" + String(result);
    } else if(result < 100) {
      formatResult = "0" + String(result);
    } else {
      formatResult = String(result);
    }
  }

  return formatResult;
};

export const getCurrentTodayInfo = () => {
  const currentDate = new Date();
  const formattedDate = currentDate.toISOString().slice(0, 10).replace(/-/g, '');

  return formattedDate;
}