<?php
// send_message.php - AŽURIRANA VERZIJA SA PRAVILNIM RESETOVANJEM
header('Content-Type: application/json; charset=utf-8');
date_default_timezone_set('Europe/Belgrade');
session_start();

/**
 * BLACKLIST provjera - PAMETNA VERZIJA SA PODRŠKOM ZA PROFESIONALNE TERMINE
 */
function checkBlacklist($subject, $message, $current_language)
{
    $text_to_check = strtolower($subject . ' ' . $message);

    // ✅ PAMETNA LISTA - samo čiste uvrede, bez blokiranja profesionalnih termina
    $blacklist = [
        'sr' => [
            // SAMO KOMPLETNE UVREDE - bez djelova riječi koji bi blokirali "poliranje", "polimerizacija" itd.
            'pička',
            'pičko',
            'pičku',
            'pičke',
            'pizda',
            'pizdo',
            'pizdu',
            'do đavola',
            'do djavola',
            'mrš dođavola',
            'mrs dođavola',
            'mrš dodjavola',
            'mrs dodjavola',
            'jebem',
            'jebi',
            'jebote',
            'jebo',
            'mater',
            'mamu',
            'majku',
            'materinu',
            'govno',
            'sranje',
            'debil',
            'retard',
            'idiot',
            'kreten',
            'glup',
            'budala',
            'budalo',
            'kurva',
            'kurvo',
            'drolja',
            'droljo',
            'šupak',
            'supak',
            'šupku',
            'supku',
            'šupčino',
            'supčino',
            'smrad',
            'picka',
            'picke',
            'picko',
            'picku'
        ],
        'en' => [
            'fuck',
            'fucking',
            'shit',
            'asshole',
            'bitch',
            'bastard',
            'dick',
            'pussy',
            'cunt',
            'whore',
            'slut',
            'retard',
            'idiot',
            'moron',
            'stupid',
            'damn',
            'hell',
            'cock',
            'dickhead',
            'motherfucker',
            'bullshit',
            'cocksucker'
        ],
        'ru' => [
            'сука',
            'блядь',
            'пизда',
            'хуй',
            'ебать',
            'ебал',
            'мудак',
            'говно',
            'дерьмо',
            'урод',
            'идиот',
            'дебил',
            'тупой',
            'мразь',
            'сволочь',
            'тварь',
            'падла',
            'хуесос',
            'блядина'
        ]
    ];

    // ✅ PAMETNIJA PROVJERA - traži samo cijele riječi
    foreach ($blacklist as $language => $words) {
        foreach ($words as $word) {
            // Provjeri da li se riječ pojavljuje kao cijela riječ
            if (preg_match('/\b' . preg_quote($word, '/') . '\b/', $text_to_check)) {
                $messages = [
                    'sr' => 'Poruka sadrži neprihvatljiv sadržaj. Molimo koristite pristojan jezik.',
                    'en' => 'Message contains inappropriate content. Please use appropriate language.',
                    'ru' => 'Сообщение содержит неприемлемый контент. Пожалуйста, используйте соответствующий язык.'
                ];

                return [
                    'allowed' => false,
                    'message' => $messages[$current_language] ?? $messages['sr']
                ];
            }
        }
    }

    return ['allowed' => true, 'message' => ''];
}

