/**
 * EquipHK Language Context
 * Supports English (en) and Traditional Chinese (zh-HK)
 * Language preference is persisted in localStorage
 *
 * API (backward-compatible with existing usage):
 *   const { lang, setLang, t } = useLanguage();
 *   t("en string", "中文字串")  — inline translation
 *   tk("translation_key")       — keyed translation from dictionary
 *   pickLang(en, zh, lang)      — pick from DB row fields
 */
import { createContext, useContext, useState, useCallback, type ReactNode } from "react";

export type Lang = "en" | "zh";

// ─── Static Translations Dictionary ──────────────────────────────────────────
export const TRANSLATIONS = {
  // ── Navbar ─────────────────────────────────────────────────────────────────
  nav_equipment: { en: "Equipment", zh: "設備" },
  nav_consumables: { en: "Consumables", zh: "耗材" },
  nav_bundles: { en: "Bundles", zh: "套裝" },
  nav_how_it_works: { en: "How It Works", zh: "使用流程" },
  nav_pricing: { en: "Pricing", zh: "收費" },
  nav_contact: { en: "Contact", zh: "聯絡我們" },
  nav_sign_in: { en: "Sign In", zh: "登入" },
  nav_sign_out: { en: "Sign Out", zh: "登出" },
  nav_account: { en: "Account", zh: "帳戶" },
  nav_favourites: { en: "Your favourites", zh: "我的收藏" },
  nav_cart: { en: "View rental cart", zh: "查看租借購物車" },
  nav_toggle_menu: { en: "Toggle menu", zh: "切換選單" },
  nav_switch_to_zh: { en: "切換至中文", zh: "Switch to English" },

  // ── Hero Section ────────────────────────────────────────────────────────────
  hero_eyebrow: { en: "Hong Kong's Equipment Partner", zh: "香港設備租借夥伴" },
  hero_headline_1: { en: "Rent Anything.", zh: "任何設備，隨時租借。" },
  hero_headline_2: { en: "Build Everything.", zh: "成就每個工程。" },
  hero_subheadline: {
    en: "From power drills to crawler cranes — Equip.HK delivers certified, inspection-ready equipment across Hong Kong. Serving DIY enthusiasts and Tier-1 contractors alike.",
    zh: "由電動工具到履帶式起重機——Equip.HK 為香港各地提供經認證、檢驗就緒的設備，服務 DIY 愛好者至一級承建商。",
  },
  hero_cta_browse: { en: "Browse Equipment", zh: "瀏覽設備" },
  hero_cta_quote: { en: "Request a Quote", zh: "索取報價" },
  hero_stat_units: { en: "Equipment Units", zh: "設備數量" },
  hero_stat_sla: { en: "Emergency SLA", zh: "緊急服務" },
  hero_stat_compliant: { en: "Fully Compliant", zh: "全面合規" },

  // ── Navbar Extended ───────────────────────────────────────────────────────────
  nav_my_account: { en: "My Account", zh: "我的帳戶" },
  nav_admin_panel: { en: "Admin Panel", zh: "管理員面板" },
  nav_manager_panel: { en: "Manager Panel", zh: "經理面板" },
  nav_warehouse_panel: { en: "Warehouse Panel", zh: "倉庫面板" },

  // ── How It Works ────────────────────────────────────────────────────────────
  how_eyebrow: { en: "Simple Process", zh: "簡單流程" },
  how_title: { en: "How It Works", zh: "使用流程" },
  how_subtitle: {
    en: "Get the equipment you need in three straightforward steps. No hassle, no hidden fees, no surprises.",
    zh: "三個簡單步驟，即可獲取所需設備。無繁瑣手續，無隱藏費用，無意外驚喜。",
  },
  how_step1_title: { en: "Search & Select", zh: "搜尋及選擇" },
  how_step1_desc: {
    en: "Browse our catalog by tool type or project category. Check real-time availability and compare specs instantly.",
    zh: "按工具類型或項目類別瀏覽目錄，即時查看庫存狀況及比較規格。",
  },
  how_step2_title: { en: "Book & Verify", zh: "預訂及驗證" },
  how_step2_desc: {
    en: "Select your rental dates, upload your HKID for verification, and pay securely via credit card or FPS.",
    zh: "選擇租借日期，上傳香港身份證進行驗證，並透過信用卡或轉數快安全付款。",
  },
  how_step3_title: { en: "Delivered or Collected", zh: "送貨或自取" },
  how_step3_desc: {
    en: "Choose delivery to your site across Hong Kong, or collect for free from our Shing Fung Industrial Park pick-up point in Sai Kung. Equipment arrives inspected, tested, and certified — ready to use.",
    zh: "可選擇送貨至香港各地工地，或免費到西貢勝豐工業園自取。所有設備均經過檢驗、測試及認證，即取即用。",
  },
  how_step3_badge: { en: "Free self-collection available", zh: "免費自取" },

  // ── Equipment Section ───────────────────────────────────────────────────────
  equipment_eyebrow: { en: "Our Fleet", zh: "我們的設備" },
  equipment_title: { en: "Equipment Hire", zh: "設備租借" },
  equipment_subtitle: {
    en: "Certified, inspection-ready equipment for every project scale.",
    zh: "適合各類工程規模的認證設備，檢驗就緒。",
  },
  equipment_available: { en: "Available", zh: "有存貨" },
  equipment_out_of_stock: { en: "Out of Stock", zh: "暫時缺貨" },

  // ── Shared availability / pricing shorthands ────────────────────────────────
  available: { en: "Available", zh: "有存貨" },
  out_of_stock: { en: "Out of Stock", zh: "暫時缺貨" },
  per_day: { en: "/day", zh: "/日" },
  poa: { en: "POA", zh: "價格待定" },
  badge_new: { en: "New", zh: "新品" },

  // ── Favourites toasts ───────────────────────────────────────────────────────
  fav_sign_in: { en: "Sign in to save favourites", zh: "請登入以儲存收藏" },
  fav_added: { en: "Added to favourites", zh: "已加入收藏" },
  fav_removed: { en: "Removed from favourites", zh: "已從收藏移除" },

  // ── Comparison ──────────────────────────────────────────────────────────────
  compare_add: { en: "+ Compare", zh: "+ 比較" },
  compare_in: { en: "✓ Compare", zh: "✓ 已加入比較" },
  compare_added: { en: "added to comparison", zh: "已加入比較" },

  // ── Breadcrumbs ─────────────────────────────────────────────────────────────
  breadcrumb_home: { en: "Home", zh: "主頁" },
  breadcrumb_equipment: { en: "Equipment", zh: "設備" },
  breadcrumb_bundles: { en: "Bundles", zh: "套裝" },
  breadcrumb_consumables: { en: "Consumables", zh: "耗材" },

  // ── Equipment Catalogue page ─────────────────────────────────────────────────
  cat_all_equipment: { en: "All Equipment", zh: "所有設備" },
  cat_search_placeholder: { en: "Search equipment, brand, model...", zh: "搜尋設備、品牌、型號..." },
  cat_browse_all: { en: "Browse All Equipment", zh: "瀏覽所有設備" },

  // ── Sort options ─────────────────────────────────────────────────────────────
  sort_name_az: { en: "Name A–Z", zh: "名稱 A–Z" },
  sort_price_low: { en: "Price: Low–High", zh: "價格：由低至高" },
  sort_price_high: { en: "Price: High–Low", zh: "價格：由高至低" },

  // ── Filter labels ─────────────────────────────────────────────────────────────
  filter_brand: { en: "Brand", zh: "品牌" },
  filter_all_brands: { en: "All Brands", zh: "所有品牌" },
  filter_availability: { en: "Availability", zh: "庫存狀況" },
  filter_all_items: { en: "All Items", zh: "所有項目" },
  filter_available_now: { en: "Available Now", zh: "即時可用" },
  filter_power_supply: { en: "Power Supply", zh: "電源供應" },
  filter_active_label: { en: "Filters:", zh: "篩選條件：" },
  filter_clear_all: { en: "Clear all", zh: "清除全部" },

  // ── Empty states ─────────────────────────────────────────────────────────────
  empty_no_items: { en: "No Items Found", zh: "找不到項目" },

  // ── Search bar ───────────────────────────────────────────────────────────────
  search_placeholder: { en: "Find Your Tool", zh: "搜尋工具" },

  // ── Equipment Section (homepage) ─────────────────────────────────────────────
  equip_new_arrivals: { en: "New Arrivals", zh: "最新到貨" },
  equip_browse_full: { en: "Browse Full Catalogue", zh: "瀏覽完整目錄" },
  equipment_sign_in_to_save: { en: "Sign in to save favourites", zh: "登入以儲存收藏" },
  equipment_added_to_fav: { en: "Added to favourites", zh: "已加入收藏" },
  equipment_removed_from_fav: { en: "Removed from favourites", zh: "已從收藏中移除" },
  equipment_view_all: { en: "View All Equipment", zh: "查看所有設備" },
  equipment_loading: { en: "Loading...", zh: "載入中..." },
  equipment_no_items: { en: "No items found — try clearing filters", zh: "找不到項目 — 請嘗試清除篩選條件" },
  equipment_search_placeholder: { en: "Search equipment, brand, model...", zh: "搜尋設備、品牌、型號..." },
  equipment_per_day: { en: "/day", zh: "/日" },
  equipment_per_week: { en: "/week", zh: "/週" },
  equipment_per_month: { en: "/month", zh: "/月" },
  equipment_add_to_cart: { en: "Add to Cart", zh: "加入購物車" },
  equipment_view_details: { en: "View Details", zh: "查看詳情" },
  equipment_new_arrival: { en: "New", zh: "新品" },
  equipment_featured: { en: "Featured", zh: "精選" },

  // ── Enterprise Section ──────────────────────────────────────────────────────
  enterprise_eyebrow: { en: "Enterprise Solutions", zh: "企業解決方案" },
  enterprise_title: { en: "Built for Contractors", zh: "專為承建商而設" },
  enterprise_subtitle: {
    en: "Dedicated account management, consolidated invoicing, and compliance packages for Tier-1 contractors.",
    zh: "為一級承建商提供專屬客戶管理、綜合發票及合規套裝服務。",
  },
  enterprise_key_account: { en: "Key Account Management", zh: "重點客戶管理" },
  enterprise_invoicing: { en: "Consolidated Invoicing", zh: "綜合發票" },
  enterprise_compliance: { en: "Full Compliance Package", zh: "完整合規套裝" },
  enterprise_dashboard: { en: "Project Dashboard", zh: "項目儀表板" },
  enterprise_cta: { en: "Enquire About Enterprise", zh: "企業查詢" },
  enterprise_trusted_by: { en: "Trusted by Hong Kong's leading contractors", zh: "獲香港頂尖承建商信賴" },
  enterprise_fleet_util: { en: "Fleet Utilization", zh: "設備使用率" },
  enterprise_dso: { en: "Days Sales Outstanding", zh: "應收帳款天數" },
  enterprise_volume: { en: "Volume Discounts", zh: "批量折扣" },
  enterprise_depots: { en: "Depot Locations", zh: "倉庫位置" },

  // ── Safety Section ──────────────────────────────────────────────────────────
  safety_eyebrow: { en: "Safety & Compliance", zh: "安全與合規" },
  safety_title: { en: "Safety First", zh: "安全第一" },
  safety_subtitle: {
    en: "Every piece of equipment meets Hong Kong's statutory requirements under Cap. 59 and Cap. 59I.",
    zh: "所有設備均符合香港《第59章》及《第59I章》的法定要求。",
  },
  safety_cap59: { en: "Cap. 59 Compliant", zh: "符合第59章" },
  safety_cap59i: { en: "Cap. 59I Certified", zh: "第59I章認證" },
  safety_inspection: { en: "Pre-Rental Inspection", zh: "租借前檢驗" },
  safety_inspection_desc: {
    en: "Rigorous documented inspection checklist completed for every equipment category.",
    zh: "每類設備均完成嚴格的書面檢驗清單。",
  },
  safety_audit: { en: "Digital Audit Trail", zh: "數碼審計追蹤" },
  safety_epd: { en: "EPD Registered", zh: "環保署登記" },
  safety_liability: { en: "HK$10M+ Liability", zh: "逾港幣1,000萬責任保險" },

  // ── Pricing Section ─────────────────────────────────────────────────────────
  pricing_eyebrow: { en: "Transparent Pricing", zh: "透明收費" },
  pricing_title: { en: "Simple, Honest Pricing", zh: "簡單誠實的收費" },
  pricing_subtitle: {
    en: "No hidden fees. No surprises. Pay for what you use.",
    zh: "無隱藏費用，無意外，按使用付費。",
  },
  pricing_casual: { en: "Casual", zh: "散客" },
  pricing_casual_desc: { en: "DIY & One-Off Projects", zh: "DIY 及單次項目" },
  pricing_casual_price: { en: "Pay-As-You-Go", zh: "按次付費" },
  pricing_trade_pro: { en: "Trade Pro", zh: "貿易專業" },
  pricing_trade_pro_desc: { en: "Frequent Renters & Small Contractors", zh: "頻繁租借者及小型承建商" },
  pricing_trade_pro_price: { en: "From HK$499", zh: "由港幣499元起" },
  pricing_enterprise: { en: "Enterprise", zh: "企業" },
  pricing_enterprise_desc: { en: "Tier-1 Contractors & Large Projects", zh: "一級承建商及大型項目" },
  pricing_enterprise_price: { en: "Custom", zh: "度身訂造" },
  pricing_start_renting: { en: "Start Renting", zh: "立即租借" },
  pricing_contact_sales: { en: "Contact Sales", zh: "聯絡銷售" },
  pricing_everything_in: { en: "Everything in", zh: "包含所有" },
  pricing_plus: { en: "plus:", zh: "功能，加上：" },
  pricing_standard_rates: { en: "Standard published rates", zh: "標準公開收費" },
  pricing_full_catalog: { en: "Access to full B2C tool catalog", zh: "完整 B2C 工具目錄" },
  pricing_online_booking: { en: "Online booking & real-time availability", zh: "網上預訂及即時庫存查詢" },
  pricing_hkid: { en: "HKID verification + card hold deposit", zh: "香港身份證驗證 + 信用卡押金" },
  pricing_delivery: { en: "Delivery across Hong Kong", zh: "全港送貨" },
  pricing_insurance: { en: "Standard equipment insurance included", zh: "包含標準設備保險" },
  pricing_support: { en: "Email & phone support", zh: "電郵及電話支援" },
  pricing_priority_booking: { en: "Priority booking & equipment holds", zh: "優先預訂及設備保留" },

  // ── Why Section ─────────────────────────────────────────────────────────────
  why_eyebrow: { en: "Why Equip.HK", zh: "為何選擇 Equip.HK" },
  why_title: { en: "The Smarter Choice", zh: "更聰明的選擇" },
  why_digital_booking: { en: "Digital Booking", zh: "數碼預訂" },
  why_digital_booking_us: { en: "Fully integrated B2C/B2B portals", zh: "完整整合的 B2C/B2B 平台" },
  why_target_market: { en: "Target Market", zh: "目標市場" },
  why_target_market_us: { en: "Dual (B2C & B2B)", zh: "雙軌（B2C 及 B2B）" },
  why_compliance: { en: "Compliance Tracking", zh: "合規追蹤" },
  why_compliance_us: { en: "Digital, auditable logs", zh: "數碼可審計記錄" },
  why_pricing_model: { en: "Pricing Model", zh: "收費模式" },
  why_pricing_us: { en: "Dynamic, utilization-based", zh: "動態、按使用率計算" },
  why_emergency_sla: { en: "Emergency SLA", zh: "緊急服務水平協議" },
  why_emergency_us: { en: "4-hour response", zh: "4小時響應" },
  why_phone_email: { en: "Phone/Email only", zh: "僅限電話/電郵" },
  why_basic_form: { en: "Basic inquiry form", zh: "基本查詢表格" },
  why_b2b_heavy: { en: "B2B Heavy Plant only", zh: "僅限 B2B 重型機械" },
  why_b2b_general: { en: "B2B General Construction", zh: "B2B 一般建築" },
  why_paper_based: { en: "Paper-based", zh: "紙本記錄" },
  why_static_pricing: { en: "Static, negotiated", zh: "固定協議收費" },
  why_best_effort: { en: "Best effort", zh: "盡力而為" },
  why_equiphk: { en: "Equip.HK", zh: "Equip.HK" },
  why_competitor_1: { en: "Competitor A", zh: "競爭對手 A" },
  why_competitor_2: { en: "Competitor B", zh: "競爭對手 B" },

  // ── Contact Section ─────────────────────────────────────────────────────────
  contact_eyebrow: { en: "Get In Touch", zh: "聯絡我們" },
  contact_title: { en: "Contact Us", zh: "聯絡我們" },
  contact_subtitle: {
    en: "Ready to rent? Have questions about our fleet? Our team is here to help — whether you need a single drill or a fleet of cranes.",
    zh: "準備好租借了嗎？對我們的設備有疑問？無論您需要一台電鑽還是一批起重機，我們的團隊隨時為您服務。",
  },
  contact_form_title: { en: "Send Us a Message", zh: "發送訊息" },
  contact_full_name: { en: "Full Name *", zh: "全名 *" },
  contact_email: { en: "Email *", zh: "電郵 *" },
  contact_company: { en: "Company", zh: "公司" },
  contact_phone: { en: "Phone", zh: "電話" },
  contact_inquiry_type: { en: "Inquiry Type", zh: "查詢類型" },
  contact_message: { en: "Message *", zh: "訊息 *" },
  contact_send: { en: "Send Message", zh: "發送訊息" },
  contact_sending: { en: "Sending...", zh: "發送中..." },
  contact_success: { en: "Thank you! We'll get back to you within 24 hours.", zh: "謝謝！我們將在24小時內回覆您。" },
  contact_error: { en: "Something went wrong. Please try again.", zh: "出現錯誤，請重試。" },
  contact_name_placeholder: { en: "Your name", zh: "您的姓名" },
  contact_email_placeholder: { en: "your@email.com", zh: "您的電郵" },
  contact_company_placeholder: { en: "Company name (optional)", zh: "公司名稱（選填）" },
  contact_phone_placeholder: { en: "+852 XXXX XXXX", zh: "+852 XXXX XXXX" },
  contact_message_placeholder: {
    en: "Tell us about your project or equipment needs...",
    zh: "請告訴我們您的項目或設備需求...",
  },
  contact_inquiry_b2c: { en: "DIY / Small Trade Rental", zh: "DIY / 小型貿易租借" },
  contact_inquiry_b2b: { en: "Enterprise / B2B Inquiry", zh: "企業 / B2B 查詢" },
  contact_inquiry_quote: { en: "Request a Quote", zh: "索取報價" },
  contact_inquiry_support: { en: "Technical Support", zh: "技術支援" },
  contact_inquiry_other: { en: "Other", zh: "其他" },
  contact_depots: { en: "Our Depots", zh: "我們的倉庫" },
  contact_get_directions: { en: "Get Directions", zh: "獲取路線" },
  contact_24_7: { en: "24/7 AI Support Line", zh: "24/7 人工智能支援熱線" },
  contact_24_7_desc: {
    en: "Critical equipment breakdown on an active site? Our AI triage assistant is available 24/7 — use the chat button on this page for instant diagnostics and escalation.",
    zh: "工地設備緊急故障？我們的人工智能分診助手全天候待命——使用本頁聊天按鈕即時診斷及升級處理。",
  },
  contact_hours: { en: "Mon-Sat: 09:00 - 18:00", zh: "週一至週六：09:00 - 18:00" },
  contact_pickup: { en: "Pick-Up & Drop-Off Point", zh: "自取及還貨點" },
  contact_dispatch: { en: "Equipment Dispatch & Returns", zh: "設備調度及歸還" },

  // ── Footer ──────────────────────────────────────────────────────────────────
  footer_tagline: {
    en: "Hong Kong's digital-first equipment rental platform. From power drills to crawler cranes — inspected, certified, and delivered.",
    zh: "香港首個數碼優先設備租借平台。由電動工具到履帶式起重機——經檢驗、認證及送貨上門。",
  },
  footer_equipment: { en: "Equipment", zh: "設備" },
  footer_company: { en: "Company", zh: "公司" },
  footer_support: { en: "Support", zh: "支援" },
  footer_power_tools: { en: "Power Tools", zh: "電動工具" },
  footer_heavy_plant: { en: "Heavy Plant", zh: "重型機械" },
  footer_aerial_platforms: { en: "Aerial Platforms", zh: "高空工作平台" },
  footer_aerial: { en: "Aerial Platforms", zh: "高空工作平台" },
  footer_generators: { en: "Generators", zh: "發電機" },
  footer_safety_equipment: { en: "Safety Equipment", zh: "安全設備" },
  footer_safety_equip: { en: "Safety Equipment", zh: "安全設備" },
  footer_equipment_col: { en: "Equipment", zh: "設備" },
  footer_company_col: { en: "Company", zh: "公司" },
  footer_support_col: { en: "Support", zh: "支援" },
  footer_about: { en: "About Equip.HK", zh: "關於 Equip.HK" },
  footer_safety_compliance: { en: "Safety & Compliance", zh: "安全與合規" },
  footer_enterprise: { en: "Enterprise Solutions", zh: "企業解決方案" },
  footer_pricing: { en: "Pricing", zh: "收費" },
  footer_careers: { en: "Careers", zh: "招聘" },
  footer_contact: { en: "Contact Us", zh: "聯絡我們" },
  footer_faq: { en: "FAQs", zh: "常見問題" },
  footer_delivery: { en: "Delivery Info", zh: "送貨資訊" },
  footer_terms: { en: "Terms & Conditions", zh: "條款及細則" },
  footer_privacy: { en: "Privacy Policy", zh: "私隱政策" },
  footer_copyright: {
    en: "A Kowloon Construction Company (KCC) Enterprise. All rights reserved.",
    zh: "九龍建設公司（KCC）旗下企業。版權所有。",
  },
  footer_cap59: { en: "Cap. 59 & Cap. 59I Compliant", zh: "符合第59章及第59I章" },
  footer_epd: { en: "EPD Registered", zh: "環保署登記" },

  // ── Equipment Catalogue Page ────────────────────────────────────────────────
  catalogue_title: { en: "Equipment Hire", zh: "設備租借" },
  catalogue_subtitle: {
    en: "Certified, inspection-ready equipment for every project scale.",
    zh: "適合各類工程規模的認證設備，檢驗就緒。",
  },
  catalogue_search: { en: "Search equipment, brand, model...", zh: "搜尋設備、品牌、型號..." },
  catalogue_all_categories: { en: "All Categories", zh: "所有類別" },
  catalogue_filter: { en: "Filter", zh: "篩選" },
  catalogue_sort: { en: "Sort", zh: "排序" },
  catalogue_loading: { en: "Loading...", zh: "載入中..." },
  catalogue_no_results: { en: "No items found — try clearing filters", zh: "找不到項目 — 請嘗試清除篩選條件" },
  catalogue_clear_filters: { en: "Clear Filters", zh: "清除篩選" },
  catalogue_showing: { en: "Showing", zh: "顯示" },
  catalogue_items: { en: "items", zh: "項目" },

  // ── Product Detail Page ─────────────────────────────────────────────────────
  product_specifications: { en: "Specifications", zh: "規格" },
  product_brand: { en: "Brand", zh: "品牌" },
  product_model: { en: "Model", zh: "型號" },
  product_daily_rate: { en: "Daily Rate", zh: "日租" },
  product_weekly_rate: { en: "Weekly Rate", zh: "週租" },
  product_monthly_rate: { en: "Monthly Rate", zh: "月租" },
  product_includes: { en: "What's Included", zh: "包含配件" },
  product_add_to_cart: { en: "Add to Cart", zh: "加入購物車" },
  product_request_quote: { en: "Request a Quote", zh: "索取報價" },
  product_share: { en: "Share", zh: "分享" },
  product_link_copied: { en: "Link copied to clipboard!", zh: "連結已複製！" },
  product_back: { en: "Back to Equipment", zh: "返回設備列表" },
  product_related: { en: "Related Equipment", zh: "相關設備" },
  product_consumables: { en: "Consumables & Supplies", zh: "耗材及用品" },
  product_in_stock: { en: "In Stock", zh: "有存貨" },
  product_out_of_stock: { en: "Out of Stock", zh: "暫時缺貨" },
  product_deposit: { en: "Deposit", zh: "押金" },
  product_poa: { en: "POA", zh: "價格待定" },
  product_product: { en: "Product", zh: "產品" },
  product_equipment: { en: "Equipment", zh: "設備" },

  // ── Bundles Page ────────────────────────────────────────────────────────────
  bundles_title: { en: "Equipment Bundles", zh: "設備套裝" },
  bundles_subtitle: {
    en: "Save more with our curated equipment bundles for common project types.",
    zh: "選用我們為常見項目類型精心搭配的設備套裝，享受更多優惠。",
  },
  bundles_all: { en: "All Bundles", zh: "所有套裝" },
  bundles_savings: { en: "Save", zh: "節省" },
  bundles_items: { en: "items", zh: "項" },
  bundles_view: { en: "View Bundle", zh: "查看套裝" },
  bundles_sort_name_az: { en: "Name A–Z", zh: "名稱 A–Z" },
  bundles_sort_name_za: { en: "Name Z–A", zh: "名稱 Z–A" },
  bundles_sort_price_low: { en: "Price: Low to High", zh: "價格：由低至高" },
  bundles_sort_price_high: { en: "Price: High to Low", zh: "價格：由高至低" },
  bundles_sort_savings: { en: "Biggest Savings", zh: "最大節省" },
  bundles_sort_items: { en: "Most Items", zh: "最多項目" },
  bundles_waterproofing: { en: "Waterproofing", zh: "防水" },
  bundles_surface_prep: { en: "Surface Preparation", zh: "表面處理" },
  bundles_concrete: { en: "Concrete & Formwork", zh: "混凝土及模板" },

  // ── Consumables Page ────────────────────────────────────────────────────────
  consumables_title: { en: "Consumables & Supplies", zh: "耗材及用品" },
  consumables_subtitle: {
    en: "Everything you need to complete your project — delivered with your equipment.",
    zh: "完成項目所需的一切——隨設備一同送達。",
  },
  consumables_search: { en: "Search consumables...", zh: "搜尋耗材..." },
  consumables_no_results: { en: "Try adjusting your search terms.", zh: "請嘗試調整搜尋詞語。" },
  consumables_empty: { en: "No products available in this category yet.", zh: "此類別暫無產品。" },
  consumables_poa: { en: "POA", zh: "價格待定" },
  consumables_add_to_cart: { en: "Add to Cart", zh: "加入購物車" },
  consumables_waterproofing: { en: "Waterproofing", zh: "防水" },
  consumables_surface_prep: { en: "Surface Preparation", zh: "表面處理" },
  consumables_concrete: { en: "Concrete & Formwork", zh: "混凝土及模板" },
  consumables_general: { en: "General", zh: "一般" },

  // ── Rental Cart ─────────────────────────────────────────────────────────────
  cart_title: { en: "Rental Cart", zh: "租借購物車" },
  cart_empty: { en: "Your cart is empty", zh: "您的購物車是空的" },
  cart_empty_desc: { en: "Browse our equipment and add items to get started.", zh: "瀏覽我們的設備並添加項目以開始。" },
  cart_browse: { en: "Browse Equipment", zh: "瀏覽設備" },
  cart_subtotal: { en: "Subtotal", zh: "小計" },
  cart_delivery: { en: "Delivery", zh: "送貨費" },
  cart_deposit: { en: "Deposit (refundable)", zh: "押金（可退還）" },
  cart_total: { en: "Total", zh: "總計" },
  cart_checkout: { en: "Proceed to Checkout", zh: "前往結帳" },
  cart_remove: { en: "Remove", zh: "移除" },
  cart_qty: { en: "Qty", zh: "數量" },
  cart_start_date: { en: "Start Date", zh: "開始日期" },
  cart_end_date: { en: "End Date", zh: "結束日期" },
  cart_duration: { en: "Duration", zh: "租借期" },
  cart_days: { en: "days", zh: "天" },
  cart_weeks: { en: "weeks", zh: "週" },

  // ── Account Page ────────────────────────────────────────────────────────────
  account_title: { en: "My Account", zh: "我的帳戶" },
  account_profile: { en: "Profile", zh: "個人資料" },
  account_orders: { en: "My Orders", zh: "我的訂單" },
  account_favourites: { en: "Favourites", zh: "收藏" },
  account_membership: { en: "Membership", zh: "會員資格" },
  account_logout: { en: "Sign Out", zh: "登出" },

  // ── FAQ Page ────────────────────────────────────────────────────────────────
  faq_title: { en: "Frequently Asked Questions", zh: "常見問題" },
  faq_subtitle: {
    en: "Everything you need to know about renting equipment from Equip.HK.",
    zh: "關於從 Equip.HK 租借設備的一切資訊。",
  },
  faq_getting_started: { en: "Getting Started", zh: "入門指南" },
  faq_booking: { en: "Booking & Availability", zh: "預訂及庫存" },
  faq_delivery_section: { en: "Delivery & Collection", zh: "送貨及自取" },
  faq_payment: { en: "Payment & Deposits", zh: "付款及押金" },
  faq_compliance: { en: "Safety & Compliance", zh: "安全與合規" },

  // ── About Page ──────────────────────────────────────────────────────────────
  about_title: { en: "About Equip.HK", zh: "關於 Equip.HK" },
  about_subtitle: {
    en: "Hong Kong's digital-first equipment rental platform, built by contractors for contractors.",
    zh: "香港首個數碼優先設備租借平台，由承建商為承建商而建。",
  },
  about_stat_units: { en: "Equipment Units", zh: "設備數量" },
  about_stat_experience: { en: "Years Industry Experience", zh: "行業經驗年數" },
  about_stat_clients: { en: "Tier 1 Contractor Clients", zh: "一級承建商客戶" },
  about_stat_rate: { en: "Starting Day Rate", zh: "起始日租" },
  about_safety_first: { en: "Safety First", zh: "安全第一" },
  about_always_ready: { en: "Always Ready", zh: "隨時就緒" },
  about_built_for: { en: "Built for Contractors", zh: "專為承建商而設" },
  about_transparent: { en: "Transparent Pricing", zh: "透明收費" },

  // ── Delivery Info Page ──────────────────────────────────────────────────────
  delivery_title: { en: "Delivery Information", zh: "送貨資訊" },
  delivery_hki: { en: "Hong Kong Island", zh: "香港島" },
  delivery_kln: { en: "Kowloon", zh: "九龍" },
  delivery_nt_urban: { en: "New Territories (Urban)", zh: "新界（市區）" },
  delivery_nt_remote: { en: "New Territories (Remote)", zh: "新界（偏遠地區）" },
  delivery_islands: { en: "Outlying Islands", zh: "離島" },
  delivery_same_day: { en: "Same day or next day", zh: "當日或翌日" },
  delivery_self_collect: { en: "Free Self-Collection", zh: "免費自取" },
  delivery_self_collect_desc: {
    en: "Collect from our Shing Fung Industrial Park depot in Sai Kung.",
    zh: "到西貢勝豐工業園倉庫自取。",
  },

  // ── Careers Page ────────────────────────────────────────────────────────────
  careers_title: { en: "Careers at Equip.HK", zh: "Equip.HK 招聘" },
  careers_subtitle: {
    en: "Join Hong Kong's fastest-growing equipment rental company.",
    zh: "加入香港增長最快的設備租借公司。",
  },
  careers_apply: { en: "Apply Now", zh: "立即申請" },
  careers_full_time: { en: "Full-time", zh: "全職" },
  careers_part_time: { en: "Part-time", zh: "兼職" },
  careers_contract: { en: "Contract", zh: "合約" },

  // ── Get a Quote Page ────────────────────────────────────────────────────────
  quote_title: { en: "Get a Quote", zh: "索取報價" },
  quote_subtitle: {
    en: "Tell us about your project and we'll prepare a custom quote.",
    zh: "告訴我們您的項目詳情，我們將為您準備度身訂造的報價。",
  },
  quote_submit: { en: "Submit Quote Request", zh: "提交報價申請" },
  quote_submitting: { en: "Submitting...", zh: "提交中..." },

  // ── New Arrivals ────────────────────────────────────────────────────────────
  new_arrivals_title: { en: "New Arrivals", zh: "最新到貨" },
  new_arrivals_subtitle: { en: "Recently added to our fleet", zh: "最近加入我們的設備" },
  new_arrivals_in_stock: { en: "In Stock", zh: "有存貨" },
  new_arrivals_view_all: { en: "View All New Arrivals", zh: "查看所有新品" },

  // ── Common / Shared ─────────────────────────────────────────────────────────
  common_loading: { en: "Loading...", zh: "載入中..." },
  common_error: { en: "Something went wrong", zh: "出現錯誤" },
  common_retry: { en: "Try Again", zh: "重試" },
  common_back: { en: "Back", zh: "返回" },
  common_save: { en: "Save", zh: "儲存" },
  common_cancel: { en: "Cancel", zh: "取消" },
  common_confirm: { en: "Confirm", zh: "確認" },
  common_delete: { en: "Delete", zh: "刪除" },
  common_edit: { en: "Edit", zh: "編輯" },
  common_view: { en: "View", zh: "查看" },
  common_close: { en: "Close", zh: "關閉" },
  common_search: { en: "Search", zh: "搜尋" },
  common_filter: { en: "Filter", zh: "篩選" },
  common_sort: { en: "Sort", zh: "排序" },
  common_all: { en: "All", zh: "全部" },
  common_none: { en: "None", zh: "無" },
  common_yes: { en: "Yes", zh: "是" },
  common_no: { en: "No", zh: "否" },
  common_or: { en: "or", zh: "或" },
  common_and: { en: "and", zh: "及" },
  common_hkd: { en: "HK$", zh: "港幣 " },
  common_per_day: { en: "/day", zh: "/日" },
  common_per_week: { en: "/week", zh: "/週" },
  common_per_month: { en: "/month", zh: "/月" },
  common_poa: { en: "POA", zh: "價格待定" },
  common_in_stock: { en: "In Stock", zh: "有存貨" },
  common_out_of_stock: { en: "Out of Stock", zh: "暫時缺貨" },
  common_new: { en: "New", zh: "新品" },
  common_featured: { en: "Featured", zh: "精選" },
  common_page_not_found: { en: "Page Not Found", zh: "找不到頁面" },
  common_go_home: { en: "Go Home", zh: "返回主頁" },
  common_coming_soon: { en: "Coming Soon", zh: "即將推出" },
  common_feature_coming_soon: { en: "Feature coming soon", zh: "功能即將推出" },
  common_professional: { en: "Professional equipment for rent", zh: "專業設備租借" },

  // ── Placeholder / fallback ────────────────────────────────────────────────────
  translation_key: { en: "Translation Key", zh: "翻譯鍵" },
} as const;

