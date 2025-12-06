// utils.js - COMPLETE VERSION WITH ALL FUNCTIONS + SEO OPTIMIZATION
const UTILS = {
    // DOM Utilities
    getNestedValue: (obj, path) => {
        if (!obj || !path) return null;
        return path.split('.').reduce((current, key) => current?.[key], obj);
    },

    stopPropagation: (e) => e?.stopPropagation?.(),

    addHidden: (element) => {
        if (element?.classList) element.classList.add('hidden');
    },

    removeHidden: (element) => {
        if (element?.classList) element.classList.remove('hidden');
    },

    toggleHidden: (element) => {
        if (element?.classList) element.classList.toggle('hidden');
    },

    safeQuery: (selector) => {
        try {
            return document.querySelector(selector);
        } catch (error) {
            console.warn('Invalid selector:', selector, error);
            return null;
        }
    },

    safeQueryAll: (selector) => {
        try {
            return document.querySelectorAll(selector);
        } catch (error) {
            console.warn('Invalid selector:', selector, error);
            return [];
        }
    },

    // Performance Utilities
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Validation Utilities
    isKeyboardPattern: (text) => {
        return CONFIG.validation.keyboardPatterns.some(pattern => pattern.test(text));
    },

    isSequentialPattern: (text) => {
        if (text.length < 4) return false;

        // Numeričke sekvence
        if (CONFIG.validation.sequentialPatterns[0].test(text)) return true;

        // Alfabetske sekvence
        for (let i = 0; i <= text.length - 3; i++) {
            const segment = text.substring(i, i + 3);
            if (UTILS.isAlphabeticalSequence(segment)) return true;
        }

        // Mješoviti patterni
        if (/^([a-z]\d){3,}|^(\d[a-z]){3,}/i.test(text)) return true;

        return false;
    },

    isAlphabeticalSequence: (segment) => {
        for (let i = 1; i < segment.length; i++) {
            if (Math.abs(segment.charCodeAt(i) - segment.charCodeAt(i - 1)) !== 1) return false;
        }
        return true;
    },

    hasIsolatedDoubleChars: (text) => {
        const words = text.toLowerCase().split(/\s+/);

        for (let word of words) {
            if (word.length < 2) continue;

            const doubleMatch = word.match(/([a-z])\1/);
            if (doubleMatch && !UTILS.isLegitimateDoubleWord(word)) {
                return true;
            }
        }
        return false;
    },

    isLegitimateDoubleWord: (word) => {
        if (CONFIG.validation.legitimateDoubleWords.has(word)) return true;
        if (word.length <= 2) return false;

        return /^[bcdfghjklmnpqrstvwxyz]{0,2}[aeiou]{1,2}[bcdfghjklmnpqrstvwxyz]{0,2}$/i.test(word) ||
            /^[aeiou]{1,2}[bcdfghjklmnpqrstvwxyz]{1,3}[aeiou]{0,2}$/i.test(word);
    },

    hasMeaningfulStructure: (text) => {
        const words = text.trim().split(/\s+/);
        if (words.length < 2 && text.length > 10) return false;

        const cleanText = text.replace(/[^a-zA-ZčćžšđČĆŽŠĐ]/g, '').toLowerCase();
        const vowels = cleanText.match(/[aeioučćžšđ]/gi);
        const consonants = cleanText.match(/[bcdfghjklmnpqrstvwxyz]/gi);

        if (!vowels || !consonants) return false;

        const vowelRatio = vowels.length / cleanText.length;
        if (vowelRatio < 0.2 || vowelRatio > 0.6) return false;

        return UTILS.hasCommonWordStructures(words);
    },

    hasCommonWordStructures: (words) => {
        const commonPatterns = ['pr', 'kr', 'tr', 'st', 'sp', 'the', 'and', 'ing', 'ed'];

        for (let word of words) {
            const cleanWord = word.toLowerCase().replace(/[^a-zčćžšđ]/g, '');
            if (cleanWord.length < 3) continue;

            for (let pattern of commonPatterns) {
                if (cleanWord.includes(pattern)) return true;
            }
        }
        return words.length <= 3;
    },

    // Phone Input Filter
    filterPhoneInput: (input) => {
        if (!input) return '';

        // Dozvoli samo: brojeve, +, -, space, /, (, )
        const filtered = input.replace(/[^\d+\-\s\/()]/g, '');
        return filtered;
    },

    // Phone Country Detection
    detectPhoneCountry: (phone) => {
        const clean = phone.replace(/[^\d+]/g, '');

        if (clean.startsWith('+381')) return 'SRB';
        if (clean.startsWith('+382')) return 'MNE';
        if (clean.startsWith('06') && clean.length === 9) return 'MNE';
        if (clean.startsWith('03') && clean.length === 9) return 'MNE';
        if (clean.startsWith('02') && clean.length === 9) return 'MNE';

        return null;
    },

    // Validiraj dužinu broja prema zemlji
    validatePhoneLengthByCountry: (phone, country) => {
        const clean = phone.replace(/[^\d]/g, '');
        const rules = CONFIG.validation.countryRules[country];

        if (!rules) return false;

        // Mobilni brojevi počinju sa 6
        const isMobile = clean.startsWith('6') || phone.includes('+3816') || phone.includes('+3826');

        const expectedLengths = isMobile ? rules.mobileLength : rules.landlineLength;
        return expectedLengths.includes(clean.length);
    },

    // Format phone number for display
    formatPhoneDisplay: (phone) => {
        if (!phone) return '';
        const clean = phone.replace(/[^\d+]/g, '');

        // INTERNACIONALNI FORMAT
        if (clean.startsWith('+382')) {
            // Fiksni brojevi: +382 32 123 456
            if (clean.startsWith('+3823')) {
                return clean.replace(/^(\+382)(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
            }
            // Mobilni brojevi: +382 67 123 456  
            return clean.replace(/^(\+382)(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
        }

        // INTERNACIONALNI SRBIJA
        if (clean.startsWith('+381')) {
            // Mobilni Srbija: +381 69 123 4567 (9-10 cifara)
            if (clean.startsWith('+3816')) {
                if (clean.length === 12) { // 9 cifara
                    return clean.replace(/^(\+381)(\d{2})(\d{3})(\d{3})/, '$1 $2 $3 $4');
                } else { // 10 cifara
                    return clean.replace(/^(\+381)(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
                }
            }
            // Fiksni Srbija
            return clean.replace(/^(\+381)(\d{2})(\d{3})(\d{3,4})/, '$1 $2 $3 $4');
        }

        // FIKSNI BROJEVI CRNA GORA (032 123 456)
        if (clean.startsWith('03') && clean.length === 9) {
            return clean.replace(/^(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }

        // FIKSNI BROJEVI PODGORICA (020 123 456)
        if (clean.startsWith('020') && clean.length === 9) {
            return clean.replace(/^(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }

        // MOBILNI BROJEVI (06x xxx xxx)
        if (clean.startsWith('06') && clean.length === 9) {
            return clean.replace(/^(\d{3})(\d{3})(\d{3})/, '$1 $2 $3');
        }

        return phone;
    },

    // UI Management
    closeAllUIElements: (elements) => {
        if (elements.language) UTILS.addHidden(elements.language);
        if (elements.callOptions) UTILS.addHidden(elements.callOptions);
        if (elements.callUsImg) elements.callUsImg.classList.remove("callUs-is-open");
        if (elements.callUsIcon) elements.callUsIcon.classList.remove("open-callUs-remove");
    },

    // Price Formatting
    formatPrice: (priceData, currentLanguage) => {
        if (!priceData) return '0.00 €';

        let price = priceData.price?.toFixed(2) || '0.00';
        let result = `${price} €`;

        if (priceData.prefix) {
            const prefixTranslations = {
                'sr': 'od',
                'en': 'from',
                'ru': 'от'
            };
            const prefix = prefixTranslations[currentLanguage] || 'od';
            result = `${prefix} ${result}`;
        }

        if (priceData.plus) {
            result += '+';
        }

        return result;
    },

    // Safe HTML creation for pricing modal
    createPricingContent: (pricesKey, currentPrices, currentLanguage, getTranslation) => {
        const container = document.createElement('div');
        container.className = 'pricing-modal-content-safe';

        const prices = currentPrices[pricesKey];
        const translations = getTranslation(`pricing.modal.prices.${pricesKey}`);

        if (!prices || !Array.isArray(prices) || prices.length === 0) {
            const noPrices = document.createElement('p');
            noPrices.className = 'pricing-no-prices';
            noPrices.textContent = 'Nema dostupnih cijena';
            container.appendChild(noPrices);
            return container;
        }

        prices.forEach((category, index) => {
            const categoryEl = document.createElement('div');
            categoryEl.className = 'pricing-category';

            const title = document.createElement('h4');
            title.className = 'pricing-category-title';
            title.textContent = translations?.[index]?.name || category.name || 'Category';
            categoryEl.appendChild(title);

            const subitemsList = document.createElement('ul');
            subitemsList.className = 'pricing-subitems';

            if (category.subitems && Array.isArray(category.subitems)) {
                category.subitems.forEach((item, itemIndex) => {
                    const listItem = document.createElement('li');
                    listItem.className = 'pricing-subitem';

                    const nameSpan = document.createElement('span');
                    nameSpan.className = 'pricing-subitem-name';

                    // Safe text content - no innerHTML
                    const translatedName = translations?.[index]?.subitems?.[itemIndex]?.name || item.name || '';
                    nameSpan.textContent = UTILS.cleanBulletPoints(translatedName);

                    const priceSpan = document.createElement('span');
                    priceSpan.className = 'pricing-subitem-price';
                    priceSpan.textContent = UTILS.formatPrice(item, currentLanguage);

                    listItem.appendChild(nameSpan);
                    listItem.appendChild(priceSpan);
                    subitemsList.appendChild(listItem);
                });
            }

            categoryEl.appendChild(subitemsList);
            container.appendChild(categoryEl);
        });

        return container;
    },

    // Helper to clean bullet points safely
    cleanBulletPoints: (text) => {
        if (!text) return '';
        // Convert HTML entities to plain text safely
        return text.replace(/&#x2022;/g, '•')
            .replace(/&bull;/g, '•')
            .replace(/&[#\w]+;/g, '');
    },

    // Structured Data Functions
    loadStructuredData: async function () {
        try {
            const response = await fetch('data/structured-data.json');
            if (!response.ok) throw new Error('Failed to load structured data');
            return await response.json();
        } catch (error) {
            console.warn('Using fallback structured data:', error);
            return this.getFallbackStructuredData();
        }
    },

    getFallbackStructuredData: function () {
        return {
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            "name": "Perfect Shine",
            "description": "Profesionalno dubinsko pranje automobila, garnitura, jahti i hotela na crnogorskom primorju",
            "url": "https://perfectshine.me",
            "telephone": "+38268069211",
            "email": "info@perfectshine.me",
            "address": {
                "@type": "PostalAddress",
                "streetAddress": "Radanovići bb, Ruska garaža",
                "addressLocality": "Kotor",
                "addressRegion": "Crna Gora",
                "postalCode": "85300",
                "addressCountry": "ME"
            },
            "geo": {
                "@type": "GeoCoordinates",
                "latitude": 42.369187,
                "longitude": 18.753562
            },
            "openingHours": [
                "Mo-Su 00:00-23:59"
            ],
            "areaServed": [
                "Tivat",
                "Kotor",
                "Budva",
                "Herceg Novi",
                "Podgorica",
                "Crna Gora"
            ],
            "serviceType": [
                "Dubinsko pranje automobila",
                "Pranje garnitura",
                "Održavanje jahti",
                "Čišćenje hotela",
                "Polimerizacija farova",
                "Dezinfekcija",
                "Dezinsekcija"
            ],
            "serviceArea": {
                "@type": "GeoCircle",
                "geoMidpoint": {
                    "@type": "GeoCoordinates",
                    "latitude": 42.369187,
                    "longitude": 18.753562
                },
                "geoRadius": "50000"
            },
            "sameAs": [
                "https://www.instagram.com/_dubinsko_pranje_tivat",
                "https://www.facebook.com/profile.php?id=100064044033023",
                "https://vm.tiktok.com/ZMYUrGDGo/"
            ],
            "priceRange": "€€",
            "currenciesAccepted": "EUR"
        };
    },

    injectStructuredData: function (structuredData) {
        this.removeExistingStructuredData();

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(structuredData);

        document.head.appendChild(script);
    },

    removeExistingStructuredData: function () {
        const existingScripts = document.querySelectorAll('script[type="application/ld+json"]');
        existingScripts.forEach(script => {
            if (script.textContent.includes('Perfect Shine') ||
                script.textContent.includes('LocalBusiness')) {
                script.remove();
            }
        });
    },

    // Language and Translation Utilities
    updateFormPlaceholders: function (currentLanguage) {
        const subjectInput = document.querySelector('input[name="subject"]');
        const phoneInput = document.querySelector('input[name="phone"]');
        const messageTextarea = document.querySelector('textarea[name="message"]');

        // ✅ Osigurajte da postoje prevodi
        if (!window.currentTranslations) {
            console.warn('Translations not loaded yet');
            return;
        }

        const contact = window.currentTranslations.contact || {};

        if (subjectInput) subjectInput.placeholder = contact.namePlaceholder || '';
        if (phoneInput) phoneInput.placeholder = contact.phonePlaceholder || '';
        if (messageTextarea) messageTextarea.placeholder = contact.messagePlaceholder || '';
    },

    // Scroll Utilities
    smoothScrollToElement: function (elementId, offset = 0) {
        const element = document.getElementById(elementId);
        if (element) {
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
    },

    // Local Storage Utilities
    setLocalStorage: function (key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.warn('LocalStorage set failed:', error);
            return false;
        }
    },

    getLocalStorage: function (key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.warn('LocalStorage get failed:', error);
            return defaultValue;
        }
    },

    removeLocalStorage: function (key) {
        try {
            localStorage.removeItem(key);
            return true;
        } catch (error) {
            console.warn('LocalStorage remove failed:', error);
            return false;
        }
    },

    // Date and Time Utilities
    formatDate: function (date, format = 'dd.MM.yyyy.') {
        const d = new Date(date);
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();

        return format
            .replace('dd', day)
            .replace('MM', month)
            .replace('yyyy', year);
    },

    getCurrentYear: function () {
        return new Date().getFullYear();
    },

    // String Utilities
    capitalizeFirst: function (str) {
        if (!str) return '';
        return str.charAt(0).toUpperCase() + str.slice(1);
    },

    truncateText: function (str, length) {
        if (!str || str.length <= length) return str;
        return str.substring(0, length) + '...';
    },

    // Number Utilities
    formatNumber: function (num, decimals = 2) {
        return parseFloat(num).toFixed(decimals);
    },

    randomNumber: function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    // Array Utilities
    shuffleArray: function (array) {
        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        return newArray;
    },

    uniqueArray: function (array) {
        return [...new Set(array)];
    },

    // Object Utilities
    deepClone: function (obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    mergeObjects: function (obj1, obj2) {
        return { ...obj1, ...obj2 };
    },

    // Event Utilities
    addMultipleEventListeners: function (element, events, handler) {
        events.forEach(event => {
            element.addEventListener(event, handler);
        });
    },

    removeMultipleEventListeners: function (element, events, handler) {
        events.forEach(event => {
            element.removeEventListener(event, handler);
        });
    },

    // CSS Class Utilities
    addMultipleClasses: function (element, classes) {
        classes.forEach(className => {
            element.classList.add(className);
        });
    },

    removeMultipleClasses: function (element, classes) {
        classes.forEach(className => {
            element.classList.remove(className);
        });
    },

    // Animation Utilities
    animateCSS: function (element, animation, prefix = 'animate__') {
        return new Promise((resolve) => {
            const animationName = `${prefix}${animation}`;

            element.classList.add(`${prefix}animated`, animationName);

            function handleAnimationEnd(event) {
                event.stopPropagation();
                element.classList.remove(`${prefix}animated`, animationName);
                resolve('Animation ended');
            }

            element.addEventListener('animationend', handleAnimationEnd, { once: true });
        });
    },

    // ==================== SEO META TAG MANAGEMENT ====================

    /**
     * Ažurira ili kreira meta tag (sprečava duplikate)
     */
    updateOrCreateMeta: function (attrName, attrValue, content) {
        let selector = `meta[${attrName}="${attrValue}"]`;
        let metaTag = document.querySelector(selector);

        if (!metaTag) {
            metaTag = document.createElement('meta');
            metaTag.setAttribute(attrName, attrValue);
            document.head.appendChild(metaTag);
        }
        metaTag.setAttribute('content', content);
        return metaTag;
    },

    /**
     * Postavlja osnovne OG tagove (jednom se poziva)
     */
    initializeOpenGraphTags: function () {
        const baseUrl = window.location.origin || 'https://perfectshine.me';

        const staticTags = [
            // OG Tags
            { attr: 'property', name: 'og:type', content: 'website' },
            { attr: 'property', name: 'og:site_name', content: 'Perfect Shine' },
            { attr: 'property', name: 'og:url', content: baseUrl },

            // OG Images - SVG logo iz root foldera
            { attr: 'property', name: 'og:image', content: `${baseUrl}/logo.svg` },
            { attr: 'property', name: 'og:image:type', content: 'image/svg+xml' },
            { attr: 'property', name: 'og:image:width', content: '200' },
            { attr: 'property', name: 'og:image:height', content: '200' },
            { attr: 'property', name: 'og:image:alt', content: 'Perfect Shine Logo - servis za dubinsko pranje' },

            // Fallback PNG za platforme bez SVG podrške
            { attr: 'property', name: 'og:image', content: `${baseUrl}/img/logo/logo.png` },
            { attr: 'property', name: 'og:image:type', content: 'image/png' },
            { attr: 'property', name: 'og:image:width', content: '200' },
            { attr: 'property', name: 'og:image:height', content: '200' },

            // Hero slika za bolje prikazivanje
            { attr: 'property', name: 'og:image', content: `${baseUrl}/img/about/puzi-hero+.webp` },
            { attr: 'property', name: 'og:image:type', content: 'image/webp' },
            { attr: 'property', name: 'og:image:width', content: '1200' },
            { attr: 'property', name: 'og:image:height', content: '630' },

            // Additional OG tags
            { attr: 'property', name: 'og:image:secure_url', content: `${baseUrl}/logo.svg` },
            { attr: 'property', name: 'og:image:secure_url', content: `${baseUrl}/img/about/puzi-hero+.webp` }
        ];

        staticTags.forEach(tag => {
            this.updateOrCreateMeta(tag.attr, tag.name, tag.content);
        });

        // Dodajte osnovne SEO meta tagove
        this.updateOrCreateMeta('name', 'robots', 'index, follow, max-image-preview:large');
        this.updateOrCreateMeta('name', 'googlebot', 'index, follow');
        this.updateOrCreateMeta('name', 'author', 'Siniša Terzić');
        this.updateOrCreateMeta('name', 'copyright', 'Perfect Shine');

        return true;
    },

    /**
     * Ažurira Open Graph tagove za trenutni jezik
     */
    updateOpenGraphForLanguage: function (lang, translations) {
        const ogLocaleMap = {
            'sr': 'sr_ME',
            'en': 'en_US',
            'ru': 'ru_RU'
        };

        const currentLocale = ogLocaleMap[lang] || 'sr_ME';

        // Ažuriraj dinamičke OG tagove
        this.updateOrCreateMeta('property', 'og:title',
            translations?.pageTitle || 'Perfect Shine - Dubinsko Pranje');

        this.updateOrCreateMeta('property', 'og:description',
            translations?.pageDescription ||
            'Profesionalno dubinsko pranje automobila, garnitura, jahti i hotela na crnogorskom primorju.');

        this.updateOrCreateMeta('property', 'og:locale', currentLocale);

        return true;
    },

    /**
     * Ažurira Geo tagove za trenutni jezik
     */
    updateGeoTagsForLanguage: function (lang) {
        const geoData = {
            'sr': {
                region: 'ME-10',
                placename: 'Kotor, Crna Gora',
                position: '42.369187;18.753562',
                ICBM: '42.369187, 18.753562'
            },
            'en': {
                region: 'ME-10',
                placename: 'Kotor, Montenegro',
                position: '42.369187;18.753562',
                ICBM: '42.369187, 18.753562'
            },
            'ru': {
                region: 'ME-10',
                placename: 'Котор, Черногория',
                position: '42.369187;18.753562',
                ICBM: '42.369187, 18.753562'
            }
        };

        const currentGeo = geoData[lang] || geoData['sr'];

        this.updateOrCreateMeta('name', 'geo.region', currentGeo.region);
        this.updateOrCreateMeta('name', 'geo.placename', currentGeo.placename);
        this.updateOrCreateMeta('name', 'geo.position', currentGeo.position);
        this.updateOrCreateMeta('name', 'ICBM', currentGeo.ICBM);

        return true;
    },

    /**
     * Postavlja HTML lang attribute za trenutni jezik
     */
    updateHtmlLangAttribute: function (lang) {
        const htmlElement = document.documentElement;
        if (htmlElement) {
            htmlElement.setAttribute('lang', lang);
        }
        return true;
    },

    /**
     * Inicijalizuje sve SEO tagove (poziva se jednom pri učitavanju)
     */
    initializeAllMetaTags: function () {
        // 1. Postavi HTML lang
        const savedLang = localStorage.getItem('preferredLanguage') || 'sr';
        this.updateHtmlLangAttribute(savedLang);

        // 2. Inicijalizuj OG tagove
        this.initializeOpenGraphTags();

        // 3. Postavi Geo tagove
        this.updateGeoTagsForLanguage(savedLang);

        // 4. Dodaj Canonical URL
        this.updateOrCreateMeta('rel', 'canonical', window.location.href);

        return true;
    }
};