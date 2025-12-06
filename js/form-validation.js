// form-validation.js - AŽURIRANA VERZIJA SA RATE LIMITINGOM
const FORM_VALIDATION = {
    currentLanguage: 'sr',

    /**
     * Rate Limiting Management za formu
     */
    rateLimitManager: {
        timer: null,
        remainingTime: 0,

        /**
         * Aktivira rate limiting na formi
         */
        activateRateLimit: function (waitTime, currentLanguage) {
            const submitButton = document.querySelector('.sendMsg');
            const form = document.querySelector('form.info');

            if (!submitButton || !form) return;

            // Onemogući formu
            form.classList.add('rate-limited');
            submitButton.disabled = true;
            submitButton.classList.add('loading', 'rate-limited');

            this.remainingTime = waitTime;

            // Ažuriraj tekst dugmeta
            this.updateRateLimitButton(submitButton, currentLanguage);

            // Pokreni timer
            this.startCountdown(submitButton, form, currentLanguage);
        },

        /**
         * Ažurira tekst dugmeta tokom rate limitinga
         */
        updateRateLimitButton: function (submitButton, currentLanguage) {
            const waitMessages = {
                'sr': `Sačekajte ${this.remainingTime}s`,
                'en': `Wait ${this.remainingTime}s`,
                'ru': `Подождите ${this.remainingTime}с`
            };

            // SAMO TEKST, BEZ DIV ELEMENTA
            submitButton.textContent = waitMessages[currentLanguage] || waitMessages['sr'];
        },

        /**
         * Pokreće odbrojavanje
         */
        startCountdown: function (submitButton, form, currentLanguage) {
            if (this.timer) {
                clearInterval(this.timer);
            }

            this.timer = setInterval(() => {
                this.remainingTime--;

                if (this.remainingTime <= 0) {
                    this.deactivateRateLimit(submitButton, form, currentLanguage);
                    return;
                }

                this.updateRateLimitButton(submitButton, currentLanguage);
            }, 1000);
        },

        /**
         * Deaktivira rate limiting
         */
        deactivateRateLimit: function (submitButton, form, currentLanguage) {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }

            // Ukloni rate limiting klase
            form.classList.remove('rate-limited');
            submitButton.classList.remove('loading', 'rate-limited');

            // Resetuj dugme na normalno stanje
            this.resetButtonState(submitButton, form, currentLanguage);
        },

        /**
         * Resetuje stanje dugmeta
         */
        resetButtonState: function (submitButton, form, currentLanguage) {
            const sendButtonText = FORM_VALIDATION.getTranslation('contact.sendButton');
            submitButton.innerHTML = sendButtonText;

            // Ažuriraj stanje dugmeta na osnovu forme
            FORM_VALIDATION.updateSubmitButtonState(form);
        },

        /**
         * Proverava da li je forma u rate limited stanju
         */
        isRateLimited: function () {
            const form = document.querySelector('form.info');
            return form?.classList.contains('rate-limited') || false;
        },

        /**
         * Zaustavlja sve timere (poziva se pri promeni jezika)
         */
        stopAllTimers: function () {
            if (this.timer) {
                clearInterval(this.timer);
                this.timer = null;
            }
        }
    },

    /**
     * Postavlja trenutni jezik za validacione poruke
     */
    setCurrentLanguage: function (lang) {
        this.currentLanguage = lang;

        // ZAUSTAVI SVE RATE LIMITING TIMERE PRI PROMENI JEZIKA
        this.rateLimitManager.stopAllTimers();

        this.updateAllSubmitButtons();
    },

    /**
     * Ažurira sva submit dugmad na stranici
     */
    updateAllSubmitButtons: function () {
        const forms = document.querySelectorAll('form.info');
        forms.forEach(form => {
            // PROVERI DA LI JE FORMA U RATE LIMITED STANJU
            if (form.classList.contains('rate-limited')) {
                const submitButton = form.querySelector('.sendMsg');
                if (submitButton) {
                    this.rateLimitManager.updateRateLimitButton(submitButton, this.currentLanguage);
                }
            } else {
                this.updateSubmitButtonState(form);
            }
        });
    },

    /**
     * Dobija prevedeni tekst za dati ključ
     */
    getTranslation: function (key) {
        if (window.currentTranslations) {
            const value = this.getNestedValue(window.currentTranslations, key);
            if (value) return value;
        }

        if (typeof getTranslation === 'function') {
            const translation = getTranslation(key);
            if (translation) return translation;
        }

        return this.getFallbackTranslation(key);
    },

    /**
     * Fallback prevodi
     */
    getFallbackTranslation: function (key) {
        const fallbackTranslations = {
            'contact.validation.required': 'Sva polja su obavezna.',
            'contact.validation.subjectLength': 'Ime mora imati najmanje 2 karaktera.',
            'contact.validation.subjectRandom': 'Unesite vaše pravo ime i prezime.',
            'contact.validation.phoneInvalid': 'Unesite ispravan broj telefona (mobilni: 067 123 456, fiksni: 032 123 456)',
            'contact.validation.messageLength': 'Poruka mora imati najmanje 5 karaktera.',
            'contact.validation.messageRandom': 'Poruka ne smije sadržavati nasumičan tekst, ponavljajuće karaktere ili izolovana slova.',
            'contact.sending': 'Slanje...',
            'contact.error': 'Došlo je do greške. Pokušajte ponovo.',
            'contact.success': 'Poruka je uspešno poslata! Kontaktiraćemo vas uskoro.',
            'contact.enterData': 'Unesite podatke',
            'contact.sendButton': 'Pošalji'
        };

        return fallbackTranslations[key] || key;
    },

    /**
     * Pomoćna funkcija za dobijanje ugniježđene vrijednosti
     */
    getNestedValue: function (obj, path) {
        if (!obj || !path) return null;
        return path.split('.').reduce((current, key) => current?.[key], obj);
    },

    /**
     * Ažurira postojeće validation error poruke kada se promeni jezik
     */
    updateExistingValidationErrors: function () {
        const errorElements = document.querySelectorAll('.field-error');
        const fields = document.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]');

        errorElements.forEach(error => error.remove());

        fields.forEach(field => {
            field.classList.remove('invalid', 'valid');
            if (field.value.trim() !== '') {
                this.validateField(field);
            }
        });

        // AŽURIRAJ DUGMAD NAKON PROMENE JEZIKA
        this.updateAllSubmitButtons();
    },

    /**
     * Inicijalizuje kontakt formu sa svim event listener-ima
     */
    setupContactForm: function () {
        const contactForm = document.querySelector('form.info');
        if (!contactForm) return;

        this.setupClearButtons(contactForm);
        this.setupRealTimeValidation(contactForm);

        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // PROVERI DA LI JE FORMA RATE LIMITED
            if (this.rateLimitManager.isRateLimited()) {
                return;
            }

            const validationResult = this.validateContactForm(contactForm);
            if (!validationResult.isValid) {
                this.showNotification(validationResult.message, 'error');
                return;
            }

            await this.submitFormData(contactForm);
        });

        // Inicijalno ažuriranje stanja dugmeta
        this.updateSubmitButtonState(contactForm);

        console.log('Form validation initialized for language:', this.currentLanguage);
    },

    /**
     * Ažurira stanje submit dugmeta na osnovu popunjenosti forme
     */
    updateSubmitButtonState: function (form) {
        const submitButton = form.querySelector('.sendMsg');
        if (!submitButton) return;

        const subject = form.querySelector('input[name="subject"]').value.trim();
        const phone = form.querySelector('input[name="phone"]').value.trim();
        const message = form.querySelector('textarea[name="message"]').value.trim();

        const allFieldsFilled = subject !== '' && phone !== '' && message !== '';

        if (!allFieldsFilled) {
            // Neka polja su prazna - "Unesite podatke" + disabled
            submitButton.disabled = true;
            submitButton.textContent = this.getTranslation('contact.enterData');
            submitButton.classList.add('disabled');
        } else {
            // Sva polja su popunjena - provjeri validnost
            const subjectValid = this.validateFieldWithoutUpdate(form.querySelector('input[name="subject"]'));
            const phoneValid = this.validateFieldWithoutUpdate(form.querySelector('input[name="phone"]'));
            const messageValid = this.validateFieldWithoutUpdate(form.querySelector('textarea[name="message"]'));

            const allFieldsValid = subjectValid && phoneValid && messageValid;

            if (allFieldsValid) {
                // Sva polja su validna - "Pošalji" + enabled
                submitButton.disabled = false;
                submitButton.textContent = this.getTranslation('contact.sendButton');
                submitButton.classList.remove('disabled');
            } else {
                // Neka polja su nevalidna - "Unesite podatke" + disabled
                submitButton.disabled = true;
                submitButton.textContent = this.getTranslation('contact.enterData');
                submitButton.classList.add('disabled');
            }
        }
    },

    /**
     * Validira polje bez ažuriranja dugmeta (za internu upotrebu)
     */
    validateFieldWithoutUpdate: function (field) {
        if (!field) return false;

        const value = field.value.trim();
        const fieldName = field.name;

        if (value === '') {
            return false;
        }

        switch (fieldName) {
            case 'subject':
                return this.validateNameField(value, 2);
            case 'phone':
                return this.validatePhoneNumber(value);
            case 'message':
                return this.validateTextContent(value, 5);
            default:
                return true;
        }
    },

    /**
     * Postavlja clear dugmad za input polja forme
     */
    setupClearButtons: function (form) {
        const clearButtons = form.querySelectorAll('.clear-input, .clear-textarea');

        clearButtons.forEach(button => {
            button.addEventListener('click', () => {
                const input = button.closest('.input-wrapper, .textarea-wrapper').querySelector('input, textarea');
                this.clearInputField(input);
            });
        });

        form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]').forEach(input => {
            input.addEventListener('input', () => {
                this.updateClearButtonVisibility(input);
                this.updateSubmitButtonState(form);
            });
            this.updateClearButtonVisibility(input);
        });
    },

    /**
     * Briše sadržaj input polja i resetuje stanje
     */
    clearInputField: function (input) {
        const form = input.closest('form');
        input.value = '';
        input.focus();
        input.classList.remove('valid', 'invalid');
        this.removeFieldError(input);
        this.updateClearButtonVisibility(input);
        this.updateSubmitButtonState(form);
        input.dispatchEvent(new Event('input', { bubbles: true }));
    },

    /**
     * Ažurira vidljivost clear dugmeta na osnovu sadržaja input polja
     */
    updateClearButtonVisibility: function (input) {
        const clearButton = input.closest('.input-wrapper, .textarea-wrapper').querySelector('.clear-input, .clear-textarea');
        const hasValue = input.value.trim() !== '';
        clearButton.style.opacity = hasValue ? '1' : '0';
        clearButton.style.visibility = hasValue ? 'visible' : 'hidden';
    },

    /**
     * Postavlja real-time validaciju za formu
     */
    setupRealTimeValidation: function (form) {
        const inputs = form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]');

        inputs.forEach(input => {
            input.addEventListener('blur', () => this.validateField(input));

            input.addEventListener('input', function () {
                if (this.name === 'phone') {
                    this.value = UTILS.filterPhoneInput(this.value);
                }

                if (this.classList.contains('invalid')) {
                    this.classList.remove('invalid');
                    FORM_VALIDATION.removeFieldError(this);
                }

                FORM_VALIDATION.updateClearButtonVisibility(this);
                FORM_VALIDATION.updateSubmitButtonState(form);
            });
        });
    },

    /**
     * Validira pojedinačno polje forme i prikazuje odgovarajuće errore
     */
    validateField: function (field) {
        const form = field.closest('form');
        const value = field.value.trim();
        const fieldName = field.name;

        if (value === '') {
            field.classList.remove('valid', 'invalid');
            this.removeFieldError(field);
            this.updateSubmitButtonState(form);
            return false;
        }

        let isValid = false;
        let message = '';

        switch (fieldName) {
            case 'subject':
                isValid = this.validateNameField(value, 2);
                message = isValid ? '' : (value.length < 2
                    ? this.getTranslation('contact.validation.subjectLength')
                    : this.getTranslation('contact.validation.subjectRandom'));
                break;
            case 'phone':
                isValid = this.validatePhoneNumber(value);
                message = isValid ? '' : this.getTranslation('contact.validation.phoneInvalid');
                break;
            case 'message':
                isValid = this.validateTextContent(value, 5);
                message = isValid ? '' : (value.length < 5
                    ? this.getTranslation('contact.validation.messageLength')
                    : this.getTranslation('contact.validation.messageRandom'));
                break;
        }

        this.updateFieldAppearance(field, isValid, message);
        this.updateSubmitButtonState(form);
        return isValid;
    },

    /**
     * Ažurira vizuelni izgled polja na osnovu validacije
     */
    updateFieldAppearance: function (field, isValid, message) {
        field.classList.remove('valid', 'invalid');
        this.removeFieldError(field);

        if (isValid) {
            field.classList.add('valid');
        } else {
            field.classList.add('invalid');
            this.showFieldError(field, message);
        }
    },

    /**
     * Validira kompletnu formu prije slanja
     */
    validateContactForm: function (form) {
        const subject = form.querySelector('input[name="subject"]').value.trim();
        const phone = form.querySelector('input[name="phone"]').value.trim();
        const message = form.querySelector('textarea[name="message"]').value.trim();

        if (!subject || !phone || !message) {
            return { isValid: false, message: this.getTranslation('contact.validation.required') };
        }

        if (!this.validateNameField(subject, 2)) {
            this.validateField(form.querySelector('input[name="subject"]'));
            return { isValid: false, message: this.getTranslation('contact.validation.subjectRandom') };
        }

        if (!this.validatePhoneNumber(phone)) {
            this.validateField(form.querySelector('input[name="phone"]'));
            return { isValid: false, message: this.getTranslation('contact.validation.phoneInvalid') };
        }

        if (!this.validateTextContent(message, 5)) {
            this.validateField(form.querySelector('textarea[name="message"]'));
            return { isValid: false, message: this.getTranslation('contact.validation.messageRandom') };
        }

        return { isValid: true, message: '' };
    },

    /**
     * Validira telefonski broj koristeći pattern-e iz config.js
     */
    validatePhoneNumber: function (phone) {
        const cleanPhone = phone.replace(/\s+/g, '');
        return CONFIG.validation.phonePatterns.some(pattern => pattern.test(cleanPhone));
    },

    /**
     * Validira tekstualni sadržaj sa anti-spam zaštitom - PAMETNIJA VERZIJA
     */
    validateTextContent: function (text, minLength) {
        if (text.length < minLength) return false;

        const cleanText = text.toLowerCase().replace(/\s+/g, '');

        // ✅ ANTI-SPAM PROVJERE

        // 4+ ponavljajuća karaktera (aaaa, 1111)
        if (/(.)\1{3,}/.test(cleanText)) return false;

        // Očigledni keyboard pattern (qwertyuiop, asdfghjkl)
        if (/(qwertyuiop|asdfghjkl|zxcvbnm|123456789|abcdefghij)/i.test(text)) return false;

        // Očigledne sekvence (123456, abcdef)
        if (/(123456|234567|345678|456789|567890|abcdef|bcdefg|cdefgh|defghi|efghij|fghijk|ghijkl)/i.test(cleanText)) {
            return false;
        }

        // ✅ STROŽIJA PROVJERA ZA PONAVLJANJE KARAKTERA U RIJEČIMA
        const words = text.trim().split(/\s+/);
        for (let word of words) {
            // Provjeri da li riječ ima previše ponavljajućih karaktera (messageeee, helloooo)
            if (/([a-zA-Z])\1{2,}/.test(word)) {
                return false;
            }
        }

        // ✅ NOVO: PROVJERA DA LI PORUKA SADRŽI DOVOLJNO TEKSTA (NE SAMO BROJEVE)
        const letters = text.replace(/[^a-zA-ZčćžšđČĆŽŠĐ]/g, '');
        const numbers = text.replace(/[^0-9]/g, '');

        // Ako poruka ima previše brojeva u odnosu na slova
        if (numbers.length > letters.length && text.length > 8) {
            return false;
        }

        // Ako poruka ima manje od 30% slova (previše brojeva/simbola)
        const letterRatio = letters.length / text.length;
        if (letterRatio < 0.3 && text.length > 10) {
            return false;
        }

        // ✅ SVE OSTALO JE DOZVOLJENO!
        return true;
    },

    /**
     * Validira imena sa specifičnim pravilima
     */
    validateNameField: function (text, minLength) {
        if (text.length < minLength) return false;

        // 1. Osnovni karakteri
        const namePattern = /^[a-zA-ZčćžšđČĆŽŠĐ\s\-'\.]+$/;
        if (!namePattern.test(text)) return false;

        const cleanText = text.toLowerCase().replace(/[^a-zčćžšđ]/g, '');

        // 2. Lista poznatih kratkih imena (whitelist)
        const commonShortNames = new Set([
            // ✅ Ženska imena (abecedno):
            'aida', 'anna', 'asia',
            'lola',
            'nikolina',
            'olja',

            // ✅ Muška imena (abecedno):
            'nikola',
            'uroš',
        ]);

        // Ako je u whitelistu, brzo prihvati
        if (commonShortNames.has(cleanText)) {
            return true;
        }

        // 3. ANTI-SPAM FILTERI ZA OSTALA IMENA

        // 3.1 Ponavljajući karakteri (2+ uzastopno = nevalidno)
        if (/(.)\1{1,}/.test(cleanText)) return false; // "aa", "ll", "ćć" = ❌

        // 3.2 Previše istih karaktera u celom imenu (>33%)
        const uniqueChars = new Set(cleanText).size;
        if (uniqueChars / cleanText.length < 0.33) return false;

        // 3.3 Keyboard pattern
        if (UTILS.isKeyboardPattern(cleanText)) return false;

        // 3.4 Sekvencijalni pattern
        if (UTILS.isSequentialPattern(cleanText)) return false;

        // 4. STRUKTURALNE PROVJERE

        // 4.1 Mora imati i samoglasnike i suglasnike
        const vowelCount = (cleanText.match(/[aeioučćžšđ]/gi) || []).length;
        const consonantCount = (cleanText.match(/[bcdfghjklmnpqrstvwxyz]/gi) || []).length;

        if (vowelCount === 0 || consonantCount === 0) return false;

        // 4.2 Odnos samoglasnika i suglasnika mora biti razuman
        const vowelRatio = vowelCount / cleanText.length;
        if (vowelRatio < 0.15 || vowelRatio > 0.7) return false;

        // 5. PROVJERA ZA ČUDNE KOMBINACIJE

        // 5.1 Ne dozvoli sve iste slova
        if (new Set(cleanText).size === 1) return false;

        // 5.2 Provjeri da li ime ima "normalnu" strukturu
        if (!this.hasReasonableNameStructure(cleanText)) return false;

        return true;
    },

    /**
     * Provjerava da li tekst ima strukturu koja liči na ime
     */
    hasReasonableNameStructure: function (text) {
        if (text.length <= 3) return true;

        // Različiti karakteri
        const uniqueChars = new Set(text).size;
        if (uniqueChars < 2) return false;

        // Alternacija samoglasnik-suglasnik (barem nešto)
        let hasAlternation = false;
        for (let i = 1; i < text.length; i++) {
            const prevIsVowel = /[aeioučćžšđ]/.test(text[i - 1]);
            const currIsVowel = /[aeioučćžšđ]/.test(text[i]);
            if (prevIsVowel !== currIsVowel) {
                hasAlternation = true;
                break;
            }
        }

        if (!hasAlternation && text.length > 4) return false;

        return true;
    },

    /**
     * Ekstraktuje vreme čekanja iz poruke
     */
    extractWaitTime: function (message) {
        if (!message) return 120; // fallback 120s

        // PROVERI DA LI SE RADI O MINUTAMA
        if (message.includes('minuta') || message.includes('minute') || message.includes('минут')) {
            const minuteMatch = message.match(/(\d+)\s*(minuta|minute|минут)/i);
            if (minuteMatch) {
                return parseInt(minuteMatch[1]) * 60; // Pretvori minute u sekunde
            }
        }

        // PROVERI DA LI SE RADI O SEKUNDAMA
        if (message.includes('sekundi') || message.includes('seconds') || message.includes('секунд')) {
            const secondsMatch = message.match(/(\d+)\s*(sekundi|seconds|секунд)/i);
            if (secondsMatch) {
                return parseInt(secondsMatch[1]);
            }
        }

        // FALLBACK: traži bilo koji broj
        const timeMatch = message.match(/(\d+)/);
        return timeMatch ? parseInt(timeMatch[1]) : 120;
    },

    /**
     * Šalje podatke forme na server i rukuje odgovorom
     */
    submitFormData: async function (form) {
        const submitButton = form.querySelector('.sendMsg');
        const originalText = submitButton.textContent;
        const messageField = form.querySelector('textarea[name="message"]');

        submitButton.disabled = true;
        submitButton.textContent = this.getTranslation('contact.sending');
        submitButton.classList.add('loading');

        try {
            const formData = new FormData(form);
            const response = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            const result = await response.json();

            if (result.success) {
                this.showNotification(this.getTranslation('contact.success'), 'success');
                this.resetForm(form);
            } else if (response.status === 429) {
                const waitTime = result.wait_time || this.extractWaitTime(result.message);
                if (waitTime > 0) {
                    this.rateLimitManager.activateRateLimit(waitTime, this.currentLanguage);
                    this.showNotification(result.message, 'error');
                    return;
                }
            } else {
                // ✅ KORISTITE SERVER FLAGS ZA SVE
                if (result.reset_message_only) {
                    this.showNotification(result.message, 'error');
                    if (messageField) {
                        this.clearInputField(messageField);
                    }
                } else {
                    this.showNotification(result.message, 'error');
                    this.resetForm(form);
                }
            }

        } catch (error) {
            console.error('Form submission error:', error);

            // PROVERA ZA RATE LIMITING GREŠKU
            if (error.message && error.message.includes('wait')) {
                const waitTimeMatch = error.message.match(/(\d+)/);
                if (waitTimeMatch) {
                    const waitTime = parseInt(waitTimeMatch[1]);
                    this.rateLimitManager.activateRateLimit(waitTime, this.currentLanguage);
                }
            }

            this.showNotification(this.getTranslation('contact.error'), 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = this.getTranslation('contact.sendButton');
            submitButton.classList.remove('loading');
            this.updateSubmitButtonState(form);
        }
    },

    /**
     * Resetuje formu na početno stanje
     */
    resetForm: function (form) {
        form.reset();
        this.clearFieldErrors();
        this.updateClearButtonsVisibility(form);
        this.updateSubmitButtonState(form);
    },

    /**
     * Ažurira vidljivost svih clear dugmadi u formi
     */
    updateClearButtonsVisibility: function (form) {
        form.querySelectorAll('input[name="subject"], input[name="phone"], textarea[name="message"]').forEach(input => {
            this.updateClearButtonVisibility(input);
        });
    },

    /**
     * Prikazuje error poruku ispod određenog polja
     */
    showFieldError: function (field, message) {
        this.removeFieldError(field);
        const errorElement = document.createElement('span');
        errorElement.className = 'field-error';
        errorElement.textContent = message;
        field.parentNode.insertBefore(errorElement, field.nextSibling);
    },

    /**
     * Uklanja error poruku ispod određenog polja
     */
    removeFieldError: function (field) {
        const existingError = field.parentNode.querySelector('.field-error');
        if (existingError) existingError.remove();
    },

    /**
     * Uklanja sve error poruke iz forme
     */
    clearFieldErrors: function () {
        document.querySelectorAll('.field-error').forEach(error => error.remove());
        document.querySelectorAll('.info input, .info textarea').forEach(field => {
            field.classList.remove('invalid', 'valid');
        });
    },

    /**
     * Prikazuje notifikaciju korisniku (success/error/info)
     */
    showNotification: function (message, type = 'info') {
        const existingNotification = document.querySelector('.form-notification');
        if (existingNotification) existingNotification.remove();

        const notification = document.createElement('div');
        notification.className = `form-notification form-notification-${type}`;
        notification.textContent = message;

        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease-in';
                setTimeout(() => notification.remove(), 300);
            }
        }, 5000);
    }
};