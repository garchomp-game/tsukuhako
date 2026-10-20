// POSIX cksum CRC, including the little-endian byte length suffix.
// Keeps existing Docker identities identical on Linux and macOS without a CLI.
export function posixCksum(input) {
  const bytes = Buffer.from(input);
  let crc = 0;
  function byte(value) {
    crc = (crc ^ (value << 24)) >>> 0;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ (crc & 0x80000000 ? 0x04c11db7 : 0)) >>> 0;
  }
  for (const value of bytes) byte(value);
  for (let length = bytes.length; length; length = Math.floor(length / 256)) byte(length & 255);
  return String((~crc) >>> 0);
}