export type TranslationKey = keyof typeof TRANSLATIONS;

// ─── Context ──────────────────────────────────────────────────────────────────
interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  /** Inline translation: t("English text", "中文字串") */
  t: (en: string, zh: string) => string;
  /** Key-based translation from the TRANSLATIONS dictionary */
  tk: (key: TranslationKey) => string;
  /** Pick from DB row fields: pickLang(item.name, item.nameZh) */
  pickLang: (en: string | null | undefined, zh: string | null | undefined) => string;
  isZh: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  setLang: () => {},
  t: (en) => en,
  tk: (key) => TRANSLATIONS[key]?.en ?? key,
  pickLang: (en) => en || "",
  isZh: false,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const stored = localStorage.getItem("equiphk_lang");
      if (stored === "zh" || stored === "en") return stored as Lang;
    } catch {}
    // Auto-detect browser language — default to zh for zh-HK/zh-TW/zh users
    const browserLang = navigator.language?.toLowerCase() ?? "";
    return browserLang.startsWith("zh") ? "zh" : "en";
  });

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try { localStorage.setItem("equiphk_lang", l); } catch {}
  }, []);

  const t = useCallback(
    (en: string, zh: string) => (lang === "zh" ? zh : en),
    [lang]
  );

  const tk = useCallback(
    (key: TranslationKey): string => {
      const entry = TRANSLATIONS[key];
      if (!entry) return key;
      return lang === "zh" ? entry.zh : entry.en;
    },
    [lang]
  );

  const pickLangFn = useCallback(
    (en: string | null | undefined, zh: string | null | undefined): string => {
      if (lang === "zh" && zh) return zh;
      return en || "";
    },
    [lang]
  );

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, tk, pickLang: pickLangFn, isZh: lang === "zh" }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}

/**
 * Utility: pick the correct language string from a DB row.
 * e.g. pickLang(item.name, item.nameZh, lang) → "電鑽" or "Drill"
 */
export function pickLang(
  en: string | null | undefined,
  zh: string | null | undefined,
  lang: Lang
): string {
  if (lang === "zh" && zh) return zh;
  return en || "";
}
