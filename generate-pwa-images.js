import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const PUBLIC_DIR = './public';

// Ensure public directory exists
if (!fs.existsSync(PUBLIC_DIR)) {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
}

const LOGO_SVG_PATH = path.join(PUBLIC_DIR, 'logo.svg');

// Check if logo.svg exists, if not we will place it
if (!fs.existsSync(LOGO_SVG_PATH)) {
  console.log('logo.svg does not exist. Creating default logo...');
  const defaultSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Background with premium dark gradient look -->
  <rect width="512" height="512" rx="110" fill="#141414"/>
  
  <!-- Outer Subtle Gold Ring -->
  <rect x="20" y="20" width="472" height="472" rx="90" fill="none" stroke="#D97706" stroke-width="4" opacity="0.4" />
  
  <!-- Thick Gold Accent Frame -->
  <rect x="35" y="35" width="442" height="442" rx="75" fill="none" stroke="#D97706" stroke-width="8" />
  
  <!-- Stylized Culinary Grill/Kebab Concept Art -->
  <g transform="translate(256, 230)">
    <!-- Decorative Ambient Fire Glow -->
    <path d="M-60,40 C-60,70 -30,100 0,100 C30,100 60,70 60,40 C50,55 30,65 0,65 C-30,65 -50,55 -60,40 Z" fill="#D97706" opacity="0.35" filter="blur(8px)" />
    
    <!-- Real-looking Flame vector at the bottom center -->
    <path d="M-25,50 C-25,75 -10,85 0,85 C10,85 25,75 25,50 C20,65 10,75 0,72 C-10,75 -20,65 -25,50 Z" fill="#D97706" />
    <path d="M-10,55 C-10,65 -5,70 0,70 C5,70 10,65 10,55 C7,60 4,62 0,61 C-4,62 -7,60 -10,55 Z" fill="#F9F7F2" />

    <!-- Two crossed premium Kebab/Grill skewers in rich Gold -->
    <!-- Skewer 1 (diagonal left-bottom to right-top) -->
    <g transform="rotate(-30)">
      <!-- Blade Shaft -->
      <line x1="-160" y1="0" x2="160" y2="0" stroke="#F9F7F2" stroke-width="6" stroke-linecap="round" />
      <line x1="-160" y1="0" x2="150" y2="0" stroke="#D97706" stroke-width="2" />
      <!-- Grilled meat/kebab pieces -->
      <rect x="-85" y="-22" width="45" height="44" rx="10" fill="#D97706" stroke="#141414" stroke-width="3" />
      <rect x="-30" y="-25" width="55" height="50" rx="12" fill="#92400E" stroke="#141414" stroke-width="3" />
      <rect x="35" y="-22" width="45" height="44" rx="10" fill="#D97706" stroke="#141414" stroke-width="3" />
      <!-- Skewer Handle -->
      <path d="M-190,-12 L-155,-12 L-155,12 L-190,12 Z" fill="#D97706" rx="4" />
      <circle cx="-172" cy="0" r="4" fill="#141414" />
    </g>

    <!-- Skewer 2 (diagonal right-bottom to left-top) -->
    <g transform="rotate(30)">
      <!-- Blade Shaft -->
      <line x1="-160" y1="0" x2="160" y2="0" stroke="#F9F7F2" stroke-width="6" stroke-linecap="round" />
      <line x1="-160" y1="0" x2="150" y2="0" stroke="#D97706" stroke-width="2" />
      <!-- Grilled meat pieces -->
      <rect x="-85" y="-22" width="45" height="44" rx="10" fill="#D97706" stroke="#141414" stroke-width="3" opacity="0.95" />
      <rect x="-30" y="-25" width="55" height="50" rx="12" fill="#B45309" stroke="#141414" stroke-width="3" opacity="0.95" />
      <rect x="35" y="-22" width="45" height="44" rx="10" fill="#D97706" stroke="#141414" stroke-width="3" opacity="0.95" />
      <!-- Handle -->
      <path d="M-190,-12 L-155,-12 L-155,12 L-190,12 Z" fill="#D97706" rx="4" />
      <circle cx="-172" cy="0" r="4" fill="#141414" />
    </g>
  </g>

  <!-- Elegant Arabic Caligraphy / Typography Style Text at the bottom -->
  <text x="256" y="420" font-family="'Inter', 'Segoe UI', Tahoma, sans-serif" font-size="38" font-weight="900" fill="#F9F7F2" text-anchor="middle" letter-spacing="2">M O U L A N A</text>
  <text x="256" y="455" font-family="system-ui, -apple-system, sans-serif" font-size="22" font-weight="bold" fill="#D97706" text-anchor="middle">مطعم مولانا للمشويات والمأكولات</text>
</svg>`;
  fs.writeFileSync(LOGO_SVG_PATH, defaultSvg);
}

// Generate maskable logo SVG (flat square background and safe area check)
const maskableLogoSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <!-- Background covering the entire square (crucial for maskable) -->
  <rect width="512" height="512" fill="#141414" />
  
  <!-- Subtle gold frame inside safe-zone -->
  <rect x="75" y="75" width="362" height="362" rx="40" fill="none" stroke="#D97706" stroke-width="6" opacity="0.6" />
  
  <!-- Scaled down central logo graphics to fit comfortably in safe zone (80% / ~409px circle) -->
  <g transform="translate(256, 215) scale(0.72)">
    <!-- Decorative fire glow -->
    <path d="M-60,40 C-60,70 -30,100 0,100 C30,100 60,70 60,40 C50,55 30,65 0,65 C-30,65 -50,55 -60,40 Z" fill="#D97706" opacity="0.35" filter="blur(8px)" />
    
    <!-- Flame vector -->
    <path d="M-25,50 C-25,75 -10,85 0,85 C10,85 25,75 25,50 C20,65 10,75 0,72 C-10,75 -20,65 -25,50 Z" fill="#D97706" />
    <path d="M-10,55 C-10,65 -5,70 0,70 C5,70 10,65 10,55 C7,60 4,62 0,61 C-4,62 -7,60 -10,55 Z" fill="#F9F7F2" />

    <!-- Two crossed skewers -->
    <g transform="rotate(-30)">
      <line x1="-160" y1="0" x2="160" y2="0" stroke="#F9F7F2" stroke-width="6" stroke-linecap="round" />
      <line x1="-160" y1="0" x2="150" y2="0" stroke="#D97706" stroke-width="2" />
      <rect x="-85" y="-22" width="45" height="44" rx="10" fill="#D97706" stroke="#141414" stroke-width="3" />
      <rect x="-30" y="-25" width="55" height="50" rx="12" fill="#92400E" stroke="#141414" stroke-width="3" />
      <rect x="35" y="-22" width="45" height="44" rx="10" fill="#D97706" stroke="#141414" stroke-width="3" />
      <path d="M-190,-12 L-155,-12 L-155,12 L-190,12 Z" fill="#D97706" rx="4" />
      <circle cx="-172" cy="0" r="4" fill="#141414" />
    </g>
    <g transform="rotate(30)">
      <line x1="-160" y1="0" x2="160" y2="0" stroke="#F9F7F2" stroke-width="6" stroke-linecap="round" />
      <line x1="-160" y1="0" x2="150" y2="0" stroke="#D97706" stroke-width="2" />
      <rect x="-85" y="-22" width="45" height="44" rx="10" fill="#D97706" stroke="#141414" stroke-width="3" opacity="0.95" />
      <rect x="-30" y="-25" width="55" height="50" rx="12" fill="#B45309" stroke="#141414" stroke-width="3" opacity="0.95" />
      <rect x="35" y="-22" width="45" height="44" rx="10" fill="#D97706" stroke="#141414" stroke-width="3" opacity="0.95" />
      <path d="M-190,-12 L-155,-12 L-155,12 L-190,12 Z" fill="#D97706" rx="4" />
      <circle cx="-172" cy="0" r="4" fill="#141414" />
    </g>
  </g>

  <!-- Typography slightly scaled down & centered -->
  <text x="256" y="395" font-family="'Inter', 'Segoe UI', Tahoma, sans-serif" font-size="30" font-weight="900" fill="#F9F7F2" text-anchor="middle" letter-spacing="2">M O U L A N A</text>
  <text x="256" y="425" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="bold" fill="#D97706" text-anchor="middle">مطعم مولانا</text>
</svg>`;

// Generate high-fidelity mobile screenshot SVG (1080 x 1920)
const mobileScreenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 1920" width="1080" height="1920">
  <!-- Phone Screen Frame Area -->
  <rect width="1080" height="1920" fill="#141414" />
  
  <!-- Top Mobile Status Bar -->
  <rect x="0" y="0" width="1080" height="70" fill="#0d0d0d" />
  <circle cx="540" cy="35" r="16" fill="#1f1f1f" /> <!-- Camera Punchhole -->
  <text x="70" y="47" font-family="system-ui, sans-serif" font-size="30" font-weight="bold" fill="#ffffff" opacity="0.8">13:37</text>
  <path d="M930,30 L950,45 L930,45 Z" fill="#ffffff" opacity="0.8" />
  <rect x="960" y="24" width="50" height="24" rx="4" fill="none" stroke="#ffffff" stroke-width="3" opacity="0.8" />
  <rect x="965" y="29" width="30" height="14" rx="2" fill="#ffffff" opacity="0.8" />
  
  <!-- Custom Moulana Gorgeous App Header -->
  <rect x="0" y="70" width="1080" height="200" fill="#1c1c1c" />
  <g transform="translate(100, 170)">
    <!-- Mini Logo -->
    <rect width="100" height="100" rx="20" fill="#141414" stroke="#D97706" stroke-width="2" />
    <circle cx="50" cy="50" r="30" fill="#D97706" opacity="0.2" />
    <path d="M35,60 C40,65 60,65 65,60" fill="none" stroke="#D97706" stroke-width="6" stroke-linecap="round" />
    <line x1="30" y1="35" x2="70" y2="65" stroke="#F9F7F2" stroke-width="4" />
    <line x1="70" y1="35" x2="30" y2="65" stroke="#F9F7F2" stroke-width="4" />
  </g>
  <text x="230" y="195" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#F9F7F2" text-anchor="start">مطعم مولانا</text>
  <text x="230" y="240" font-family="system-ui, sans-serif" font-size="28" font-weight="500" fill="#D97706" text-anchor="start">عراقة المأكولات والمشويات الأصيلة</text>
  
  <!-- Dynamic Cart Counter Header widget -->
  <g transform="translate(900, 140)">
    <circle cx="50" cy="30" r="45" fill="#2d2d2d" />
    <!-- Shopping bag vector icon -->
    <path d="M35,35 L65,35 L65,55 C65,60 60,65 50,65 C40,65 35,60 35,55 Z" fill="none" stroke="#D97706" stroke-width="4" />
    <path d="M42,35 C42,25 58,25 58,35" fill="none" stroke="#D97706" stroke-width="4" />
    <circle cx="70" cy="15" r="18" fill="#D97706" />
    <text x="70" y="21" font-family="system-ui, sans-serif" font-size="18" font-weight="extrabold" fill="#141414" text-anchor="middle">3</text>
  </g>
  
  <!-- App Promo BBQ Grill Banner -->
  <g transform="translate(60, 310)">
    <rect width="960" height="380" rx="40" fill="#262626" />
    <!-- Fancy dark overlay gradient visual represent -->
    <rect width="960" height="380" rx="40" fill="none" stroke="#D97706" stroke-width="3" opacity="0.3"/>
    
    <!-- Stylized Grill Vector art inside banner -->
    <circle cx="750" cy="190" r="130" fill="#141414" stroke="#D97706" stroke-width="4" />
    <line x1="640" y1="190" x2="860" y2="190" stroke="#262626" stroke-width="4" />
    <line x1="660" y1="130" x2="840" y2="250" stroke="#262626" stroke-width="4" />
    <line x1="660" y1="250" x2="840" y2="130" stroke="#262626" stroke-width="4" />
    <!-- Hot orange charcoal sparks -->
    <circle cx="710" cy="170" r="12" fill="#D97706" opacity="0.8" />
    <circle cx="760" cy="220" r="16" fill="#EA580C" opacity="0.9" />
    <circle cx="780" cy="150" r="10" fill="#F59E0B" opacity="0.9" />
    
    <!-- Hebrew/Arabic Luxury Typography translation -->
    <text x="60" y="120" font-family="system-ui, sans-serif" font-size="44" font-weight="900" fill="#F9F7F2">مشاوي مولانا الطازجة 🔥</text>
    <text x="60" y="190" font-family="system-ui, sans-serif" font-size="30" font-weight="normal" fill="#e5e5e5" width="500">خصم 20% على طلبك الأول عبر التطبيق</text>
    <text x="60" y="240" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#D97706">أسرع خدمة توصيل مأكولات</text>
    
    <!-- Order Coupon pill button -->
    <rect x="60" y="285" width="260" height="65" rx="32" fill="#D97706" />
    <text x="190" y="328" font-family="system-ui, sans-serif" font-size="26" font-weight="bold" fill="#141414" text-anchor="middle">اطلب الآن</text>
  </g>
  
  <!-- Horizontal Category list Slider component -->
  <!-- Category 1 (Active) -->
  <g transform="translate(60, 730)">
    <rect width="280" height="110" rx="30" fill="#D97706" />
    <text x="140" y="95" font-family="system-ui, sans-serif" font-size="32" font-weight="black" fill="#141414" text-anchor="middle">🍖 الأطباق الرئيسية</text>
  </g>
  <!-- Category 2 -->
  <g transform="translate(370, 730)">
    <rect width="320" height="110" rx="30" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="3" />
    <text x="160" y="95" font-family="system-ui, sans-serif" font-size="30" font-weight="bold" fill="#F9F7F2" text-anchor="middle">🌯 ساندوتشات ولفائف</text>
  </g>
  <!-- Category 3 -->
  <g transform="translate(720, 730)">
    <rect width="280" height="110" rx="30" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="3" />
    <text x="140" y="95" font-family="system-ui, sans-serif" font-size="30" font-weight="bold" fill="#F9F7F2" text-anchor="middle">🥤 مشروبات منعشة</text>
  </g>

  <!-- Title Section: القائمة المميزة -->
  <text x="60" y="920" font-family="system-ui, sans-serif" font-size="38" font-weight="bold" fill="#F9F7F2">القائمة والمأكولات المتاحة</text>
  
  <!-- Food Item 1: Grill platter card -->
  <g transform="translate(60, 960)">
    <rect width="960" height="340" rx="35" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" />
    <!-- Mini Dish Graphic -->
    <rect x="40" y="40" width="260" height="260" rx="25" fill="#262626" />
    <circle cx="170" cy="170" r="100" fill="#141414" stroke="#D97706" stroke-width="4" opacity="0.3" />
    <path d="M120,170 C130,210 210,210 220,170 Z" fill="#D97706" />
    <line x1="80" y1="170" x2="260" y2="170" stroke="#F9F7F2" stroke-width="6" stroke-linecap="round" />
    <!-- Details -->
    <text x="340" y="95" font-family="system-ui, sans-serif" font-size="40" font-weight="black" fill="#F9F7F2">سرفيس كباب وكفتة مولانا الفاخر</text>
    <text x="340" y="150" font-family="system-ui, sans-serif" font-size="26" fill="#888888">نصف كيلو مشويات مشكلة على الفحم حطب طبيعي</text>
    <text x="340" y="200" font-family="system-ui, sans-serif" font-size="26" fill="#888888">يقدم مع الأرز البسمتي، خبز، طحينة، وسلطة</text>
    
    <text x="340" y="275" font-family="system-ui, sans-serif" font-size="42" font-weight="900" fill="#D97706">450 EGP</text>
    
    <!-- Beautiful custom circular Plus button -->
    <circle cx="880" cy="170" r="50" fill="#D97706" />
    <line x1="855" y1="170" x2="905" y2="170" stroke="#141414" stroke-width="6" stroke-linecap="round" />
    <line x1="880" y1="145" x2="880" y2="195" stroke="#141414" stroke-width="6" stroke-linecap="round" />
  </g>

  <!-- Food Item 2: Kabab sandwich card -->
  <g transform="translate(60, 1330)">
    <rect width="960" height="340" rx="35" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" />
    <!-- Mini Dish Graphic -->
    <rect x="40" y="40" width="260" height="260" rx="25" fill="#262626" />
    <rect x="70" y="110" width="200" height="120" rx="15" fill="#B45309" stroke="#F9F7F2" stroke-width="2" />
    <rect x="100" y="130" width="140" height="80" rx="10" fill="#92400E" />
    <path d="M120,110 Q170,80 220,110" fill="none" stroke="#D97706" stroke-width="5" />
    <!-- Details -->
    <text x="340" y="95" font-family="system-ui, sans-serif" font-size="40" font-weight="black" fill="#F9F7F2">ساندوتش كفتة مولانا على السيخ</text>
    <text x="340" y="150" font-family="system-ui, sans-serif" font-size="26" fill="#888888">كفتة بلدي مشوية على الفحم، خضروات، طحينة</text>
    <text x="340" y="200" font-family="system-ui, sans-serif" font-size="26" fill="#888888">ملفوف بعناية بخبز الصاج البلدي الفريش</text>
    
    <text x="340" y="275" font-family="system-ui, sans-serif" font-size="42" font-weight="900" fill="#D97706">180 EGP</text>
    
    <!-- Beautiful custom circular Plus button -->
    <circle cx="880" cy="170" r="50" fill="#D97706" />
    <line x1="855" y1="170" x2="905" y2="170" stroke="#141414" stroke-width="6" stroke-linecap="round" />
    <line x1="880" y1="145" x2="880" y2="195" stroke="#141414" stroke-width="6" stroke-linecap="round" />
  </g>
  
  <!-- Bottom App Navigation dock -->
  <rect x="0" y="1740" width="1080" height="180" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" />
  <!-- Tab 1: Home main menu (Selected) -->
  <g transform="translate(180, 1810)">
    <circle cx="0" cy="0" r="30" fill="#D97706" opacity="0.1" />
    <!-- Home icon logic vector -->
    <path d="M-20,10 L-20,-10 L0,-25 L20,-10 L20,10 Z" fill="none" stroke="#D97706" stroke-width="5" />
    <rect x="-8" y="0" width="16" height="10" fill="#D97706" />
    <text x="0" y="55" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#D97706" text-anchor="middle">الطلب الفوري</text>
  </g>
  <!-- Tab 2: Orders bill screen -->
  <g transform="translate(540, 1810)">
    <!-- Invoice text list vector -->
    <rect x="-18" y="-18" width="36" height="36" rx="4" fill="none" stroke="#888888" stroke-width="4" />
    <line x1="-10" y1="-8" x2="10" y2="-8" stroke="#888888" stroke-width="4" />
    <line x1="-10" y1="2" x2="10" y2="2" stroke="#888888" stroke-width="4" />
    <line x1="-10" y1="10" x2="4" y2="10" stroke="#888888" stroke-width="4" />
    <text x="0" y="55" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#888888" text-anchor="middle">طلباتي</text>
  </g>
  <!-- Tab 3: Restaurant location details -->
  <g transform="translate(900, 1810)">
    <!-- Info locator vector map pin -->
    <path d="M-15,-10 C-15,10 0,25 0,25 C0,25 15,10 15,-10 C15,-20 0,-30 -15,-10 Z" fill="none" stroke="#888888" stroke-width="4" />
    <circle cx="0" cy="-10" r="6" fill="#888888" />
    <text x="0" y="55" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#888888" text-anchor="middle">عن مولانا</text>
  </g>
</svg>`;

// Generate high-fidelity desktop screen SVG (1920 x 1080)
const desktopScreenshotSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1920 1080" width="1920" height="1080">
  <!-- Desktop Screen Background Canvas -->
  <rect width="1920" height="1080" fill="#141414" />
  
  <!-- Right Navigation Sidebar (Since arabic/RTL app configuration) -->
  <rect x="1560" y="0" width="360" height="1080" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" />
  
  <!-- Brand logo and status inside navbar -->
  <g transform="translate(1700, 100)">
    <circle cx="40" cy="40" r="70" fill="#141414" stroke="#D97706" stroke-width="4" />
    <!-- Emblem -->
    <path d="M10,40 Q40,10 70,40 Q40,70 10,40" fill="none" stroke="#D97706" stroke-width="4" />
    <line x1="15" y1="15" x2="65" y2="65" stroke="#F9F7F2" stroke-width="4" />
    <line x1="65" y1="15" x2="15" y2="65" stroke="#F9F7F2" stroke-width="4" />
  </g>
  <text x="1740" y="240" font-family="system-ui, sans-serif" font-size="34" font-weight="900" fill="#F9F7F2" text-anchor="middle">لوحة تحكم مولانا</text>
  <text x="1740" y="280" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#D97706" text-anchor="middle">إدارة المطبخ والمشويات</text>
  
  <!-- Sidenav link items -->
  <!-- Tab 1: Active orders (Selected) -->
  <g transform="translate(1560, 360)">
    <rect width="360" height="90" fill="#D97706" opacity="0.1" />
    <rect x="350" y="0" width="10" height="90" fill="#D97706" />
    <!-- Clock icon -->
    <circle cx="50" cy="45" r="20" fill="none" stroke="#D97706" stroke-width="3" />
    <line x1="50" y1="45" x2="50" y2="35" stroke="#D97706" stroke-width="3" />
    <line x1="50" y1="45" x2="62" y2="45" stroke="#D97706" stroke-width="3" />
    <text x="100" y="52" font-family="system-ui, sans-serif" font-size="24" font-weight="black" fill="#D97706">شاشة المطبخ والطلبات</text>
    <!-- Notification counter -->
    <rect x="300" y="30" width="36" height="30" rx="8" fill="#D97706" />
    <text x="318" y="51" font-family="system-ui, sans-serif" font-size="16" font-weight="bold" fill="#141414" text-anchor="middle">12</text>
  </g>
  <!-- Tab 2: Menu Editor -->
  <g transform="translate(1560, 470)">
    <!-- Food skewer menu icon -->
    <line x1="35" y1="35" x2="65" y2="65" stroke="#888888" stroke-width="3" />
    <circle cx="40" cy="40" r="8" fill="#888888" />
    <circle cx="50" cy="50" r="8" fill="#888888" />
    <text x="100" y="52" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#888888">تعديل قائمة الطعام</text>
  </g>
  <!-- Tab 3: Statistics / Analytics -->
  <g transform="translate(1560, 580)">
    <!-- Analytics graph -->
    <rect x="35" y="30" width="30" height="30" rx="2" fill="none" stroke="#888888" stroke-width="3" />
    <line x1="42" y1="52" x2="42" y2="42" stroke="#888888" stroke-width="3" />
    <line x1="50" y1="52" x2="50" y2="36" stroke="#888888" stroke-width="3" />
    <line x1="58" y1="52" x2="58" y2="46" stroke="#888888" stroke-width="3" />
    <text x="100" y="52" font-family="system-ui, sans-serif" font-size="24" font-weight="bold" fill="#888888">إحصائيات اليوم والمالية</text>
  </g>

  <!-- Connection / Wifi state indicator inside navbar footer -->
  <g transform="translate(1740, 1000)">
    <circle cx="-50" cy="0" r="6" fill="#10B981" />
    <text x="-35" y="7" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#10B981">شاشة المطعم متصلة بالإنترنت</text>
  </g>


  <!-- Left Platform Dashboard Content -->
  <g transform="translate(80, 80)">
    <!-- App Status Header -->
    <text x="1400" y="20" font-family="system-ui, sans-serif" font-size="38" font-weight="black" fill="#F9F7F2" text-anchor="end">طلبات المطبخ اللحظية والمونيتور</text>
    <text x="1400" y="60" font-family="system-ui, sans-serif" font-size="20" fill="#888888" text-anchor="end">تحديث فوري للطلبات المطبخ والمشويات ومتابعتها</text>
    
    <!-- Row of KPI Counters -->
    <!-- KPI 1 -->
    <g transform="translate(0, 110)">
      <rect width="440" height="150" rx="25" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" />
      <text x="40" y="50" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#888888">طلبات قيد التحضير</text>
      <text x="40" y="115" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#F59E0B">8 طلبات جديدة</text>
      <!-- Fire Icon symbol -->
      <path d="M380,50 C380,80 360,100 340,100 C320,100 310,80 320,60 C330,40 350,20 350,20 C350,20 380,40 380,50 Z" fill="#F59E0B" />
    </g>
    <!-- KPI 2 -->
    <g transform="translate(480, 110)">
      <rect width="440" height="150" rx="25" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" />
      <text x="40" y="50" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#888888">طلبات جاهزة للتوصيل</text>
      <text x="40" y="115" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#10B981">4 طلبات دليفري</text>
      <!-- Delivery Truck representation -->
      <rect x="320" y="60" width="45" height="30" rx="3" fill="#10B981" />
      <rect x="365" y="70" width="15" height="20" fill="#10B981" />
      <circle cx="335" cy="95" r="8" fill="#141414" />
      <circle cx="360" cy="95" r="8" fill="#141414" />
    </g>
    <!-- KPI 3 -->
    <g transform="translate(960, 110)">
      <rect width="440" height="150" rx="25" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" />
      <text x="40" y="50" font-family="system-ui, sans-serif" font-size="18" font-weight="bold" fill="#888888">مبيعات وإيرادات اليوم</text>
      <text x="40" y="115" font-family="system-ui, sans-serif" font-size="52" font-weight="900" fill="#D97706">4,850 EGP</text>
      <!-- Money Icon stack representation -->
      <rect x="330" y="55" width="45" height="25" rx="3" fill="#D97706" />
      <circle cx="352" cy="67" r="6" fill="#1c1c1c" />
    </g>
    
    <!-- Section Title: الطلبات الجارية -->
    <text x="1400" y="325" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#F9F7F2" text-anchor="end">الطلبات النشطة بالمطبخ الفوري</text>
    
    <!-- Three Active Receipt Bills Grid -->
    <!-- Bill 1 (New, Takeaway) -->
    <g transform="translate(0, 360)">
      <rect width="440" height="520" rx="25" fill="#1c1c1c" stroke="#F59E0B" stroke-width="3" />
      <!-- Bill Header -->
      <rect x="0" y="0" width="440" height="90" rx="25" fill="#2d2d2d" />
      <text x="30" y="55" font-family="system-ui, sans-serif" font-size="26" font-weight="black" fill="#F9F7F2">طلب سفري #1024</text>
      <rect x="290" y="25" width="120" height="40" rx="15" fill="#F59E0B" />
      <text x="350" y="51" font-family="system-ui, sans-serif" font-size="18" font-weight="black" fill="#141414" text-anchor="middle">قيد التحضير</text>
      
      <!-- Details -->
      <text x="30" y="145" font-family="system-ui, sans-serif" font-size="18" fill="#888888">العميل: أحمد محمد عبد اللطيف</text>
      <text x="30" y="180" font-family="system-ui, sans-serif" font-size="18" fill="#888888">تلفون: 0102938475</text>
      <text x="30" y="215" font-family="system-ui, sans-serif" font-size="18" fill="#888888">الوقت: قبل 4 دقائق (13:33)</text>
      <line x1="30" y1="240" x2="410" y2="240" stroke="#2d2d2d" stroke-width="2" />
      
      <!-- Items -->
      <text x="30" y="280" font-family="system-ui, sans-serif" font-size="22" font-weight="black" fill="#F9F7F2">الأصناف المطلوبة:</text>
      <text x="30" y="325" font-family="system-ui, sans-serif" font-size="20" fill="#e5e5e5">1x  سرفيس كباب وكفتة مولانا الفاخر</text>
      <text x="30" y="365" font-family="system-ui, sans-serif" font-size="20" fill="#e5e5e5">2x  ساندوتش كفتة على الفحم</text>
      <text x="30" y="405" font-family="system-ui, sans-serif" font-size="20" fill="#e5e5e5">3x  سلطة طحينة فريش إضافية</text>
      
      <line x1="30" y1="435" x2="410" y2="435" stroke="#2d2d2d" stroke-width="2" />
      <text x="30" y="480" font-family="system-ui, sans-serif" font-size="26" font-weight="black" fill="#D97706">الحساب الإجمالي: 830 EGP</text>
    </g>

    <!-- Bill 2 (Delivery, Ready) -->
    <g transform="translate(480, 360)">
      <rect width="440" height="520" rx="25" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" />
      <!-- Bill Header -->
      <rect x="0" y="0" width="440" height="90" rx="25" fill="#2d2d2d" />
      <text x="30" y="55" font-family="system-ui, sans-serif" font-size="26" font-weight="black" fill="#F9F7F2">طلب دليفري #1023</text>
      <rect x="290" y="25" width="120" height="40" rx="15" fill="#10B981" />
      <text x="350" y="51" font-family="system-ui, sans-serif" font-size="18" font-weight="black" fill="#141414" text-anchor="middle">جاهز للتوصيل</text>
      
      <!-- Details -->
      <text x="30" y="145" font-family="system-ui, sans-serif" font-size="18" fill="#888888">العميل: سارة علي (المهندسين)</text>
      <text x="30" y="180" font-family="system-ui, sans-serif" font-size="18" fill="#888888">تلفون: 0122908754</text>
      <text x="30" y="215" font-family="system-ui, sans-serif" font-size="18" fill="#888888">الوقت: قبل 12 دقيقة (13:25)</text>
      <line x1="30" y1="240" x2="410" y2="240" stroke="#2d2d2d" stroke-width="2" />
      
      <!-- Items -->
      <text x="30" y="280" font-family="system-ui, sans-serif" font-size="22" font-weight="black" fill="#F9F7F2">الأصناف المطلوبة:</text>
      <text x="30" y="325" font-family="system-ui, sans-serif" font-size="20" fill="#e5e5e5">2x  سرفيس ريش ضأن مشوية مولانا</text>
      <text x="30" y="365" font-family="system-ui, sans-serif" font-size="20" fill="#e5e5e5">1x  كوكتيل مشروب غازي عائلي</text>
      
      <line x1="30" y1="435" x2="410" y2="435" stroke="#2d2d2d" stroke-width="2" />
      <text x="30" y="480" font-family="system-ui, sans-serif" font-size="26" font-weight="black" fill="#D97706">الحساب الإجمالي: 1,120 EGP</text>
    </g>

    <!-- Bill 3 (Delivery, Delivered/Completed) -->
    <g transform="translate(960, 360)">
      <rect width="440" height="520" rx="25" fill="#1c1c1c" stroke="#2d2d2d" stroke-width="2" opacity="0.6"/>
      <!-- Bill Header -->
      <rect x="0" y="0" width="440" height="90" rx="25" fill="#2d2d2d" />
      <text x="30" y="55" font-family="system-ui, sans-serif" font-size="26" font-weight="black" fill="#F9F7F2">طلب سفري #1022</text>
      <rect x="290" y="25" width="120" height="40" rx="15" fill="#3b82f6" />
      <text x="350" y="51" font-family="system-ui, sans-serif" font-size="18" font-weight="black" fill="#F9F7F2" text-anchor="middle">تم التسليم</text>
      
      <!-- Details -->
      <text x="30" y="145" font-family="system-ui, sans-serif" font-size="18" fill="#888888">العميل: كريم سمير (طلب تيك اواي)</text>
      <text x="30" y="180" font-family="system-ui, sans-serif" font-size="18" fill="#888888">تلفون: 0115764321</text>
      <text x="30" y="215" font-family="system-ui, sans-serif" font-size="18" fill="#888888">الوقت: قبل 20 دقيقة (13:17)</text>
      <line x1="30" y1="240" x2="410" y2="240" stroke="#2d2d2d" stroke-width="2" />
      
      <!-- Items -->
      <text x="30" y="280" font-family="system-ui, sans-serif" font-size="22" font-weight="black" fill="#F9F7F2">الأصناف المطلوبة:</text>
      <text x="30" y="325" font-family="system-ui, sans-serif" font-size="20" fill="#e5e5e5">4x  ساندوتش طرب فاخر على الفحم</text>
      
      <line x1="30" y1="435" x2="410" y2="435" stroke="#2d2d2d" stroke-width="2" />
      <text x="30" y="480" font-family="system-ui, sans-serif" font-size="26" font-weight="black" fill="#D97706">الحساب الإجمالي: 640 EGP</text>
    </g>
  </g>
</svg>`;

async function run() {
  try {
    console.log('1. Generating icon-192.png...');
    await sharp(Buffer.from(LOGO_SVG_PATH ? fs.readFileSync(LOGO_SVG_PATH) : ''))
      .resize(192, 192)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-192.png'));
    console.log('Success: Generated icon-192.png');

    console.log('2. Generating icon-512.png...');
    await sharp(Buffer.from(LOGO_SVG_PATH ? fs.readFileSync(LOGO_SVG_PATH) : ''))
      .resize(512, 512)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'icon-512.png'));
    console.log('Success: Generated icon-512.png');

    console.log('3. Generating maskable-icon-512.png...');
    await sharp(Buffer.from(maskableLogoSvg))
      .resize(512, 512)
      .png()
      .toFile(path.join(PUBLIC_DIR, 'maskable-icon-512.png'));
    console.log('Success: Generated maskable-icon-512.png');

    console.log('4. Generating screenshot-mobile.png...');
    await sharp(Buffer.from(mobileScreenshotSvg))
      .resize(540, 960) // We resize 1080x1920 to a crisp manageable size
      .png()
      .toFile(path.join(PUBLIC_DIR, 'screenshot-mobile.png'));
    console.log('Success: Generated screenshot-mobile.png');

    console.log('5. Generating screenshot-desktop.png...');
    await sharp(Buffer.from(desktopScreenshotSvg))
      .resize(1200, 675) // We resize 1920x1080 to a perfect 16:9 proportion screenshot
      .png()
      .toFile(path.join(PUBLIC_DIR, 'screenshot-desktop.png'));
    console.log('Success: Generated screenshot-desktop.png');

    console.log('All icons and PWA screenshots generated successfully inside the /public directory!');
  } catch (error) {
    console.error('Failed to generate PWA images:', error);
    process.exit(1);
  }
}

run();