if ($_SERVER["REQUEST_METHOD"] == "POST") {

    $response = ['success' => false, 'message' => ''];

    try {
        // Honeypot protection
        if (!empty($_POST['website'])) {
            $response['message'] = 'Spam detected';
            $response['reset_full_form'] = true; // ✅ RESETUJ CIJELU FORMU
            echo json_encode($response);
            exit;
        }

        // ✅ DOBİJENİ TRENUTNİ JEZİK IZ FORME
        $current_language = trim(htmlspecialchars($_POST['current_language'] ?? 'sr', ENT_QUOTES, 'UTF-8'));

        // Osiguraj da je jezik validan
        if (!in_array($current_language, ['sr', 'en', 'ru'])) {
            $current_language = 'sr';
        }

        // STROŽI RATE LIMITING
        $ip_address = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['HTTP_X_REAL_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $ip_key = 'ip_' . md5($ip_address);

        // Provjera IP-based rate limiting
        if (isset($_SESSION[$ip_key])) {
            $last_submit_time = $_SESSION[$ip_key]['last_submit_time'] ?? 0;
            $submit_count = $_SESSION[$ip_key]['submit_count'] ?? 0;
            $time_since_last = time() - $last_submit_time;

            // ✅ RESETUJ COUNTER AKO JE PROŠLO VISE OD 10 MINUTA
            if ($time_since_last > 600) {
                unset($_SESSION[$ip_key]);
            }
            // Kratki wait (2 minuta)
            else if ($time_since_last < 120) {
                $wait_time = 120 - $time_since_last;

                // EKSPLICITNE PORUKE SA TAČNIM VREMENOM
                if ($wait_time >= 60) {
                    $wait_minutes = ceil($wait_time / 60);
                    $wait_messages = [
                        'sr' => "Previše pokušaja. Pokušajte ponovo za {$wait_minutes} minuta.",
                        'en' => "Too many attempts. Try again in {$wait_minutes} minutes.",
                        'ru' => "Слишком много попыток. Попробуйте снова через {$wait_minutes} минут."
                    ];
                } else {
                    $wait_messages = [
                        'sr' => "Previše pokušaja. Sačekajte {$wait_time} sekundi.",
                        'en' => "Too many attempts. Please wait {$wait_time} seconds.",
                        'ru' => "Слишком много попыток. Подождите {$wait_time} секунд."
                    ];
                }

                $response['message'] = $wait_messages[$current_language] ?? $wait_messages['sr'];
                $response['wait_time'] = $wait_time; // EKSPLICITNO VRIJEME
                http_response_code(429);
                echo json_encode($response);
                exit;
            }

            // Duži wait (10 minuta) - nakon 3 pokušaja
            else if ($submit_count >= 3 && $time_since_last < 600) {
                $wait_time = 600 - $time_since_last;
                $wait_minutes = ceil($wait_time / 60);

                $block_messages = [
                    'sr' => "Previše pokušaja. Pokušajte ponovo za {$wait_minutes} minuta.",
                    'en' => "Too many attempts. Try again in {$wait_minutes} minutes.",
                    'ru' => "Слишком много попыток. Попробуйте снова через {$wait_minutes} минут."
                ];
                $response['message'] = $block_messages[$current_language] ?? $block_messages['sr'];
                $response['wait_time'] = $wait_time; // EKSPLICITNO VRIJEME
                http_response_code(429);
                echo json_encode($response);
                exit;
            }
        }

        // Basic sanitization
        $subject = trim(htmlspecialchars($_POST['subject'] ?? '', ENT_QUOTES, 'UTF-8'));
        $phone = trim(htmlspecialchars($_POST['phone'] ?? '', ENT_QUOTES, 'UTF-8'));
        $message = trim(htmlspecialchars($_POST['message'] ?? '', ENT_QUOTES, 'UTF-8'));

        // ✅ BLACKLIST SA PODRŠKOM ZA PROFESIONALNE TERMINE
        $blacklist_result = checkBlacklist($subject, $message, $current_language);
        if (!$blacklist_result['allowed']) {
            $response['message'] = $blacklist_result['message'];
            $response['reset_message_only'] = true; // ✅ RESETUJ SAMO PORUKU
            echo json_encode($response);
            exit;
        }

        // BASIC VALIDATION - poruke na trenutnom jeziku
        if (empty($subject) || empty($phone) || empty($message)) {
            $required_messages = [
                'sr' => 'Sva polja su obavezna.',
                'en' => 'All fields are required.',
                'ru' => 'Все поля обязательны для заполнения.'
            ];
            $response['message'] = $required_messages[$current_language] ?? $required_messages['sr'];
            $response['reset_full_form'] = true; // ✅ RESETUJ CIJELU FORMU
            echo json_encode($response);
            exit;
        }

        // Get client IP
        $user_agent = $_SERVER['HTTP_USER_AGENT'] ?? 'Nepoznato';

        // AŽURIRAJ RATE LIMITING
        if (!isset($_SESSION[$ip_key])) {
            $_SESSION[$ip_key] = [
                'last_submit_time' => time(),
                'submit_count' => 1
            ];
        } else {
            $_SESSION[$ip_key]['last_submit_time'] = time();
            $_SESSION[$ip_key]['submit_count']++;
        }

        // Prepare email
        $headers = "From: info@perfectshine.me\r\n";
        $headers .= "Reply-To: info@perfectshine.me\r\n";
        $headers .= "Content-Type: text/plain; charset=utf-8\r\n";

        $email_body = "=============================================        
📱 NOVA PORUKA SA SAJTA - PERFECT SHINE
---------------------------------------------

📋 PODACI KORISNIKA:
----------------------
• Ime:  $subject
• Telefon:  $phone

💬 PORUKA:
----------------------
$message

---------------------------------------------
📊 METAPODACI:
----------------------
• Vrijeme: " . date('d.m.Y H:i:s') . "
• IP adresa: $ip_address
• Jezik sajta: $current_language

=============================================";

        // Send email
        $email_sent = mail("info@perfectshine.me", "📱 Nova poruka sa sajta - " . substr($subject, 0, 30), $email_body, $headers);

        if ($email_sent) {
            // ✅ RESETUJ RATE LIMITING NAKON USPEŠNOG SLANJA
            // Ovo će dozvoliti korisniku da pošalje novu poruku odmah nakon što se timer završi
            if (isset($_SESSION[$ip_key])) {
                // Resetuj samo count, ne briži kompletan session
                $_SESSION[$ip_key]['submit_count'] = 0;
                $_SESSION[$ip_key]['last_submit_time'] = time();
            }

            // ✅ USPEŠNA PORUKA NA TRENUTNOM JEZIKU
            $success_messages = [
                'sr' => 'Poruka je uspješno poslata! Kontaktiraćemo vas uskoro.',
                'en' => 'Message sent successfully! We will contact you soon.',
                'ru' => 'Сообщение успешно отправлено! Мы свяжемся с вами в ближайшее время.'
            ];
            $response['success'] = true;
            $response['message'] = $success_messages[$current_language] ?? $success_messages['sr'];
            $response['reset_full_form'] = true; // ✅ RESETUJ CIJELU FORMU NAKON USPEHA
        } else {
            // ✅ GREŠKA NA TRENUTNOM JEZIKU
            $error_messages = [
                'sr' => 'Došlo je do greške pri slanju poruke. Molimo pokušajte ponovo.',
                'en' => 'An error occurred while sending the message. Please try again.',
                'ru' => 'Произошла ошибка при отправке сообщения. Пожалуйста, попробуйте еще раз.'
            ];
            $response['message'] = $error_messages[$current_language] ?? $error_messages['sr'];
            $response['reset_full_form'] = true; // ✅ RESETUJ CIJELU FORMU
        }
    } catch (Exception $e) {
        error_log("Contact form error: " . $e->getMessage());
        $catch_messages = [
            'sr' => 'Došlo je do greške. Molimo pokušajte ponovo.',
            'en' => 'An error occurred. Please try again.',
            'ru' => 'Произошла ошибка. Пожалуйста, попробуйте еще раз.'
        ];
        $response['message'] = $catch_messages[$current_language] ?? $catch_messages['sr'];
        $response['reset_full_form'] = true; // ✅ RESETUJ CIJELU FORMU
    }

    echo json_encode($response);
} else {
    http_response_code(405);
    echo json_encode([
        'success' => false,
        'message' => 'Method not allowed'
    ]);
}
