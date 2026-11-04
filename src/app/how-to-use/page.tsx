import React from 'react';
import Link from 'next/link';
import {
  Play,
  CheckCircle2,
  Smartphone,
  Search,
  ShoppingCart,
  Heart,
  CreditCard,
  Truck,
  RotateCcw,
  UserCheck,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Video,
  Languages,
  Clock,
  ExternalLink,
} from 'lucide-react';

export const metadata = {
  title: 'How to Use ShopSphere — Complete Shopping Guide',
  description:
    'Comprehensive customer shopping guide for ShopSphere with step-by-step instructions, video chapter walkthroughs, and Telugu narration script.',
};

interface GuideChapter {
  id: number;
  time: string;
  title: string;
  teluguTitle: string;
  icon: React.ElementType;
  description: string;
  teluguNarration: string;
  englishSubtitles: string;
  actionUrl?: string;
  actionText?: string;
}

const CHAPTERS: GuideChapter[] = [
  {
    id: 1,
    time: '00:00 - 00:55',
    title: 'Welcome to ShopSphere',
    teluguTitle: 'షాప్‌స్పియర్‌కి స్వాగతం',
    icon: Sparkles,
    description: 'Learn what ShopSphere offers: over 445 products across 10 official categories with transparent Indian pricing.',
    teluguNarration: 'షాప్‌స్పియర్ ఈ-కామర్స్ పోర్టల్‌కి స్వాగతం! ఇక్కడ మీకు ఫ్యాషన్, మొబైల్స్, ఎలక్ట్రానిక్స్ మరియు గృహోపకరణాలతో సహా 10 అధికారిక కేటగిరీల్లో 445 కంటే ఎక్కువ నాణ్యమైన ఉత్పత్తులు లభిస్తాయి.',
    englishSubtitles: 'Welcome to ShopSphere! Discover over 445 quality products across 10 official categories including Fashion, Mobiles, and Electronics with genuine transparent pricing.',
    actionUrl: '/products',
    actionText: 'Browse Products',
  },
  {
    id: 2,
    time: '00:55 - 01:50',
    title: 'Mobile OTP Login & Fast Registration',
    teluguTitle: 'మొబైల్ OTP లాగిన్ మరియు సులభ రిజిస్ట్రేషన్',
    icon: Smartphone,
    description: 'Sign in effortlessly using your 10-digit mobile number and a 6-digit SMS OTP without remembering passwords.',
    teluguNarration: 'పాస్‌వర్డ్ గుర్తుంచుకోవాల్సిన అవసరం లేదు. మీ 10 అంకెల మొబైల్ నంబర్ నమోదు చేసి, వచ్చే 6 అంకెల SMS OTP తో క్షణాల్లో సురక్షితంగా లాగిన్ అవ్వండి.',
    englishSubtitles: 'No need to remember passwords! Enter your 10-digit mobile number and sign in securely with a 6-digit SMS OTP just like Amazon and Flipkart.',
    actionUrl: '/auth/login',
    actionText: 'Try Mobile Login',
  },
  {
    id: 3,
    time: '01:50 - 02:45',
    title: 'Homepage & Official Categories',
    teluguTitle: 'హోమ్‌పేజీ మరియు 10 అధికారిక కేటగిరీలు',
    icon: Sparkles,
    description: 'Navigate through Deals of the Day, Category Circles, and curated Best Sellers.',
    teluguNarration: 'హోమ్‌పేజీలో డీల్స్ ఆఫ్ ది డే, ప్రత్యేక ఆఫర్ల బ్యానర్లు మరియు కేటగిరీ సర్కిల్స్ ద్వారా మీకు కావలసిన వస్తువులను సులభంగా కనుగొనవచ్చు.',
    englishSubtitles: 'Explore curated discount banners, Deals of the Day, and official category circles for seamless shopping discovery.',
    actionUrl: '/',
    actionText: 'Go to Homepage',
  },
  {
    id: 4,
    time: '02:45 - 03:40',
    title: 'Instant Search & Smart Filters',
    teluguTitle: 'సెర్చ్ మరియు ఫిల్టర్ల వినియోగం',
    icon: Search,
    description: 'Search for any brand or product with live autocomplete suggestions, price range sliders, and sorting options.',
    teluguNarration: 'సెర్చ్ బార్‌లో టైప్ చేయగానే లైవ్ సలహాలు వస్తాయి. బడ్జెట్ ఫిల్టర్లు మరియు ధర తక్కువ నుండి ఎక్కువ క్రమం ద్వారా సరైన వస్తువును ఎంచుకోండి.',
    englishSubtitles: 'Use the intelligent search bar with live auto-suggestions, price range filters, and rating sorting to find exactly what you want.',
    actionUrl: '/products?cat=electronics',
    actionText: 'Search Electronics',
  },
  {
    id: 5,
    time: '03:40 - 04:35',
    title: 'Product Details & PIN Code Checker',
    teluguTitle: 'వస్తువు వివరాలు మరియు పిన్ కోడ్ డెలివరీ తనిఖీ',
    icon: CheckCircle2,
    description: 'Inspect image galleries, technical specifications, verified customer ratings, and check doorstep delivery time via PIN code.',
    teluguNarration: 'ప్రొడక్ట్ పేజీలో ఫోటో గ్యాలరీ, స్పెసిఫికేషన్లు మరియు మీ 6 అంకెల పిన్ కోడ్ ఎంటర్ చేసి డెలివరీ అంచనా సమయాన్ని చూడవచ్చు.',
    englishSubtitles: 'View high-resolution product photos, full specifications, verified customer reviews, and check delivery serviceability with your 6-digit Indian PIN code.',
  },
  {
    id: 6,
    time: '04:35 - 05:30',
    title: 'Shopping Cart & Wishlist',
    teluguTitle: 'షాపింగ్ కార్ట్ మరియు విష్‌లిస్ట్',
    icon: ShoppingCart,
    description: 'Add products, update quantity steppers, track free shipping progress (₹1,999 threshold), and save items to Wishlist.',
    teluguNarration: 'మీకు నచ్చిన వస్తువును విష్‌లిస్ట్‌లో భద్రపరుచుకోవచ్చు లేదా కార్ట్‌కి జోడించి క్వాంటిటీ మార్చుకోవచ్చు. ₹1,999 దాటితే ఉచిత డెలివరీ లభిస్తుంది.',
    englishSubtitles: 'Add items to Cart, adjust quantities with real-time stock checks, track your ₹1,999 free shipping goal, or save favorites to your Wishlist.',
    actionUrl: '/cart',
    actionText: 'View Cart',
  },
  {
    id: 7,
    time: '05:30 - 06:25',
    title: 'Delivery Address & Checkout',
    teluguTitle: 'డెలివరీ చిరునామా మరియు చెక్‌అవుట్',
    icon: Truck,
    description: 'Save multiple Indian delivery addresses with verified PIN codes and review order items before payment.',
    teluguNarration: 'మీ ఇల్లు లేదా ఆఫీస్ చిరునామాను పిన్ కోడ్‌తో నమోదు చేసుకోండి. చెక్‌అవుట్‌లో ఆర్డర్ వివరాలు మరియు ఆఫర్ కూపన్ వర్తింపజేయండి.',
    englishSubtitles: 'Enter your delivery address with 6-digit PIN code validation, apply discount coupons like SHOPSPHERE10, and review order totals.',
    actionUrl: '/checkout',
    actionText: 'Checkout Flow',
  },
  {
    id: 8,
    time: '06:25 - 07:20',
    title: 'Indian Payment Options (Razorpay & COD)',
    teluguTitle: 'చెల్లింపు పద్ధతులు (UPI, కార్డ్స్ మరియు క్యాష్ ఆన్ డెలివరీ)',
    icon: CreditCard,
    description: 'Pay safely using Google Pay, PhonePe, Paytm, Credit/Debit cards, Net Banking, or choose Cash on Delivery.',
    teluguNarration: 'రేజర్‌పే ద్వారా UPI (Google Pay, PhonePe), డెబిట్/క్రెడిట్ కార్డులు, నెట్ బ్యాంకింగ్ లేదా క్యాష్ ఆన్ డెలివరీ ద్వారా సురక్షితంగా ఆర్డర్ పూర్తి చేయండి.',
    englishSubtitles: 'Enjoy 100% secure payments via Razorpay test mode supporting UPI (Google Pay, PhonePe), Cards, Net Banking, or Cash on Delivery.',
  },
  {
    id: 9,
    time: '07:20 - 08:15',
    title: 'Order Confirmation & Public Tracking',
    teluguTitle: 'ఆర్డర్ నిర్ధారణ మరియు లైవ్ ట్రాకింగ్',
    icon: Truck,
    description: 'Receive immediate order confirmation with unique order number (ORD-...) and track shipment stages live on /track.',
    teluguNarration: 'ఆర్డర్ విజయవంతం కాగానే ప్రత్యేకమైన ఆర్డర్ నంబర్ వస్తుంది. /track పేజీలో మీ ఆర్డర్ ఎక్కడుందో ఎప్పటికప్పుడు తెలుసుకోవచ్చు.',
    englishSubtitles: 'Receive an instant unique Order ID and follow each shipment stage from packing to out-for-delivery using the public /track timeline.',
    actionUrl: '/track',
    actionText: 'Track an Order',
  },
  {
    id: 10,
    time: '08:15 - 09:10',
    title: 'Order Cancellation & 7-Day Returns',
    teluguTitle: 'ఆర్డర్ రద్దు మరియు 7 రోజుల రిటర్న్ పాలసీ',
    icon: RotateCcw,
    description: 'Cancel un-shipped orders with one click, or submit a return request for delivered orders within the 7-day return window.',
    teluguNarration: 'షిప్పింగ్ కాకముందు ఆర్డర్‌ను సులభంగా రద్దు చేయవచ్చు. డెలివరీ అయిన వస్తువు నచ్చకపోతే 7 రోజులలోపు డోర్‌స్టెప్ రిటర్న్ రిక్వెస్ట్ పెట్టుకోవచ్చు.',
    englishSubtitles: 'Easily cancel orders before dispatch with automatic stock restoration, or submit a hassle-free doorstep return request within 7 days of delivery.',
  },
  {
    id: 11,
    time: '09:10 - 10:05',
    title: 'Customer Dashboard & Invoices',
    teluguTitle: 'కస్టమర్ ప్రొఫైల్ మరియు ఇన్వాయిస్ డౌన్‌లోడ్',
    icon: UserCheck,
    description: 'Access past order history, download printable GST invoices, manage saved delivery addresses, and view SuperCoins rewards.',
    teluguNarration: 'మీ ప్రొఫైల్ డ్యాష్‌బోర్డ్‌లో పాత ఆర్డర్లు, ప్రింటబుల్ జీఎస్టీ ఇన్వాయిస్‌లు, సేవ్ చేసిన అడ్రస్‌లు మరియు రివార్డ్ పాయింట్లు చూసుకోవచ్చు.',
    englishSubtitles: 'Manage your profile, view order history, print official tax invoices, update saved delivery addresses, and track SuperCoins points.',
    actionUrl: '/account',
    actionText: 'Customer Account',
  },
  {
    id: 12,
    time: '10:05 - 11:00',
    title: 'Ready to Start Shopping!',
    teluguTitle: 'షాపింగ్ ప్రారంభించండి!',
    icon: Sparkles,
    description: 'Join thousands of happy customers shopping on ShopSphere today with confidence and genuine quality.',
    teluguNarration: 'ఇప్పుడే షాప్‌స్పియర్ తో మీ షాపింగ్ ప్రారంభించండి! నాణ్యమైన ఉత్పత్తులు, పారదర్శక ధరలు మరియు నమ్మకమైన కస్టమర్ సేవ మీ సొంతం.',
    englishSubtitles: 'Start shopping now on ShopSphere! Experience reliable e-commerce built for India with honest pricing and prompt customer support.',
    actionUrl: '/products',
    actionText: 'Start Shopping Now',
  },
];

