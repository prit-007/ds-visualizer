import { encodeScenario, decodeScenario, readScenario } from './share';

describe('encodeScenario / decodeScenario', () => {
  test('roundtrips an array scenario', () => {
    const scenario = { v: 1, structure: 'array', values: [10, 20, 30] };
    expect(decodeScenario(encodeScenario(scenario))).toEqual(scenario);
  });

  test('produces a url-safe token (no +, / or =)', () => {
    const token = encodeScenario({ v: 1, structure: 'tree', values: [50, 25, 75, 12, 37] });
    expect(token).not.toMatch(/[+/=]/);
  });

  test('corrupt or empty tokens decode to null', () => {
    expect(decodeScenario('')).toBeNull();
    expect(decodeScenario('%%%not-base64%%%')).toBeNull();
    expect(decodeScenario('AAAA')).toBeNull(); // valid base64 of garbage that is not JSON
  });

  test('non-object payloads decode to null', () => {
    expect(decodeScenario(encodeScenario(42))).toBeNull();
    expect(decodeScenario(encodeScenario(null))).toBeNull();
    expect(decodeScenario(encodeScenario('plain string'))).toBeNull();
  });
});

describe('readScenario', () => {
  test('parses the token out of a hash string', () => {
    const scenario = { v: 1, structure: 'linked-list', values: [1, 2, 3] };
    const hash = `#s=${encodeScenario(scenario)}`;
    expect(readScenario(hash)).toEqual(scenario);
  });

  test('returns null without an s= token or on garbage', () => {
    expect(readScenario('')).toBeNull();
    expect(readScenario('#other=x')).toBeNull();
    expect(readScenario('#s=garbage!!')).toBeNull();
  });
});
