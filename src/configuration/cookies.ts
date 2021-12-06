/**
 * Yum Yum yum ... 🍪😋
 */
import { CookieOptions } from 'express';
import { config } from './environment';

export enum Cookie {
  AUTH = "sbs-authentication",
}

export const cookieDefaultSettings: CookieOptions = {
  // Do not define "expires", because all are session cookies
  httpOnly: true,
  secure: false,
  domain: config.rp.id,
  sameSite: 'strict',
  path: '/',
};
