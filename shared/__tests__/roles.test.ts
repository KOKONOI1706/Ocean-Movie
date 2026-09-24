import { describe, expect, it } from 'vitest';
import { hasRole, isRole, isStaff, roleRank } from '../roles';

describe('roles', () => {
  it('orders roles so each includes the ones below it', () => {
    expect(hasRole('SUPER_ADMIN', 'ADMIN')).toBe(true);
    expect(hasRole('ADMIN', 'CURATOR')).toBe(true);
    expect(hasRole('CURATOR', 'ADMIN')).toBe(false);
    expect(hasRole('USER', 'CURATOR')).toBe(false);
    expect(hasRole('ADMIN', 'ADMIN')).toBe(true);
  });

  it('never grants anything to unknown or missing roles', () => {
    expect(roleRank('admin')).toBe(-1); // case-sensitive: stored values are upper case
    expect(hasRole('ROOT', 'USER')).toBe(false);
    expect(hasRole(undefined, 'USER')).toBe(false);
    expect(isRole('SUPER_ADMIN')).toBe(true);
    expect(isRole('ROOT')).toBe(false);
  });

  it('treats CURATOR and above as staff', () => {
    expect(['USER', 'CURATOR', 'ADMIN', 'SUPER_ADMIN'].map(isStaff)).toEqual([false, true, true, true]);
  });
});
