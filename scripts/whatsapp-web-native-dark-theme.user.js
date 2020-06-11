// ==UserScript==
// @name         WhatsApp Web Native Dark Theme
// @description  Automatically enables the native dark theme of WhatsApp Web.
// @version      1.0.0
// @author       guihkx
// @match        https://web.whatsapp.com/
// @license      MIT; https://opensource.org/licenses/MIT
// @grant        unsafeWindow
// @namespace    https://github.com/guihkx
// @icon         https://www.iconsdb.com/icons/download/black/whatsapp-512.png
// @downloadURL  https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/whatsapp-web-native-dark-theme.user.js
// @updateURL    https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/whatsapp-web-native-dark-theme.user.js
// @homepageURL  https://github.com/guihkx/user-scripts
// @supportURL   https://github.com/guihkx/user-scripts/issues
// ==/UserScript==

;(() => {
  unsafeWindow.addEventListener('load', () => {
    document.body.classList.add('dark')
  })
})()
