function fail(message, status = 400) {
  const error = new Error(message); error.status = status; throw error;
}
function text(value, label, min, max) {
  if (typeof value !== 'string') fail(`${label} must be text.`);
  const result = value.trim();
  if (result.length < min || result.length > max) fail(`${label} must be ${min}–${max} characters.`);
  return result;
}
function choice(value, options, label) {
  if (!options.includes(value)) fail(`Choose a valid ${label}.`);
  return value;
}
function email(value) {
  const result = text(value, 'Email', 5, 160).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result)) fail('Enter a valid email address.');
  return result;
}
function password(value) {
  if (typeof value !== 'string' || value.length < 10 || value.length > 128)
    fail('Password must be 10–128 characters.');
  return value; // Do not trim passwords.
}
function photo(data) {
  if (data === undefined || data === null || data === '') return null;
  if (typeof data !== 'string') fail('Invalid photo.');
  const match = data.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) fail('Photo must be a JPEG, PNG or WebP image.');
  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length < 12 || buffer.length > 2 * 1024 * 1024) fail('Photo must be no larger than 2 MB.');
  const mime = match[1];
  const valid = mime === 'image/jpeg' ? buffer[0] === 255 && buffer[1] === 216 && buffer[2] === 255
    : mime === 'image/png' ? buffer.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10]))
    : buffer.toString('ascii',0,4) === 'RIFF' && buffer.toString('ascii',8,12) === 'WEBP';
  if (!valid) fail('Photo contents do not match the image format.');
  return { buffer, mime };
}
module.exports = { fail, text, choice, email, password, photo };
