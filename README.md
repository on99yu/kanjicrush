# KanjiCrush App

JLPT N2 수준의 일본어 단어를 카드와 퀴즈로 학습하는 Expo/React Native 앱입니다. 서버에서 단어장을 내려받아 SQLite에 저장하고, 학습 기록은 기기에 보관합니다.

## 요구 환경

- Node.js 22 LTS (`nvm use`로 `.nvmrc` 적용)
- npm
- 실제 기기에서는 Expo Go
- iOS Simulator는 macOS와 Xcode
- Android Emulator는 Android Studio

## 실행

```bash
npm ci
npm start
```

Expo 터미널에서 `a`는 Android, `i`는 iOS, `w`는 웹을 실행합니다. 실제 휴대폰은 같은 네트워크에서 Expo Go로 QR 코드를 스캔합니다.

명령을 직접 실행할 수도 있습니다.

```bash
npm run android
npm run ios
npm run web
```

처음 실행한 기기에는 단어가 없습니다. 홈의 `단어장 관리`에서 `단어 업데이트`를 실행하면 서버의 단어장이 로컬 SQLite에 저장됩니다.

## API 설정

기본 API는 운영 서버를 사용합니다. 다른 서버로 연결하려면 `.env.example`을 `.env.local`로 복사하고 `EXPO_PUBLIC_API_URL`을 변경합니다.

웹에서 별도 origin의 API에 연결하려면 서버 CORS 설정이 추가로 필요합니다. Android/iOS 네이티브 앱에는 브라우저 CORS 제한이 적용되지 않습니다.

## 검증

```bash
npm run typecheck
npm run doctor
npx expo export --platform web
```

## EAS

`eas.json`에는 development, preview, production 빌드 프로필이 설정되어 있습니다. Expo 계정 로그인 후 다음 명령으로 기존 빌드를 확인할 수 있습니다.

```bash
npx eas-cli@latest login
npx eas-cli@latest build:list
```
