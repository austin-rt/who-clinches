import { isDarkHexColor } from '@/lib/utils';

describe('isDarkHexColor', () => {
  it('classifies dark team colors as dark', () => {
    expect(isDarkHexColor('9e1b32')).toBe(true);
    expect(isDarkHexColor('#13294b')).toBe(true);
    expect(isDarkHexColor('000000')).toBe(true);
  });

  it('classifies light team colors as light', () => {
    expect(isDarkHexColor('ff8200')).toBe(false);
    expect(isDarkHexColor('#ffffff')).toBe(false);
    expect(isDarkHexColor('ffd046')).toBe(false);
  });

  it('expands three-digit hex', () => {
    expect(isDarkHexColor('#fff')).toBe(false);
    expect(isDarkHexColor('000')).toBe(true);
  });

  it('treats invalid input as dark so text falls back to a light token', () => {
    expect(isDarkHexColor('not-a-color')).toBe(true);
  });
});
