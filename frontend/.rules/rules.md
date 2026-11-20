# UAV Telemetry Dashboard - Proje Kuralları

## Genel Kurallar

- Bu proje bir **UAV (drone) telemetri izleme paneli**dir. Tüm geliştirmeler havacılık ve drone izleme bağlamında yapılmalıdır.
- Dil: TypeScript (strict mode). JavaScript dosyası eklenmez.
- Framework: React 19 + Vite 7 + Tailwind CSS 4.
- State yönetimi: Zustand. Redux, Context API veya başka bir state kütüphanesi kullanılmaz.
- Animasyonlar: Framer Motion. CSS animation tercih edilmez.
- Harita: Leaflet + React-Leaflet. Başka harita kütüphanesi eklenmez.
- Grafikler: Recharts. Başka grafik kütüphanesi eklenmez.

## Dosya ve Klasör Yapısı

```
src/
├── components/    # UI bileşenleri, her alt klasör bir alan (map, gauges, charts...)
├── hooks/         # Custom React hook'ları (use* prefix zorunlu)
├── simulation/    # Telemetri simülasyon motoru ve veri üretimi
├── store/         # Zustand store dosyaları
├── types/         # TypeScript tip tanımları
├── utils/         # Yardımcı fonksiyonlar ve sabitler
├── styles/        # Global CSS dosyaları
├── App.tsx        # Root bileşen
└── main.tsx       # Uygulama giriş noktası
```

### Dosya Adlandırma Kuralları

- Bileşenler: **PascalCase** (`AltitudeGauge.tsx`)
- Hook'lar: **camelCase** ve `use` prefix (`useTelemetry.ts`)
- Utility/yardımcı: **camelCase** (`formatters.ts`)
- Tip dosyaları: **camelCase** (`telemetry.ts`)
- Her bileşen kendi klasöründe olmalı (domain bazlı: `map/`, `gauges/`, `alerts/` vb.)

## Kodlama Standartları

### TypeScript

- `any` tipi kesinlikle kullanılmaz. Gerekirse `unknown` kullanılır.
- Tüm bileşen prop'ları için interface tanımlanır.
- Enum yerine `as const` objeler veya union type tercih edilir.
- Tip tanımları `src/types/` altında tutulur, bileşen dosyalarında inline tanım yapılmaz.

### React Bileşenleri

- Fonksiyonel bileşenler kullanılır. Class component yasaktır.
- Pahalı hesaplamalar `React.memo`, `useMemo`, `useCallback` ile optimize edilir.
- Bileşenler küçük ve tek sorumluluk ilkesine uygun tutulur.
- Props drilling yerine Zustand store kullanılır (max 2 seviye prop geçişi kabul edilir).
- Side effect'ler custom hook'lara taşınır, bileşen içinde doğrudan `setInterval`/`setTimeout` kullanılmaz.

### Stil ve Tasarım

- Tailwind CSS utility class'ları kullanılır. Inline style yasaktır (canvas hariç).
- Renk paleti:
  - Primary: `#00e5ff` (Cyan - gösterge rengi)
  - Background: `#0a0e17` (Koyu lacivert)
  - Panel: `#111827` (Koyu gri)
  - Success: `#22c55e` (Yeşil)
  - Warning: `#f59e0b` (Turuncu)
  - Critical: `#ef4444` (Kırmızı)
- Karanlık tema sabittir, açık tema desteği yoktur.
- Glassmorphism efekti (`backdrop-blur`) panel kartlarında kullanılır.
- Font: Monospace (havacılık teması).

## Performans Kuralları

- Telemetri güncelleme hızı: **500ms** (2Hz). Daha sık güncelleme yapılmaz.
- Uçuş geçmişi buffer'ı: max **200 nokta**. Aşıldığında eski veriler silinir.
- Grafik geçmişi: max **120 nokta** (60 saniye). Aşıldığında eski veriler silinir.
- Uyarı limiti: max **10 aktif uyarı**.
- Gereksiz re-render'lardan kaçınılır. Zustand selector'ları spesifik tutulur.

## Simülasyon Kuralları

- Simülasyon verileri gerçekçi olmalıdır (sensör gürültüsü eklenmelidir).
- Waypoint bazlı navigasyon kullanılır.
- Görev fazları sırayla ilerler: PRE_FLIGHT → TAKEOFF → EN_ROUTE → ON_STATION → RTL → LANDING.
- Batarya tüketimi simüle edilir (2 saniyede %0.1 azalma).
- Geofence sınırları kontrol edilir.

## Uyarı Sistemi Kuralları

- Uyarı seviyeleri: INFO, WARNING, CRITICAL.
- Spam'i önlemek için cooldown mekanizması kullanılır (8-15 saniye).
- Kritik uyarılar: Batarya < %20, Sinyal < -80 dBm.
- Uyarı uyarıları: İrtifa > 180m, Rüzgar > 12 m/s.

## Git Kuralları

- Commit mesajları İngilizce ve açıklayıcı olmalıdır.
- Branch adlandırma: `feature/`, `fix/`, `refactor/` prefix'leri kullanılır.
- `node_modules/`, `dist/`, `.env` dosyaları commit'lenmez.

## Test Kuralları

- Yeni eklenen her utility fonksiyonu için birim test yazılmalıdır.
- Bileşen testlerinde React Testing Library kullanılır.
- Simülasyon motoru değişikliklerinde entegrasyon testi eklenir.
