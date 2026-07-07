// 공지 관리 파일
// - 공지 없앨 때: NOTICE = null
// - 내용 바꿀 때: version 날짜/번호 업데이트 (그래야 일주일 스킵 무시하고 다시 표시)

export const NOTICE = {
  version: '2026-07-07',
  ko: '🎉 멀티 지갑 업그레이드!\n\n이제 여러 개의 Pi 지갑을 별칭과 함께 등록하고, 지갑별 잔액·토큰·LP 현황을 한눈에 확인할 수 있습니다.\n지갑 목록은 서버에 백업/복원도 가능합니다.\n\n⚠️ 지갑 등록 시 G로 시작하는 공개주소만 입력하세요. 개인키나 비밀구절은 절대 입력하지 마세요.',
  en: '🎉 Multi-Wallet Upgrade!\n\nYou can now register multiple Pi wallets with custom nicknames and view balance, tokens, and LP positions for each wallet at a glance.\nYour wallet list can be backed up and restored via cloud.\n\n⚠️ Only enter your public address starting with G. Never enter a private key or seed phrase.',
  id: '🎉 Peningkatan Multi-Wallet!\n\nKini Anda dapat mendaftarkan beberapa dompet Pi dengan nama panggilan dan melihat saldo, token, serta posisi LP setiap dompet.\nDaftar dompet dapat dicadangkan dan dipulihkan via cloud.\n\n⚠️ Masukkan hanya alamat publik berawalan G. Jangan pernah memasukkan kunci privat atau frasa rahasia.',
  zh: '🎉 多钱包升级！\n\n现在您可以注册多个Pi钱包并设置别名，一目了然地查看每个钱包的余额、代币和LP状况。\n钱包列表支持云端备份与恢复。\n\n⚠️ 仅输入G开头的公开地址，切勿输入私钥或助记词。',
  ja: '🎉 マルチウォレットアップグレード！\n\n複数のPiウォレットをニックネーム付きで登録し、各ウォレットの残高・トークン・LP状況を一覧で確認できます。\nウォレットリストのクラウドバックアップ・復元も可能です。\n\n⚠️ Gから始まる公開アドレスのみ入力してください。秘密鍵やシードフレーズは絶対に入力しないでください。',
  es: '🎉 ¡Actualización Multi-Cartera!\n\nAhora puedes registrar varias carteras Pi con apodos y ver el saldo, tokens y posiciones LP de cada una de un vistazo.\nLa lista de carteras se puede respaldar y restaurar en la nube.\n\n⚠️ Solo ingresa tu dirección pública que comienza con G. Nunca ingreses clave privada ni frase semilla.',
  vi: '🎉 Nâng cấp Đa Ví!\n\nBạn có thể đăng ký nhiều ví Pi với biệt danh và xem số dư, token, vị thế LP của từng ví.\nDanh sách ví có thể sao lưu và khôi phục qua cloud.\n\n⚠️ Chỉ nhập địa chỉ công khai bắt đầu bằng G. Tuyệt đối không nhập khóa riêng tư hay cụm từ bí mật.',
  hi: '🎉 मल्टी-वॉलेट अपग्रेड!\n\nअब आप कई Pi वॉलेट को कस्टम उपनाम के साथ पंजीकृत कर सकते हैं और प्रत्येक वॉलेट का बैलेंस, टोकन और LP स्थिति एक नज़र में देख सकते हैं।\nवॉलेट सूची को क्लाउड पर बैकअप और पुनर्स्थापित किया जा सकता है।\n\n⚠️ केवल G से शुरू होने वाला सार्वजनिक पता दर्ज करें। कभी भी निजी कुंजी या बीज वाक्यांश न डालें।',
  pt: '🎉 Atualização Multi-Carteira!\n\nAgora você pode registrar várias carteiras Pi com apelidos e ver saldo, tokens e posições LP de cada uma.\nA lista de carteiras pode ser salva e restaurada via cloud.\n\n⚠️ Insira apenas o endereço público começando com G. Nunca insira chave privada ou frase semente.',
  tl: '🎉 Multi-Wallet Upgrade!\n\nMaaari ka nang mag-rehistro ng maraming Pi wallet na may palayaw at makita ang balanse, tokens, at LP positions ng bawat wallet.\nAng listahan ng wallet ay maaaring i-backup at i-restore sa cloud.\n\n⚠️ Ilagay lamang ang public address na nagsisimula sa G. Huwag ilagay ang private key o seed phrase.',
  fr: '🎉 Mise à jour Multi-Portefeuille !\n\nVous pouvez désormais enregistrer plusieurs portefeuilles Pi avec des surnoms et consulter le solde, les tokens et les positions LP de chacun.\nLa liste des portefeuilles peut être sauvegardée et restaurée via le cloud.\n\n⚠️ Saisissez uniquement votre adresse publique commençant par G. Ne saisissez jamais de clé privée ni de phrase secrète.',
};
