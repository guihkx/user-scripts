// ==UserScript==
// @name Twitch Auto Claim Drops
// @description Automatically claims channel drops from Twitch
// @version 1.0.0
// @author guihkx
// @match https://www.twitch.tv/*
// @exclude-match https://www.twitch.tv/broadcast/*
// @exclude-match https://www.twitch.tv/directory
// @exclude-match https://www.twitch.tv/directory/*
// @exclude-match https://www.twitch.tv/downloads
// @exclude-match https://www.twitch.tv/jobs/*
// @exclude-match https://www.twitch.tv/login
// @exclude-match https://www.twitch.tv/p/*
// @exclude-match https://www.twitch.tv/settings/*
// @exclude-match https://www.twitch.tv/signup
// @exclude-match https://www.twitch.tv/subscriptions
// @exclude-match https://www.twitch.tv/turbo
// @exclude-match https://www.twitch.tv/user/*
// @exclude-match https://www.twitch.tv/videos/*
// @exclude-match https://www.twitch.tv/wallet
// @run-at document-idle
// @license MIT; https://opensource.org/licenses/MIT
// @namespace https://github.com/guihkx
// @icon https://mail.proton.me/assets/favicon.ico
// @downloadURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/twitch-auto-claim-drops.user.js
// @updateURL https://raw.githubusercontent.com/guihkx/user-scripts/master/scripts/twitch-auto-claim-drops.user.js
// @homepageURL https://github.com/guihkx/user-scripts
// @supportURL https://github.com/guihkx/user-scripts/issues
// ==/UserScript==

/**
 * Changelog:
 *
 * @version 1.0.0:
 * - First release
 */

;(() => {
  const log = console.log.bind(console, '[Twitch Auto Claim Drops]')

  log('Waiting for Twitch chat...')

  const id = setInterval(() => {
    const chatInput = document.querySelector('div.chat-input > div[class]:first-child')

    if (chatInput === null) {
      return
    }
    clearInterval(id)

    log('Ready.')

    const chatMonitor = new MutationObserver(observeChat)
    chatMonitor.observe(chatInput, {
      childList: true
    })
  }, 500)

  function observeChat (mutations) {
    log('mutations:', mutations)
    for (const mutation of mutations) {
      for (const addedNode of mutation.addedNodes) {
        if (addedNode.nodeType !== 1) {
          continue
        }
        return
      }
    }
  }
})()