export default function HowToUsePage() {
  return (
    <div className="min-h-screen bg-slate-50/60 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-10">
        {/* Page Hero Header */}
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-xs">
            <Video className="w-4 h-4 text-indigo-600" />
            <span>Official Customer Shopping Guide</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
            How to Use ShopSphere
          </h1>
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            A complete step-by-step customer walkthrough with Telugu narration script, English subtitles, and scene-by-scene navigation based on the actual ShopSphere website.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/products"
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-200 transition-all flex items-center gap-2"
            >
              <span>Start Shopping</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
            <Link
              href="/auth/login"
              className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-bold text-xs transition-all flex items-center gap-2"
            >
              <Smartphone className="w-3.5 h-3.5 text-indigo-600" />
              <span>Login / Register with Mobile OTP</span>
            </Link>
          </div>
        </div>

        {/* Video Player Presentation (Accurate Production State) */}
        <div className="bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-800 text-white">
          <div className="relative aspect-video max-h-[500px] w-full bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex flex-col items-center justify-center p-6 text-center">
            {/* Background Pattern */}
            <div className="absolute inset-0 bg-[radial-gradient(#4f46e5_1px,transparent_1px)] [background-size:24px_24px] opacity-20 pointer-events-none" />

            <div className="relative z-10 space-y-4 max-w-lg">
              <div className="w-16 h-16 rounded-3xl bg-indigo-600 text-white flex items-center justify-center mx-auto shadow-xl shadow-indigo-500/40 animate-pulse">
                <Play className="w-7 h-7 fill-white translate-x-0.5" />
              </div>
              <div className="space-y-1.5">
                <span className="inline-block px-2.5 py-1 rounded-md bg-amber-500/20 text-amber-300 text-[11px] font-bold border border-amber-500/30">
                  Video Production in Progress
                </span>
                <h2 className="text-xl sm:text-2xl font-black">
                  ShopSphere Walkthrough & Customer Guide
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  Screen recording of the actual ShopSphere store with synchronized Telugu voiceover and English subtitles is currently in production. Review the complete chapter breakdown below.
                </p>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] text-slate-300 pt-2">
                <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  <Languages className="w-3.5 h-3.5 text-amber-300" />
                  <span>తెలుగు (Telugu Narration)</span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  <Clock className="w-3.5 h-3.5 text-indigo-300" />
                  <span>12 Scenes / 11 Minutes</span>
                </span>
                <span className="flex items-center gap-1 bg-white/10 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
                  <span>Actual Website UI</span>
                </span>
              </div>
            </div>
          </div>

          {/* Video Control Bar Placeholder */}
          <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>Full Production Script Ready</span>
            </div>
            <div className="flex items-center gap-4">
              <span>Resolution: 1080p Full HD</span>
              <span>Audio: Telugu (Stereo)</span>
              <span>Subtitles: English (CC)</span>
            </div>
          </div>
        </div>

        {/* 12-Chapter Step-by-Step Breakdown */}
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900">
                Video Chapters & Bilingual Script
              </h2>
              <p className="text-xs sm:text-sm text-slate-500">
                Explore each scene of the shopping experience with Telugu narration and English subtitles.
              </p>
            </div>
            <span className="px-3 py-1 rounded-xl bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
              12 Scenes Total
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {CHAPTERS.map((ch) => {
              const Icon = ch.icon;
              return (
                <div
                  key={ch.id}
                  className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            Scene {ch.id} • {ch.time}
                          </span>
                          <h3 className="text-sm font-black text-slate-900 leading-snug">
                            {ch.title}
                          </h3>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {ch.description}
                    </p>

                    {/* Telugu Narration Box */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl space-y-1">
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-800 uppercase tracking-wide">
                        <Languages className="w-3 h-3" />
                        <span>తెలుగు వివరణ (Telugu Narration)</span>
                      </div>
                      <p className="text-xs text-amber-950 font-medium leading-relaxed">
                        &quot;{ch.teluguNarration}&quot;
                      </p>
                    </div>

                    {/* English Subtitles */}
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-1">
                      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wide">
                        English Subtitles
                      </div>
                      <p className="text-xs text-slate-700 italic leading-relaxed">
                        &quot;{ch.englishSubtitles}&quot;
                      </p>
                    </div>
                  </div>

                  {ch.actionUrl && (
                    <div className="pt-2 border-t border-slate-100">
                      <Link
                        href={ch.actionUrl}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                      >
                        <span>{ch.actionText || 'Try this feature'}</span>
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Written Step-by-Step Shopping Guide */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">
              Quick 4-Step Written Shopping Guide
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              How to place an order on ShopSphere in under 2 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                1
              </div>
              <h4 className="text-xs font-bold text-slate-900">Find Your Product</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Use the top search bar or browse 10 official categories to discover over 445 products with genuine discounts.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                2
              </div>
              <h4 className="text-xs font-bold text-slate-900">Add to Cart & PIN Check</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Check delivery time with your 6-digit PIN code, adjust quantity, and add to Cart or click Buy Now.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                3
              </div>
              <h4 className="text-xs font-bold text-slate-900">Mobile OTP Sign In</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Enter your 10-digit mobile number, type the 6-digit SMS code, and confirm your delivery address.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2">
              <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-xs flex items-center justify-center">
                4
              </div>
              <h4 className="text-xs font-bold text-slate-900">Pay & Track Live</h4>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Pay via UPI, Cards, Net Banking, or Cash on Delivery. Track each shipment stage live until delivery.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom CTA Banner */}
        <div className="rounded-3xl bg-gradient-to-r from-indigo-900 via-indigo-800 to-slate-900 p-6 sm:p-10 text-white text-center space-y-4 shadow-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-amber-300 text-xs font-bold backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Over 445 Quality Products In Stock</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-black">
            Experience the Future of Indian E-Commerce
          </h2>
          <p className="text-xs sm:text-sm text-indigo-200 max-w-xl mx-auto">
            Transparent pricing, 100% secure checkout, mobile-first OTP login, and 7-day doorstep returns.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Link
              href="/products"
              className="px-6 py-3 rounded-2xl bg-white hover:bg-slate-100 text-indigo-900 font-bold text-xs shadow-lg transition-all"
            >
              Start Shopping Now
            </Link>
            <Link
              href="/benefits"
              className="px-6 py-3 rounded-2xl bg-indigo-700/60 hover:bg-indigo-700 border border-indigo-400/30 text-white font-bold text-xs transition-all"
            >
              Learn Customer Benefits
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
