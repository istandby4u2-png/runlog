'use client';

import { useEffect } from 'react';

type I18nDictionary = Record<string, string>;
type I18nTranslations = Record<string, I18nDictionary>;

const translations: I18nTranslations = {
  en: {
    // Header
    'header.logout': 'Logout',

    // Home
    'home.title': 'Running Feed',

    // Courses
    'courses.title': 'Running Courses',
    'courses.newButton': 'New Course',

    // Profile
    'profile.joinedPrefix': 'Joined',
    'profile.editButton': 'Edit Profile',
    'profile.stats.records': 'Records',
    'profile.stats.courses': 'Courses',
    'profile.stats.totalKm': 'Total km',
    'profile.section.recentRecords': 'Recent Records',

    // Login
    'login.tagline': 'Running course service',
    'login.emailLabel': 'Email',
    'login.passwordLabel': 'Password',
    'login.noAccount': "Don't have an account?",
    'login.signupLink': 'Sign up',

    // Register
    'register.title': 'Sign Up',
    'register.usernameLabel': 'Username',
    'register.emailLabel': 'Email',
    'register.passwordLabel': 'Password',
    'register.passwordConfirmLabel': 'Confirm Password',
    'register.hasAccount': 'Already have an account?',
    'register.loginLink': 'Log in',
  },
  ko: {
    // Header
    'header.logout': '로그아웃',

    // Home
    'home.title': '러닝 피드',

    // Courses
    'courses.title': '러닝 코스',
    'courses.newButton': '새 코스',

    // Profile
    'profile.joinedPrefix': '가입일',
    'profile.editButton': '프로필 수정',
    'profile.stats.records': '기록',
    'profile.stats.courses': '코스',
    'profile.stats.totalKm': '총 km',
    'profile.section.recentRecords': '최근 기록',

    // Login
    'login.tagline': '러닝코스 서비스',
    'login.emailLabel': '이메일',
    'login.passwordLabel': '비밀번호',
    'login.noAccount': '계정이 없으신가요?',
    'login.signupLink': '회원가입',

    // Register
    'register.title': '회원가입',
    'register.usernameLabel': '사용자 이름',
    'register.emailLabel': '이메일',
    'register.passwordLabel': '비밀번호',
    'register.passwordConfirmLabel': '비밀번호 확인',
    'register.hasAccount': '이미 계정이 있으신가요?',
    'register.loginLink': '로그인',
  },
};

function detectLanguage(): 'ko' | 'en' {
  if (typeof window === 'undefined') {
    return 'ko';
  }

  const lang = (navigator.language || (navigator as any).userLanguage || 'ko').toLowerCase();

  if (lang.startsWith('ko')) return 'ko';
  if (lang.startsWith('en')) return 'en';

  // 지원하지 않는 언어는 기본값(ko) 사용
  return 'ko';
}

function applyTranslations(lang: 'ko' | 'en') {
  // 한국어는 기본 렌더링 텍스트가 이미 들어가 있으므로 별도 변환 불필요
  if (lang === 'ko') return;

  const dict = translations[lang];
  if (!dict) return;

  const elements = document.querySelectorAll<HTMLElement>('[data-i18n]');

  elements.forEach((el) => {
    const key = el.dataset.i18n;
    if (!key) return;

    const text = dict[key];
    if (!text) return;

    el.textContent = text;
  });
}

export function I18nClient() {
  useEffect(() => {
    const lang = detectLanguage();
    applyTranslations(lang);
  }, []);

  return null;
}

